import { onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from '@/store/ui.js'
import { useEmailStore } from '@/store/email.js'

/**
 * Registers global keyboard shortcuts for Cloud Mail.
 * Call this once from App.vue.
 */
export function useKeyboardShortcuts() {
    const uiStore = useUiStore()
    const emailStore = useEmailStore()

    function isInInput(e) {
        const tag = e.target?.tagName?.toLowerCase()
        if (['input', 'textarea', 'select'].includes(tag)) return true
        if (e.target?.isContentEditable) return true
        // TinyMCE iframes
        if (e.target?.closest?.('.tox-tinymce, .mce-content-body')) return true
        return false
    }

    function handleKeyDown(e) {
        if (isInInput(e)) return

        // Skip if any modifier key is held (Ctrl/Cmd/Alt shortcuts are browser reserved)
        if (e.ctrlKey || e.metaKey || e.altKey) return

        switch (e.key) {
            case 'n':
            case 'N':
                e.preventDefault()
                uiStore.writerRef?.open?.()
                break

            case 'r':
            case 'R': {
                const email = emailStore.contentData?.email
                if (email && emailStore.contentData?.showReply) {
                    e.preventDefault()
                    uiStore.writerRef?.openReply?.(email)
                }
                break
            }

            case '?':
                e.preventDefault()
                uiStore.shortcutsHelpShow = true
                break
        }
    }

    onMounted(() => window.addEventListener('keydown', handleKeyDown))
    onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown))
}
