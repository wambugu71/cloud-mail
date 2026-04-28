<template>
  <el-container class="layout">
    <!-- Sidebar (desktop always, mobile as drawer) -->
    <el-aside
        class="aside"
        :class="uiStore.asideShow ? 'aside-show' : 'aside-hide'">
      <Aside />
    </el-aside>

    <!-- Overlay for mobile when sidebar is open -->
    <div
        :class="(uiStore.asideShow && isMobile) ? 'overlay-show' : 'overlay-hide'"
        @click="uiStore.asideShow = false"
    ></div>

    <el-container class="main-container">
      <!-- Top header bar -->
      <el-header class="app-header">
        <Header />
      </el-header>

      <!-- Main content -->
      <Main />
    </el-container>
  </el-container>

  <!-- Compose writer overlay -->
  <writer ref="writerRef" />

  <!-- Mobile Bottom Nav -->
  <nav class="bottom-nav" v-if="isMobile">
    <a
        class="bottom-nav-item"
        :class="currentRoute === 'email' ? 'bottom-nav-active' : ''"
        @click="goTo('email')"
    >
      <span class="bottom-nav-icon">
        <Icon :icon="currentRoute === 'email' ? 'hugeicons:mailbox-01' : 'hugeicons:mailbox-01'" width="22" height="22" />
      </span>
      <span class="bottom-nav-label">{{ $t('inbox') }}</span>
    </a>

    <a
        class="bottom-nav-item"
        :class="currentRoute === 'send' ? 'bottom-nav-active' : ''"
        @click="goTo('send')"
        v-perm="'email:send'"
    >
      <span class="bottom-nav-icon">
        <Icon icon="cil:send" width="21" height="21" />
      </span>
      <span class="bottom-nav-label">{{ $t('sent') }}</span>
    </a>

    <a
        class="bottom-nav-item"
        :class="currentRoute === 'draft' ? 'bottom-nav-active' : ''"
        @click="goTo('draft')"
        v-perm="'email:send'"
    >
      <span class="bottom-nav-icon">
        <Icon icon="ep:document" width="21" height="21" />
      </span>
      <span class="bottom-nav-label">{{ $t('drafts') }}</span>
    </a>

    <a
        class="bottom-nav-item"
        :class="currentRoute === 'setting' ? 'bottom-nav-active' : ''"
        @click="goTo('setting')"
    >
      <span class="bottom-nav-icon">
        <Icon icon="fluent:settings-48-regular" width="21" height="21" />
      </span>
      <span class="bottom-nav-label">{{ $t('settings') }}</span>
    </a>
  </nav>

  <!-- Mobile FAB (compose) -->
  <button
      class="mobile-fab"
      v-if="isMobile"
      v-perm="'email:send'"
      @click="openSend"
      :aria-label="$t('send')"
  >
    <Icon icon="material-symbols:edit-outline-sharp" width="24" height="24" />
  </button>
</template>

<script setup>
import Aside from '@/layout/aside/index.vue';
import Header from '@/layout/header/index.vue';
import Main from '@/layout/main/index.vue';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useUiStore } from "@/store/ui.js";
import { useRoute, useRouter } from 'vue-router';
import writer from '@/layout/write/index.vue';
import { Icon } from "@iconify/vue";

const uiStore = useUiStore();
const route = useRoute();
const router = useRouter();
const writerRef = ref({});
const isMobile = ref(window.innerWidth < 1025);

const currentRoute = computed(() => route.meta.name);

const handleResize = () => {
  isMobile.value = window.innerWidth < 1025;
  uiStore.asideShow = window.innerWidth > 1024;
};

onMounted(() => {
  uiStore.writerRef = writerRef;
  window.addEventListener('resize', handleResize);
  handleResize();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

function goTo(name) {
  router.push({ name });
}

function openSend() {
  uiStore.writerRef.open();
}
</script>

<style lang="scss" scoped>
/* ── Overall layout ─────────────────────────────────────── */
.layout {
  height: 100%;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
}

/* ── Sidebar ────────────────────────────────────────────── */
.aside-hide {
  position: fixed;
  left: 0;
  height: 100%;
  z-index: 100;
  transform: translateX(-100%);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  width: 260px;
}

.aside-show {
  transform: translateX(0);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  z-index: 101;

  @media (max-width: 1024px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 101;
    height: 100%;
  }
}

.el-aside {
  width: 260px !important;
  flex-shrink: 0;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Main container ─────────────────────────────────────── */
.main-container {
  min-height: 100%;
  flex-direction: column;
  background: var(--el-bg-color);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.app-header {
  height: auto !important;
  padding: 0 !important;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

/* ── Overlay (mobile) ────────────────────────────────────── */
.overlay-show {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  z-index: 99;
  backdrop-filter: blur(2px);
  transition: opacity 200ms;
}

.overlay-hide {
  pointer-events: none;
  opacity: 0;
  position: fixed;
}

/* ── Mobile bottom nav ───────────────────────────────────── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 8px 8px max(env(safe-area-inset-bottom, 0px), 6px);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);

  @media (min-width: 1025px) {
    display: none;
  }
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
  border-radius: 12px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.15s ease;
  text-decoration: none;
  user-select: none;

  &:active { transform: scale(0.92); }
}

.bottom-nav-active {
  color: var(--el-color-primary);
  background: var(--choose-account-background);
}

.bottom-nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-nav-label {
  font-size: 10px;
  font-weight: 600;
  font-family: 'Manrope', sans-serif;
}

/* ── Mobile FAB ──────────────────────────────────────────── */
.mobile-fab {
  position: fixed;
  bottom: calc(70px + max(env(safe-area-inset-bottom, 0px), 6px));
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.35);
  z-index: 49;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s;
  border: none;

  &:hover { background: var(--el-color-primary-dark-2); }
  &:active { transform: scale(0.93); }

  @media (min-width: 1025px) {
    display: none;
  }
}
</style>
