<template>
  <div class="settings-page">
    <div class="page-header">
      <h1 class="page-title">{{ $t('settings') || 'Settings' }}</h1>
      <p class="page-subtitle">{{ $t('settingsDesc') || 'Manage your account preferences, notifications, and application settings.' }}</p>
    </div>

    <div class="bento-grid">
      <!-- Account Section -->
      <section class="bento-card">
        <div class="card-header">
          <Icon icon="material-symbols:manage-accounts" class="card-icon" />
          <h2 class="card-title">{{ $t('profile') }}</h2>
        </div>
        <div class="profile-header">
          <div class="avatar-ring">
            <img :src="'https://api.dicebear.com/7.x/initials/svg?seed=' + userStore.user.name" alt="Profile" />
          </div>
          <div class="avatar-info">
            <h3 class="user-name">{{ userStore.user.name }}</h3>
            <p class="user-email">{{ userStore.user.email }}</p>
          </div>
        </div>
        <div class="form-group-list">
          <div class="form-group">
            <label>{{ $t('username') }}</label>
            <el-input v-model="accountName" placeholder="Enter full name" />
          </div>
          <div class="form-group">
            <label>{{ $t('emailAccount') }}</label>
            <el-input :model-value="userStore.user.email" disabled />
          </div>
        </div>
        <div class="card-footer">
          <el-button type="primary" :loading="saveNameLoading" @click="setName" class="save-btn">
            {{ $t('save') }}
          </el-button>
        </div>
      </section>

      <!-- Preferences Section -->
      <section class="bento-card">
        <div class="card-header">
          <Icon icon="material-symbols:tune" class="card-icon" />
          <h2 class="card-title">{{ $t('generalPreferences') || 'General Preferences' }}</h2>
        </div>
        <div class="form-group-list flex-1">
          <div class="form-group">
            <label>{{ $t('language') || 'Language' }}</label>
            <el-select v-model="locale" placeholder="Select Language" class="w-full">
              <el-option label="English" value="en" />
              <el-option label="中文" value="zh" />
              <el-option label="Kiswahili" value="sw" />
            </el-select>
          </div>
          <div class="form-group">
            <label>{{ $t('theme') || 'Appearance' }}</label>
            <div class="theme-toggle-group">
              <label class="theme-option" :class="{active: !uiStore.dark}">
                <input type="radio" :value="false" v-model="uiStore.dark" @change="updateTheme" class="hidden-radio" />
                <span>{{ $t('light') || 'Light' }}</span>
              </label>
              <label class="theme-option" :class="{active: uiStore.dark}">
                <input type="radio" :value="true" v-model="uiStore.dark" @change="updateTheme" class="hidden-radio" />
                <span>{{ $t('dark') || 'Dark' }}</span>
              </label>
            </div>
          </div>
          <!-- Density mode toggle -->
          <div class="form-group">
            <label>{{ $t('density') || 'Display Density' }}</label>
            <div class="theme-toggle-group">
              <label class="theme-option" :class="{active: uiStore.density === 'compact'}">
                <input type="radio" value="compact" v-model="uiStore.density" class="hidden-radio" />
                <span>{{ $t('compact') || 'Compact' }}</span>
              </label>
              <label class="theme-option" :class="{active: uiStore.density === 'comfortable'}">
                <input type="radio" value="comfortable" v-model="uiStore.density" class="hidden-radio" />
                <span>{{ $t('comfortable') || 'Comfortable' }}</span>
              </label>
              <label class="theme-option" :class="{active: uiStore.density === 'spacious'}">
                <input type="radio" value="spacious" v-model="uiStore.density" class="hidden-radio" />
                <span>{{ $t('spacious') || 'Spacious' }}</span>
              </label>
            </div>
          </div>
          <!-- Keyboard shortcuts hint -->
          <div class="form-group">
            <label>{{ $t('keyboardShortcuts') || 'Keyboard Shortcuts' }}</label>
            <button class="shortcuts-hint-btn" @click="uiStore.shortcutsHelpShow = true">
              <Icon icon="material-symbols:keyboard-outline" width="18" height="18" />
              <span>{{ $t('shortcutHelp') || 'View all shortcuts' }}</span>
              <Icon icon="material-symbols:chevron-right" width="16" height="16" class="hint-arrow" />
            </button>
          </div>
        </div>
      </section>

      <!-- Signature Section (Spans 2 columns on desktop) -->
      <section class="bento-card col-span-full">
        <div class="card-header">
          <Icon icon="material-symbols:draw" class="card-icon" />
          <h2 class="card-title">{{ $t('emailSignature') }}</h2>
        </div>
        <p class="card-desc">{{ $t('emailSignatureDesc') }}</p>
        <div class="signature-editor-wrap">
          <tinyEditor
            ref="signatureEditorRef"
            :def-value="signatureContent"
            editor-id="signature-editor"
            @change="onSignatureChange"
          />
        </div>
        <div class="card-footer">
          <el-button type="primary" :loading="saveSignatureLoading" @click="saveSignature" class="save-btn">
            {{ $t('save') }}
          </el-button>
        </div>
      </section>

      <!-- Quick Reply Templates Section -->
      <section class="bento-card col-span-full">
        <div class="card-header">
          <Icon icon="material-symbols:quick-phrases" class="card-icon" />
          <h2 class="card-title">{{ $t('quickReplies') || 'Quick Reply Templates' }}</h2>
        </div>
        <p class="card-desc">{{ $t('quickRepliesDesc') || 'One-click snippets for your compose window' }}</p>

        <!-- Existing templates list -->
        <div class="template-list">
          <div class="template-item" v-for="tpl in uiStore.replyTemplates" :key="tpl.id">
            <div class="template-info">
              <span class="template-name">{{ tpl.name }}</span>
              <span class="template-text">{{ tpl.text }}</span>
            </div>
            <button class="template-delete-btn" @click="deleteTemplate(tpl.id)" :title="$t('deleteTemplate')">
              <Icon icon="material-symbols:delete-outline" width="18" height="18" />
            </button>
          </div>
          <div class="template-empty" v-if="uiStore.replyTemplates.length === 0">
            <Icon icon="material-symbols:format-quote" width="32" height="32" />
            <span>{{ $t('noMessagesFound') }}</span>
          </div>
        </div>

        <!-- Add new template form -->
        <div class="add-template-form">
          <el-input
            v-model="newTemplate.name"
            :placeholder="$t('templateName') || 'Label'"
            class="template-name-input"
            maxlength="40"
            show-word-limit
          />
          <el-input
            v-model="newTemplate.text"
            :placeholder="$t('templateText') || 'Text'"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
          <div class="card-footer" style="padding-top:16px">
            <el-button type="primary" @click="addTemplate" class="save-btn">
              <Icon icon="material-symbols:add" width="16" height="16" style="margin-right:4px" />
              {{ $t('addTemplate') || 'Add Template' }}
            </el-button>
          </div>
        </div>
      </section>

      <!-- Security Section -->
      <section class="bento-card col-span-full">
        <div class="card-header">
          <Icon icon="material-symbols:security" class="card-icon" />
          <h2 class="card-title">{{ $t('securityAndSupport') || 'Security & Support' }}</h2>
        </div>
        <div class="action-list">
          <button class="action-item" @click="pwdShow = true">
            <div class="action-item-left">
              <Icon icon="material-symbols:key-outline" class="action-icon" />
              <div>
                <h3 class="action-title">{{ $t('changePassword') }}</h3>
                <p class="action-desc">{{ $t('updateLoginCredentials') || 'Update your login credentials.' }}</p>
              </div>
            </div>
            <Icon icon="material-symbols:chevron-right" class="action-arrow" />
          </button>

          <button class="action-item danger-item" @click="deleteConfirm" v-perm="'my:delete'">
            <div class="action-item-left">
              <Icon icon="material-symbols:delete-outline" class="action-icon" />
              <div>
                <h3 class="action-title">{{ $t('deleteUser') }}</h3>
                <p class="action-desc">{{ $t('delAccountMsg') }}</p>
              </div>
            </div>
            <Icon icon="material-symbols:chevron-right" class="action-arrow" />
          </button>
        </div>
      </section>
    </div>

    <!-- Password Dialog -->
    <el-dialog v-model="pwdShow" :title="$t('changePassword')" width="340" class="custom-dialog">
      <div class="update-pwd">
        <el-input type="password" :placeholder="$t('newPassword')" v-model="form.password" autocomplete="off"/>
        <el-input type="password" :placeholder="$t('confirmPassword')" v-model="form.newPwd" autocomplete="off"/>
        <el-button type="primary" :loading="setPwdLoading" @click="submitPwd" class="w-full mt-2">{{$t('save')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, defineOptions, onMounted, watch } from 'vue'
import { resetPassword, userDelete } from "@/request/my.js";
import { useUserStore } from "@/store/user.js";
import router from "@/router/index.js";
import { accountSetName, accountSetSignature } from "@/request/account.js";
import { useAccountStore } from "@/store/account.js";
import { useI18n } from "vue-i18n";
import tinyEditor from "@/components/tiny-editor/index.vue";
import { Icon } from "@iconify/vue";
import { useUiStore } from "@/store/ui.js";

const { t, locale } = useI18n()
const accountStore = useAccountStore()
const userStore = useUserStore();
const uiStore = useUiStore();

const setPwdLoading = ref(false)
const saveNameLoading = ref(false)
const accountName = ref('')
const signatureEditorRef = ref(null)
const signatureContent = ref('')
const saveSignatureLoading = ref(false)
let currentSignatureHtml = ''

// Quick Reply Template form state
const newTemplate = reactive({ name: '', text: '' })

function addTemplate() {
  if (!newTemplate.name.trim()) {
    ElMessage({ message: t('emptyTemplateName'), type: 'error', plain: true })
    return
  }
  if (!newTemplate.text.trim()) {
    ElMessage({ message: t('emptyTemplateText'), type: 'error', plain: true })
    return
  }
  const id = Date.now()
  uiStore.replyTemplates.push({ id, name: newTemplate.name.trim(), text: newTemplate.text.trim() })
  newTemplate.name = ''
  newTemplate.text = ''
  ElMessage({ message: t('addSuccessMsg'), type: 'success', plain: true })
}

function deleteTemplate(id) {
  const idx = uiStore.replyTemplates.findIndex(t => t.id === id)
  if (idx > -1) uiStore.replyTemplates.splice(idx, 1)
}


defineOptions({
  name: 'setting'
})

onMounted(() => {
  accountName.value = userStore.user.name || ''
  signatureContent.value = userStore.user.account?.signature || ''
  currentSignatureHtml = signatureContent.value
  
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale) {
    locale.value = savedLocale
  }
})

