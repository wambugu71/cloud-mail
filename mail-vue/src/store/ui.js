import { defineStore } from 'pinia'

const DEFAULT_TEMPLATES = [
    { id: 1, name: 'Thank you', text: 'Thank you for your email. I will get back to you shortly.' },
    { id: 2, name: 'Acknowledged', text: 'Acknowledged, thank you. I will review this and respond soon.' },
    { id: 3, name: 'Out of office', text: 'I am currently out of the office and will respond upon my return.' },
]

export const useUiStore = defineStore('ui', {
    state: () => ({
        asideShow: window.innerWidth > 1024,
        accountShow: false,
        backgroundLoading: true,
        changeNotice: 0,
        writerRef: null,
        changePreview: 0,
        previewData: {},
        key: 0,
        dark: false,
        searchQuery: '',
        searchType: 'all',
        searchTrigger: 0,
        shortcutsHelpShow: false,
        density: 'comfortable',       // 'compact' | 'comfortable' | 'spacious'
        replyTemplates: [...DEFAULT_TEMPLATES],
        asideCount: {
            email: 0,
            send: 0,
            sysEmail: 0
        }
    }),
    actions: {
        showNotice() {
            this.changeNotice ++
        },
        previewNotice(data) {
            this.previewData = data
            this.changePreview ++
        }
    },
    persist: {
        pick: ['accountShow', 'dark', 'density', 'replyTemplates'],
    },
})
