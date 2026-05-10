<template>
  <el-config-provider :locale="settingStore.lang === 'zh' ? zhCn : null">
    <router-view />

    <!-- ⌨️ Keyboard Shortcuts Help Dialog -->
    <el-dialog
      v-model="uiStore.shortcutsHelpShow"
      :title="$t('keyboardShortcuts') || 'Keyboard Shortcuts'"
      width="380px"
      class="shortcuts-dialog"
    >
      <div class="shortcuts-list">
        <div class="shortcut-row">
          <kbd>N</kbd>
          <span>{{ $t('shortcutCompose') || 'New email' }}</span>
        </div>
        <div class="shortcut-row">
          <kbd>R</kbd>
          <span>{{ $t('shortcutReply') || 'Reply to selected email' }}</span>
        </div>
        <div class="shortcut-row">
          <kbd>?</kbd>
          <span>{{ $t('shortcutHelp') || 'Show keyboard shortcuts' }}</span>
        </div>
      </div>
    </el-dialog>
  </el-config-provider>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { watch, onMounted } from "vue";
import { useSettingStore } from "@/store/setting.js";
import { useUiStore } from "@/store/ui.js";
import { useKeyboardShortcuts } from "@/utils/keyboard-shortcuts.js";
import zhCn from 'element-plus/es/locale/lang/zh-cn';

import('@/icons/index.js')

const settingStore = useSettingStore()
const uiStore = useUiStore()
const { locale } = useI18n()
locale.value = settingStore.lang
watch(() => settingStore.lang, () => locale.value = settingStore.lang)

// Apply density CSS attribute to <html> so all components can read it
function applyDensity(val) {
  document.documentElement.setAttribute('data-density', val || 'comfortable')
}
onMounted(() => applyDensity(uiStore.density))
watch(() => uiStore.density, applyDensity)

// Mount global keyboard shortcuts
useKeyboardShortcuts()
</script>

<style>
/* Keyboard shortcuts dialog */
.shortcuts-dialog .shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.shortcuts-dialog .shortcut-row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}
.shortcuts-dialog kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  box-shadow: 0 1px 0 var(--el-border-color);
  font-family: 'Manrope', monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}
</style>