watch(locale, (newLocale) => {
  localStorage.setItem('locale', newLocale)
})

const updateTheme = () => {
    localStorage.setItem('ui', JSON.stringify({ dark: uiStore.dark }));
    const root = document.documentElement;
    root.setAttribute('class', uiStore.dark ? 'dark' : '');
}

function onSignatureChange(html) {
  currentSignatureHtml = html
}

async function saveSignature() {
  saveSignatureLoading.value = true
  try {
    await accountSetSignature(userStore.user.account.accountId, currentSignatureHtml)
    if (userStore.user.account) {
      userStore.user.account.signature = currentSignatureHtml
    }
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
  } finally {
    saveSignatureLoading.value = false
  }
}

function setName() {
  if (!accountName.value) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  let name = accountName.value
  if (name === userStore.user.name) {
    return
  }

  saveNameLoading.value = true
  accountSetName(userStore.user.account.accountId, name).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
    userStore.user.name = name
    accountStore.changeUserAccountName = name
  }).catch(() => {
    accountName.value = userStore.user.name
  }).finally(() => {
    saveNameLoading.value = false
  })
}

const pwdShow = ref(false)
const form = reactive({
  password: '',
  newPwd: '',
})

const deleteConfirm = () => {
  ElMessageBox.confirm(t('delAccountConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    userDelete().then(() => {
      localStorage.removeItem('token');
      router.replace('/login');
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  })
}

