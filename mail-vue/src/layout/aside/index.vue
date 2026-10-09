<template>
  <div class="sidebar">
    <!-- App Header -->
    <div class="sidebar-header">
      <div class="app-brand">
        <div class="brand-logo-badge">
          <Icon icon="material-symbols:mail-rounded" width="20" height="20" class="brand-icon" />
        </div>
        <span class="brand-name">{{ settingStore.settings.title || 'Cloud Mail' }}</span>
      </div>

      <!-- User Info -->
      <div class="user-info" v-if="userStore.user.email">
        <div class="user-avatar-wrap">
          <div class="user-avatar">{{ formatName(userStore.user.email) }}</div>
          <span class="user-status-dot"></span>
        </div>
        <div class="user-meta">
          <span class="user-name">{{ userStore.user.name || 'User' }}</span>
          <span class="user-email" :title="userStore.user.email">{{ userStore.user.email }}</span>
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
        <div class="nav-item-icon-wrap">
          <Icon icon="hugeicons:mailbox-01" width="19" height="19" />
        </div>
        <span class="nav-label">{{ $t('inbox') }}</span>
        <span class="nav-badge" v-if="uiStore.asideCount.email > 0">
          {{ uiStore.asideCount.email > 99 ? '99+' : uiStore.asideCount.email }}
        </span>
      </a>

      <a class="nav-item" :class="route.meta.name === 'send' ? 'nav-active' : ''" @click="go('send')" v-perm="'email:send'">
        <div class="nav-item-icon-wrap">
          <Icon icon="cil:send" width="18" height="18" />
        </div>
        <span class="nav-label">{{ $t('sent') }}</span>
      </a>

      <a class="nav-item" :class="route.meta.name === 'draft' ? 'nav-active' : ''" @click="go('draft')" v-perm="'email:send'">
        <div class="nav-item-icon-wrap">
          <Icon icon="ep:document" width="18" height="18" />
        </div>
        <span class="nav-label">{{ $t('drafts') }}</span>
      </a>

      <a class="nav-item" :class="route.meta.name === 'star' ? 'nav-active' : ''" @click="go('star')">
        <div class="nav-item-icon-wrap">
          <Icon icon="solar:star-line-duotone" width="19" height="19" />
        </div>
        <span class="nav-label">{{ $t('starred') }}</span>
      </a>

      <!-- Admin Section -->
      <div class="nav-section-label" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
        {{ $t('manage') }}
      </div>

      <a class="nav-item" :class="route.meta.name === 'analysis' ? 'nav-active' : ''" @click="go('analysis')" v-perm="'analysis:query'">
        <div class="nav-item-icon-wrap">
          <Icon icon="fluent:data-pie-20-regular" width="19" height="19" />
        </div>
        <span class="nav-label">{{ $t('analytics') }}</span>
      </a>

      <a class="nav-item" :class="route.meta.name === 'user' ? 'nav-active' : ''" @click="go('user')" v-perm="'user:query'">
        <div class="nav-item-icon-wrap">
          <Icon icon="si:user-alt-2-line" width="19" height="19" />
        </div>
        <span class="nav-label">{{ $t('allUsers') }}</span>
      </a>

      <a class="nav-item" :class="route.meta.name === 'all-email' ? 'nav-active' : ''" @click="go('all-email')" v-perm="'all-email:query'">
        <div class="nav-item-icon-wrap">
          <Icon icon="fluent:mail-list-28-regular" width="19" height="19" />
        </div>
        <span class="nav-label">{{ $t('allMail') }}</span>
        <span class="nav-badge" v-if="uiStore.asideCount.sysEmail > 0">
          {{ uiStore.asideCount.sysEmail > 99 ? '99+' : uiStore.asideCount.sysEmail }}
        </span>
      </a>

      <a class="nav-item" :class="route.meta.name === 'role' ? 'nav-active' : ''" @click="go('role')" v-perm="'role:query'">
        <div class="nav-item-icon-wrap">
          <Icon icon="fluent:lock-closed-16-regular" width="19" height="19" />
        </div>
        <span class="nav-label">{{ $t('permissions') }}</span>
      </a>

      <a class="nav-item" :class="route.meta.name === 'reg-key' ? 'nav-active' : ''" @click="go('reg-key')" v-perm="'reg-key:query'">
        <div class="nav-item-icon-wrap">
          <Icon icon="fluent:fingerprint-20-filled" width="19" height="19" />
        </div>
        <span class="nav-label">{{ $t('inviteCode') }}</span>
      </a>

      <a class="nav-item" :class="route.meta.name === 'sys-setting' ? 'nav-active' : ''" @click="go('sys-setting')" v-perm="'setting:query'">
        <div class="nav-item-icon-wrap">
          <Icon icon="eos-icons:system-ok-outlined" width="19" height="19" />
        </div>
        <span class="nav-label">{{ $t('SystemSettings') }}</span>
      </a>
    </nav>

    <!-- Footer Navigation -->
    <div class="nav-footer">
      <a class="nav-item" :class="route.meta.name === 'setting' ? 'nav-active' : ''" @click="go('setting')">
        <div class="nav-item-icon-wrap">
          <Icon icon="fluent:settings-48-regular" width="19" height="19" />
        </div>
        <span class="nav-label">{{ $t('settings') }}</span>
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
  background: linear-gradient(180deg, #0f172a 0%, #0b1120 100%);
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-header {
  padding: 18px 16px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 14px;

  .brand-logo-badge {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    flex-shrink: 0;

    .brand-icon {
      color: #ffffff;
    }
  }

  .brand-name {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.user-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.user-status-dot {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 8px;
  height: 8px;
  background: #10b981;
  border: 2px solid #0f172a;
  border-radius: 50%;
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
    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  }

  .user-email {
    font-size: 11px;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: 'Inter', sans-serif;
  }
}

.compose-wrap {
  padding: 12px 14px 8px;
  flex-shrink: 0;
}

.compose-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;

  &:hover {
    background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
  }

  &:active {
    transform: scale(0.98);
  }
}

.nav-main {
  flex: 1;
  overflow-y: auto;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.nav-section-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  padding: 14px 12px 6px;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 8.5px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  text-decoration: none;
  user-select: none;
  position: relative;

  .nav-item-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .nav-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.05);
  }

  &:active {
    transform: scale(0.98);
  }
}

.nav-active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(29, 78, 216, 0.95)) !important;
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: #ffffff;
    opacity: 0.9;
  }

  &:hover {
    background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
  }
}

.nav-badge {
  margin-left: auto;
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 1.5px 7px;
  border-radius: 999px;
  line-height: 1.3;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.35);
}

.nav-active .nav-badge {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.nav-footer {
  flex-shrink: 0;
  padding: 8px 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
