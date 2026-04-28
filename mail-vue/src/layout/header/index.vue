<template>
  <!-- Desktop top bar -->
  <div class="top-bar">
    <!-- Left: hamburger + page title -->
    <div class="top-bar-left">
      <button class="hamburger-btn" @click="changeAside" aria-label="Toggle sidebar">
        <Icon icon="material-symbols:menu-rounded" width="22" height="22" />
      </button>
      <span class="page-title">{{ $t(route.meta.title) }}</span>
    </div>

    <!-- Center: search (desktop) -->
    <div class="search-bar" v-if="!isMobile">
      <Icon icon="material-symbols:search-rounded" width="18" height="18" class="search-icon" />
      <input class="search-input" :placeholder="$t('searchByContent')" type="text" />
    </div>

    <!-- Right: actions -->
    <div class="top-bar-right">
      <!-- Compose (desktop only, also shown in sidebar but kept for quick access) -->
      <button v-perm="'email:send'" class="compose-fab-desktop" @click="openSend" :title="$t('send')">
        <Icon icon="material-symbols:edit-outline-sharp" width="20" height="20" />
      </button>

      <!-- Dark toggle -->
      <button class="icon-btn" @click="openDark($event)" :title="uiStore.dark ? 'Light mode' : 'Dark mode'">
        <Icon :icon="uiStore.dark ? 'mingcute:sun-fill' : 'solar:moon-linear'" width="20" height="20" />
      </button>

      <!-- Notice -->
      <button class="icon-btn" @click="openNotice" :title="$t('message')">
        <Icon icon="streamline-plump:announcement-megaphone" width="19" height="19" />
      </button>

      <!-- User avatar dropdown -->
      <el-dropdown ref="userinfoRef" @visible-change="e => userInfoShow = e" :teleported="false" popper-class="detail-dropdown">
        <div class="avatar-btn" @click="userInfoHide">
          <div class="avatar-circle">{{ formatName(userStore.user.email) }}</div>
          <Icon class="chevron" icon="mingcute:down-small-fill" width="16" height="16" />
        </div>
        <template #dropdown>
          <div class="user-dropdown">
            <div class="dropdown-avatar">{{ formatName(userStore.user.email) }}</div>
            <div class="dropdown-name">{{ userStore.user.name }}</div>
            <div class="dropdown-email" @click="copyEmail(userStore.user.email)">{{ userStore.user.email }}</div>
            <div class="dropdown-role">
              <el-tag size="small">{{ userStore.user.role?.name }}</el-tag>
            </div>
            <div class="dropdown-stats">
              <div class="stat-row">
                <span class="stat-label">{{ $t('sendCount') }}</span>
                <span v-if="sendCount">{{ sendCount }}</span>
                <el-tag v-if="!hasPerm('email:send')" size="small">{{ sendType }}</el-tag>
                <el-tag v-else size="small">{{ sendType }}</el-tag>
              </div>
              <div class="stat-row">
                <span class="stat-label">{{ $t('accountCount') }}</span>
                <el-tag v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail" size="small">{{ $t('disabled') }}</el-tag>
                <span v-else-if="accountCount && hasPerm('account:add')">{{ $t('totalUserAccount', {msg: accountCount}) }}</span>
                <el-tag v-else-if="!accountCount && hasPerm('account:add')" size="small">{{ $t('unlimited') }}</el-tag>
                <el-tag v-else-if="!hasPerm('account:add')" size="small">{{ $t('unauthorized') }}</el-tag>
              </div>
            </div>
            <div class="dropdown-logout">
              <el-button type="primary" :loading="logoutLoading" @click="clickLogout" size="small">{{ $t('logOut') }}</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>

  <!-- Mobile search bar (below topbar in mobile) -->
  <div class="mobile-search" v-if="isMobile">
    <div class="mobile-search-inner">
      <Icon icon="material-symbols:search-rounded" width="18" height="18" class="mobile-search-icon" />
      <input class="mobile-search-input" :placeholder="$t('searchByContent')" type="text" />
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import { Icon } from "@iconify/vue";
import { logout } from "@/request/login.js";
import { useUiStore } from "@/store/ui.js";
import { useUserStore } from "@/store/user.js";
import { useRoute } from "vue-router";
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useSettingStore } from "@/store/setting.js";
import { hasPerm } from "@/perm/perm.js";
import { useI18n } from "vue-i18n";
import { setExtend } from "@/utils/day.js";

const { t } = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const logoutLoading = ref(false);
const userInfoShow = ref(false);
const userinfoRef = ref({});
const isMobile = ref(window.innerWidth < 1025);

const handleResize = () => { isMobile.value = window.innerWidth < 1025; };
onMounted(() => window.addEventListener('resize', handleResize));
onBeforeUnmount(() => window.removeEventListener('resize', handleResize));

const accountCount = computed(() => userStore.user.role?.accountCount);

const sendType = computed(() => {
  if (settingStore.settings.send === 1) return t('disabled');
  if (!hasPerm('email:send')) return t('unauthorized');
  if (userStore.user.role?.sendType === 'ban') return t('sendBanned');
  if (userStore.user.role?.sendType === 'internal') return t('sendInternal');
  if (!userStore.user.role?.sendCount) return t('unlimited');
  if (userStore.user.role?.sendType === 'day') return t('daily');
  if (userStore.user.role?.sendType === 'count') return t('total');
});

const sendCount = computed(() => {
  if (!hasPerm('email:send') || !userStore.user.role?.sendCount || settingStore.settings.send === 1) return null;
  if (['ban', 'internal'].includes(userStore.user.role?.sendType)) return null;
  return userStore.user.sendCount + '/' + userStore.user.role.sendCount;
});

