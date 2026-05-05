<template>
  <div class="content-box" ref="contentBox">
    <div ref="container" class="content-html"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  html: {
    type: String,
    required: true
  },
  /** When true, external images are loaded immediately without the block banner */
  imagesAllowed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:imagesAllowed', 'remoteImagesFound'])

const container = ref(null)
const contentBox = ref(null)
let shadowRoot = null

/** Transparent 1×1 GIF — shown in place of blocked images */
const BLANK_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * Returns true if the given src is a remote, external URL that should be
 * blocked by default (not a data URI, CID reference, or our own CDN placeholder).
 */
function isExternalSrc(src) {
  if (!src) return false
  const s = src.toLowerCase().trim()
  if (s.startsWith('data:')) return false
  if (s.startsWith('cid:')) return false
  if (s.includes('{{domain}}')) return false
  return s.startsWith('http://') || s.startsWith('https://')
}

/**
 * Processes the HTML string for the shadow DOM:
 *  - Strips <body> tags but preserves its inline style
 *  - Blocks all external <img> src values (stores original in data-remote-src)
 *  - Counts how many remote images were found
 *
 * @param {string} rawHtml
 * @param {boolean} allowImages - If true, remote images are left as-is
 * @returns {{ cleanedHtml: string, bodyStyle: string, remoteCount: number }}
 */
function processHtml(rawHtml, allowImages) {
  // Extract <body style="..."> attributes
  const bodyStyleMatch = rawHtml.match(/<body[^>]*style="([^"]*)"/i)
  const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : ''

  // Strip <body> wrapper tags (keep inner content)
  let cleaned = rawHtml.replace(/<\/?body[^>]*>/gi, '')

  if (allowImages) {
    return { cleanedHtml: cleaned, bodyStyle, remoteCount: 0 }
  }

  // Use a temporary DOM to find and neutralise remote img src
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<html><body>${cleaned}</body></html>`, 'text/html')
  const images = Array.from(doc.querySelectorAll('img'))
  let remoteCount = 0

  for (const img of images) {
    const src = img.getAttribute('src') || ''
    if (isExternalSrc(src)) {
      img.setAttribute('data-remote-src', src)
      img.setAttribute('src', BLANK_PIXEL)
      img.setAttribute('data-tracker', 'true')
      remoteCount++
    }
  }

  // Serialize back (only the body contents)
  cleaned = doc.body.innerHTML

  return { cleanedHtml: cleaned, bodyStyle, remoteCount }
}

/**
 * Build the full shadow DOM innerHTML string including styles, optional banner,
 * and the email body.
 */
function buildShadowContent(cleanedHtml, bodyStyle, remoteCount) {
  const showBanner = remoteCount > 0 && !props.imagesAllowed

  const bannerHtml = showBanner
    ? `<div class="__tracker-banner">
        <span class="__tracker-icon">🛡️</span>
        <span class="__tracker-text">Remote images are blocked to protect your privacy.</span>
        <button class="__tracker-btn" id="__load-images-btn">Load images</button>
      </div>`
    : ''

  return `
    <style>
      :host {
        all: initial;
        width: 100%;
        height: 100%;
        font-family: -apple-system, Inter, BlinkMacSystemFont,
                    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #13181D;
        word-break: break-word;
      }

      h1, h2, h3, h4 {
        font-size: 18px;
        font-weight: 700;
      }

      p { margin: 0; }

      a {
        text-decoration: none;
        color: #0E70DF;
      }

      img[data-tracker="true"] {
        display: none !important;
      }

      .shadow-content {
        background: #FFFFFF;
        width: fit-content;
        height: fit-content;
        min-width: 100%;
        ${bodyStyle ? bodyStyle : ''}
      }

      img:not(table img) {
        max-width: 100%;
        height: auto !important;
      }

      .__tracker-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        background: #f0f4ff;
        border: 1px solid #c7d7f4;
        border-radius: 8px;
        margin-bottom: 14px;
        font-size: 13px;
        color: #1a3a6b;
        font-family: inherit;
      }

      .__tracker-icon {
        font-size: 16px;
        flex-shrink: 0;
      }

      .__tracker-text {
        flex: 1;
        line-height: 1.4;
      }

      .__tracker-btn {
        flex-shrink: 0;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 5px 14px;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s;
      }

      .__tracker-btn:hover {
        background: #1d4ed8;
      }
    </style>
    ${bannerHtml}
    <div class="shadow-content">
      ${cleanedHtml}
    </div>
  `
}

function updateContent() {
  if (!shadowRoot) return

  const { cleanedHtml, bodyStyle, remoteCount } = processHtml(props.html, props.imagesAllowed)

  shadowRoot.innerHTML = buildShadowContent(cleanedHtml, bodyStyle, remoteCount)

  // Notify parent of how many remote images were found
  emit('remoteImagesFound', remoteCount)

  // Wire the "Load images" button inside the shadow DOM
  const loadBtn = shadowRoot.getElementById('__load-images-btn')
  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      emit('update:imagesAllowed', true)
    })
  }
}

function autoScale() {
  if (!shadowRoot || !contentBox.value) return

  const parent = contentBox.value
  const shadowContent = shadowRoot.querySelector('.shadow-content')
  if (!shadowContent) return

  const parentWidth = parent.offsetWidth
  const childWidth = shadowContent.scrollWidth
  if (childWidth === 0) return

  const scale = parentWidth / childWidth
  shadowRoot.host.style.zoom = scale
}

onMounted(() => {
  shadowRoot = container.value.attachShadow({ mode: 'open' })
  updateContent()
  autoScale()
})

watch(
  () => [props.html, props.imagesAllowed],
  () => {
    updateContent()
    autoScale()
  }
)
</script>

<style scoped>
.content-box {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, Inter, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
}

.content-html {
  width: 100%;
  height: 100%;
}
</style>
