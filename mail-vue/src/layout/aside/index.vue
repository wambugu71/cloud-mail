<template>
  <div class="sidebar">
    <!-- App Header -->
    <div class="sidebar-header">
      <div class="app-brand">
        <Icon icon="mdi:email-outline" width="22" height="22" class="brand-icon" />
        <span class="brand-name">{{ settingStore.settings.title }}</span>
      </div>
      <!-- User Info -->
      <div class="user-info" v-if="userStore.user.email">
        <div class="user-avatar">{{ formatName(userStore.user.email) }}</div>
        <div class="user-meta">
          <span class="user-name">{{ userStore.user.name }}</span>
          <span class="user-email">{{ userStore.user.email }}</span>
        </div>
      </div>
    </div>

    <!-- Compose Button -->
    <div class="compose-wrap" v-perm="'email:send'">
      <button class="compose-btn" @click="openSend">
        <Icon icon="material-symbols:edit-outline-sharp" width="18" height="18" />
        <span>{{ $t('send') }}</span>
      </button>
    </div>

    <!-- Main Navigation -->
    <nav class="nav-main">
      <a class="nav-item" :class="route.meta.name === 'email' ? 'nav-active' : ''" @click="go('email')">
        <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
        <span>{{ $t('inbox') }}</span>
      </a>
      <a class="nav-item" :class="route.meta.name === 'send' ? 'nav-active' : ''" @click="go('send')" v-perm="'email:send'">
        <Icon icon="cil:send" width="20" height="20" />
        <span>{{ $t('sent') }}</span>
      </a>
      <a class="nav-item" :class="route.meta.name === 'draft' ? 'nav-active' : ''" @click="go('draft')" v-perm="'email:send'">
        <Icon icon="ep:document" width="19" height="19" />
        <span>{{ $t('drafts') }}</span>
      </a>
      <a class="nav-item" :class="route.meta.name === 'star' ? 'nav-active' : ''" @click="go('star')">
        <Icon icon="solar:star-line-duotone" width="20" height="20" />
        <span>{{ $t('starred') }}</span>
      </a>

      <!-- Admin section -->
      <div class="nav-section-label" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
        {{ $t('manage') }}
      </div>
      <a class="nav-item" :class="route.meta.name === 'analysis' ? 'nav-active' : ''" @click="go('analysis')" v-perm="'analysis:query'">
        <Icon icon="fluent:data-pie-20-regular" width="20" height="20" />
        <span>{{ $t('analytics') }}</span>
      </a>
      <a class="nav-item" :class="route.meta.name === 'user' ? 'nav-active' : ''" @click="go('user')" v-perm="'user:query'">
        <Icon icon="si:user-alt-2-line" width="20" height="20" />
        <span>{{ $t('allUsers') }}</span>
      </a>
      <a class="nav-item" :class="route.meta.name === 'all-email' ? 'nav-active' : ''" @click="go('all-email')" v-perm="'all-email:query'">
        <Icon icon="fluent:mail-list-28-regular" width="20" height="20" />
        <span>{{ $t('allMail') }}</span>
      </a>
      <a class="nav-item" :class="route.meta.name === 'role' ? 'nav-active' : ''" @click="go('role')" v-perm="'role:query'">
        <Icon icon="fluent:lock-closed-16-regular" width="20" height="20" />
        <span>{{ $t('permissions') }}</span>
      </a>
      <a class="nav-item" :class="route.meta.name === 'reg-key' ? 'nav-active' : ''" @click="go('reg-key')" v-perm="'reg-key:query'">
        <Icon icon="fluent:fingerprint-20-filled" width="20" height="20" />
        <span>{{ $t('inviteCode') }}</span>
      </a>
      <a class="nav-item" :class="route.meta.name === 'sys-setting' ? 'nav-active' : ''" @click="go('sys-setting')" v-perm="'setting:query'">
        <Icon icon="eos-icons:system-ok-outlined" width="20" height="20" />
        <span>{{ $t('SystemSettings') }}</span>
      </a>
    </nav>

    <!-- Footer Navigation -->
    <div class="nav-footer">
      <a class="nav-item" :class="route.meta.name === 'setting' ? 'nav-active' : ''" @click="go('setting')">
        <Icon icon="fluent:settings-48-regular" width="20" height="20" />
        <span>{{ $t('settings') }}</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { useSettingStore } from "@/store/setting.js";
import { useUserStore } from "@/store/user.js";
import { useUiStore } from "@/store/ui.js";

const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const route = useRoute();

function go(name) {
  router.push({ name });
  // Close aside on mobile after navigation
  if (window.innerWidth < 1025) {
    uiStore.asideShow = false;
  }
}

function openSend() {
  uiStore.writerRef.open();
  if (window.innerWidth < 1025) {
    uiStore.asideShow = false;
  }
}

function formatName(email) {
  return email?.[0]?.toUpperCase() || '';
}
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 260px;
  background: #0f172a;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;

  .brand-icon {
    color: #60a5fa;
    flex-shrink: 0;
  }

  .brand-name {
    font-size: 17px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-family: 'Manrope', -apple-system, sans-serif;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: 'Manrope', sans-serif;
}

.user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;

  .user-name {
    font-size: 13px;
    font-weight: 600;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: 'Manrope', sans-serif;
  }

  .user-email {
    font-size: 11px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: 'Manrope', sans-serif;
  }
}

.compose-wrap {
  padding: 14px 12px 10px;
  flex-shrink: 0;
}

.compose-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #2563eb;
  color: #ffffff;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
  font-family: 'Manrope', sans-serif;
  border: none;

  &:hover {
    background: #1d4ed8;
  }

  &:active {
    transform: scale(0.97);
  }
}

.nav-main {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.nav-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #475569;
  padding: 12px 12px 4px;
  font-family: 'Manrope', sans-serif;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  font-family: 'Manrope', sans-serif;
  text-decoration: none;
  user-select: none;

  &:hover {
    color: #e2e8f0;
    background: rgba(255, 255, 255, 0.06);
  }

  &:active {
    transform: scale(0.97);
    opacity: 0.85;
  }
}

.nav-active {
  background: #2563eb !important;
  color: #ffffff !important;
  font-weight: 600;

  &:hover {
    background: #1d4ed8 !important;
  }
}

.nav-footer {
  flex-shrink: 0;
  padding: 8px 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