function submitPwd() {
  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password !== form.newPwd) {
    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  setPwdLoading.value = true
  resetPassword(form.password).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
    pwdShow.value = false
    setPwdLoading.value = false
    form.password = ''
    form.newPwd = ''
  }).catch(() => {
    setPwdLoading.value = false
  })
}
</script>

<style scoped lang="scss">
.settings-page {
  max-width: 1152px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Manrope', sans-serif;

  @media (min-width: 768px) {
    padding: 32px;
  }

  .w-full {
    width: 100%;
  }

  .mt-2 {
    margin-top: 8px;
  }

  .page-header {
    margin-bottom: 32px;
    .page-title {
      font-size: 30px;
      line-height: 38px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: 14px;
      color: var(--secondary-text-color);
      margin: 0;
    }
  }

  .bento-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    @media (min-width: 1024px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .col-span-full {
    @media (min-width: 1024px) {
      grid-column: 1 / -1;
    }
  }

  .bento-card {
    background: var(--surface-container-lowest, var(--el-bg-color));
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
    border: 1px solid var(--base-border-color);
    padding: 24px;
    display: flex;
    flex-direction: column;
    transition: background 0.3s, border-color 0.3s;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      
      .card-icon {
        color: var(--el-color-primary);
        font-size: 24px;
      }
      .card-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0;
      }
    }

    .card-desc {
      color: var(--secondary-text-color);
      font-size: 13px;
      margin-top: -16px;
      margin-bottom: 16px;
    }

    .card-footer {
      margin-top: auto;
      padding-top: 24px;
      display: flex;
      justify-content: flex-end;
      
      .save-btn {
        padding: 8px 24px;
        font-weight: 600;
        border-radius: 8px;
      }
    }
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 32px;
    
    .avatar-ring {
      height: 80px;
      width: 80px;
      border-radius: 50%;
      overflow: hidden;
      border: 4px solid var(--light-ill, #f2f4f6);
      background: #e0e0e0;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    .avatar-info {
      .user-name {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 4px;
        color: var(--el-text-color-primary);
      }
      .user-email {
        font-size: 14px;
        color: var(--secondary-text-color);
        margin: 0;
      }
    }
  }

  .form-group-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    &.flex-1 {
      flex: 1;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    label {
      font-size: 13px;
      font-weight: 600;
      color: var(--secondary-text-color);
    }
    
    :deep(.el-input__wrapper) {
      background-color: var(--light-ill, #f7f9fb);
      border-radius: 8px;
      box-shadow: 0 0 0 1px var(--base-border-color) inset;
      padding: 4px 12px;
      transition: all 0.2s;
      
      &.is-focus {
        box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
        background-color: var(--el-bg-color);
      }
    }
    
    :deep(.el-input.is-disabled .el-input__wrapper) {
      background-color: var(--base-fill);
      box-shadow: 0 0 0 1px var(--base-border-color) inset;
    }
  }

  .theme-toggle-group {
    display: flex;
    gap: 12px;
    
    .theme-option {
      flex: 1;
      cursor: pointer;
      position: relative;
      
      .hidden-radio {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      
      span {
        display: block;
        text-align: center;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid var(--base-border-color);
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s;
        color: var(--el-text-color-primary);
      }
      
      &.active span {
        border-color: var(--el-color-primary);
        background: var(--choose-account-background, #e6f7ff);
        color: var(--el-color-primary);
      }
    }
  }

  .signature-editor-wrap {
    height: 320px;
    border: 1px solid var(--base-border-color);
    border-radius: 8px;
    overflow: hidden;
  }

  .action-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .action-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    
    &:hover {
      background: var(--light-ill, #f7f9fb);
      border-color: var(--base-border-color);
      .action-icon {
        color: var(--el-color-primary);
      }
    }

    .action-item-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .action-icon {
      font-size: 24px;
      color: var(--secondary-text-color);
      transition: color 0.2s;
    }
    
    .action-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
      margin-top: 0;
    }
    
    .action-desc {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin: 0;
    }
    
    .action-arrow {
      font-size: 20px;
      color: var(--secondary-text-color);
    }
  }

  .danger-item {
    &:hover {
      background: var(--error-container, #ffdad6) !important;
      border-color: transparent !important;
      .action-icon, .action-title, .action-desc, .action-arrow {
        color: var(--error, #ba1a1a) !important;
      }
    }
  }

  // Keyboard shortcuts hint button
  .shortcuts-hint-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--base-border-color);
    background: var(--light-ill, #f7f9fb);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    transition: all 0.2s;
    text-align: left;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--choose-account-background, #e6f7ff);
      color: var(--el-color-primary);
    }

    .hint-arrow {
      margin-left: auto;
      color: var(--secondary-text-color);
    }
  }

  // Quick reply template list
  .template-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;

    .template-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid var(--base-border-color);
      border-radius: 8px;
      background: var(--light-ill, #f7f9fb);
      transition: border-color 0.15s;

      &:hover {
        border-color: var(--el-color-primary-light-5);
      }

      .template-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .template-name {
        font-size: 13px;
        font-weight: 700;
        color: var(--el-text-color-primary);
      }

      .template-text {
        font-size: 12px;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .template-delete-btn {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--secondary-text-color);
        transition: all 0.15s;

        &:hover {
          background: var(--error-container, #ffdad6);
          color: var(--error, #ba1a1a);
        }
      }
    }

    .template-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px;
      color: var(--secondary-text-color);
      font-size: 13px;
    }
  }

  .add-template-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    border: 1px dashed var(--base-border-color);
    background: var(--el-bg-color);

    .template-name-input {
      width: 280px;
    }
  }
}

.update-pwd {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