function userInfoHide() {
  if (userInfoShow.value) userinfoRef.value.handleClose();
  else userinfoRef.value.handleOpen();
}

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email);
    ElMessage({ message: t('copySuccessMsg'), type: 'success', plain: true });
  } catch {
    ElMessage({ message: t('copyFailMsg'), type: 'error', plain: true });
  }
}

function openNotice() { uiStore.showNotice(); }

function openDark(e) {
  const nextIsDark = !uiStore.dark;
  const root = document.documentElement;
  if (!document.startViewTransition) { switchDark(nextIsDark, root); return; }
  const x = e.clientX, y = e.clientY;
  const maxX = Math.max(x, window.innerWidth - x);
  const maxY = Math.max(y, window.innerHeight - y);
  root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light');
  root.style.setProperty('--vt-x', `${x}px`);
  root.style.setProperty('--vt-y', `${y}px`);
  root.style.setProperty('--vt-end-radius', `${Math.hypot(maxX, maxY) + 10}px`);
  document.startViewTransition(() => switchDark(nextIsDark, root)).finished.finally(() => root.removeAttribute('data-theme-to'));
}

function switchDark(nextIsDark, root) {
  root.setAttribute('class', nextIsDark ? 'dark' : '');
  const metaTag = document.getElementById('theme-color-meta');
  const isMob = !window.matchMedia("(pointer: fine) and (hover: hover)").matches;
  metaTag?.setAttribute('content', nextIsDark ? (isMob ? '#141414' : '#000000') : (isMob ? '#FFFFFF' : '#F1F1F1'));
  uiStore.dark = nextIsDark;
}

function openSend() { uiStore.writerRef.open(); }
function changeAside() { uiStore.asideShow = !uiStore.asideShow; }

function clickLogout() {
  logoutLoading.value = true;
  logout().then(() => {
    localStorage.removeItem("token");
    router.replace('/login');
  }).finally(() => { logoutLoading.value = false; });
}

function formatName(email) { return email?.[0]?.toUpperCase() || ''; }
</script>

<style>
.detail-dropdown { color: var(--el-text-color-primary) !important; }
</style>

<style lang="scss" scoped>
/* ── Top bar ─────────────────────────────────────────────── */
.top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  padding: 0 16px;
  background: var(--el-bg-color);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.hamburger-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;

  &:hover { background: var(--base-fill); }
}

.page-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Manrope', sans-serif;
  letter-spacing: -0.01em;
}

/* ── Search bar (desktop) ────────────────────────────────── */
.search-bar {
  flex: 1;
  max-width: 480px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--base-fill);
  border-radius: 999px;
  padding: 0 14px;
  height: 38px;
  border: 1.5px solid transparent;
  transition: border-color 0.15s, background 0.15s;

  &:focus-within {
    border-color: var(--el-color-primary);
    background: var(--el-bg-color);
  }

  .search-icon {
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 13px;
    color: var(--el-text-color-primary);
    font-family: 'Manrope', sans-serif;

    &::placeholder { color: var(--el-text-color-placeholder); }
  }
}

/* ── Right actions ───────────────────────────────────────── */
.top-bar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: var(--base-fill);
    color: var(--el-color-primary);
  }
}

.compose-fab-desktop {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--el-color-primary);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  margin-right: 4px;

  &:hover { background: var(--el-color-primary-dark-2); }
  &:active { transform: scale(0.95); }
}

/* ── Avatar dropdown trigger ─────────────────────────────── */
.avatar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 8px;
  transition: background 0.15s;

  &:hover { background: var(--base-fill); }
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: 'Manrope', sans-serif;
}

.chevron {
  color: var(--el-text-color-placeholder);
}

/* ── Dropdown panel ──────────────────────────────────────── */
.user-dropdown {
  width: 240px;
  padding: 16px 0 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .dropdown-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
    font-family: 'Manrope', sans-serif;
  }

  .dropdown-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    font-family: 'Manrope', sans-serif;
    max-width: 200px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dropdown-email {
    font-size: 12px;
    color: var(--regular-text-color);
    cursor: pointer;
    max-width: 200px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-family: 'Manrope', sans-serif;
    &:hover { color: var(--el-color-primary); }
  }

  .dropdown-role { margin-top: 4px; }

  .dropdown-stats {
    width: 100%;
    padding: 8px 16px 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-top: 1px solid var(--el-border-color-lighter);
    margin-top: 8px;

    .stat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: var(--regular-text-color);
      font-family: 'Manrope', sans-serif;
    }

    .stat-label { color: var(--el-text-color-secondary); }
  }

  .dropdown-logout {
    width: 100%;
    padding: 8px 16px 0;

    .el-button {
      width: 100%;
      border-radius: 8px;
    }
  }
}

/* ── Mobile search bar ───────────────────────────────────── */
.mobile-search {
  padding: 8px 16px 10px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.mobile-search-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--base-fill);
  border-radius: 999px;
  padding: 0 14px;
  height: 40px;
  border: 1.5px solid transparent;
  transition: border-color 0.15s;

  &:focus-within { border-color: var(--el-color-primary); }

  .mobile-search-icon { color: var(--el-text-color-placeholder); flex-shrink: 0; }

  .mobile-search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 14px;
    color: var(--el-text-color-primary);
    font-family: 'Manrope', sans-serif;
    &::placeholder { color: var(--el-text-color-placeholder); }
  }
}
</style>
