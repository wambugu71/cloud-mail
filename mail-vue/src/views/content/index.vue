<template>
  <div class="box">
    <!-- Header Actions -->
    <div class="header-actions">
      <div class="left-actions">
        <!-- Back button only on mobile -->
        <button class="action-btn" v-if="isMobile" @click="handleBack" :title="$t('back') || 'Back'">
          <Icon icon="material-symbols:arrow-back-rounded" width="20" height="20" />
        </button>
        
        <button class="action-btn" :title="$t('archive') || 'Archive'">
          <Icon icon="material-symbols:archive-outline" width="20" height="20" />
        </button>
        <button v-perm="'email:delete'" class="action-btn delete-btn" @click="handleDelete" :title="$t('delete') || 'Delete'">
          <Icon icon="material-symbols:delete-outline" width="20" height="20" />
        </button>
        
        <div class="divider"></div>
        
        <button class="action-btn" :title="$t('markUnread') || 'Mark Unread'">
          <Icon icon="material-symbols:mark-email-unread-outline" width="20" height="20" />
        </button>
        <button class="action-btn" :title="$t('moveTo') || 'Move to'">
          <Icon icon="material-symbols:drive-file-move-outline" width="20" height="20" />
        </button>
        <button class="action-btn" v-if="emailStore.contentData.showStar" @click="changeStar" :title="$t('star') || 'Star'">
          <Icon v-if="email.isStar" icon="fluent-color:star-16" width="20" height="20" />
          <Icon v-else icon="solar:star-line-duotone" width="20" height="20" />
        </button>
      </div>

      <div class="right-actions">
        <button v-if="emailStore.contentData.showReply" v-perm="'email:send'" class="action-btn" @click="openReply" :title="$t('reply') || 'Reply'">
          <Icon icon="material-symbols:reply" width="20" height="20" />
        </button>
        <button v-if="emailStore.contentData.showReply" v-perm="'email:send'" class="action-btn" @click="openForward" :title="$t('forward') || 'Forward'">
          <Icon icon="material-symbols:forward" width="20" height="20" />
        </button>
        <button class="action-btn" :title="$t('more') || 'More'">
          <Icon icon="material-symbols:more-vert" width="20" height="20" />
        </button>
      </div>
    </div>

    <el-scrollbar class="scrollbar">
      <div class="container">
        <!-- Subject -->
        <h1 class="email-title">{{ email.subject || '(No Subject)' }}</h1>
        
        <!-- Sender Info -->
        <div class="sender-info">
          <div class="sender-left">
            <div class="sender-avatar" :style="getAvatarStyle(email.name || email.sendEmail)">
              {{ getInitials(email.name || email.sendEmail) }}
            </div>
            <div class="sender-details">
              <div class="name-line">
                <span class="sender-name">{{ email.name || email.sendEmail }}</span>
                <span class="sender-email">&lt;{{ email.sendEmail }}&gt;</span>
              </div>
              <div class="to-line">
                to me
                <Icon icon="material-symbols:arrow-drop-down" width="16" height="16" class="dropdown-icon" />
              </div>
            </div>
          </div>
          <div class="sender-right">
            <span class="sender-date">{{ formatDetailDate(email.createTime) }}</span>
          </div>
        </div>

        <div class="content">
          <div class="email-info">
            <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)" class="email-msg" type="error" show-icon />
            <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="email-msg" type="warning" show-icon />
            <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="email-msg" type="warning" show-icon />
          </div>

          <!-- Email Body -->
          <el-scrollbar class="htm-scrollbar" :class="email.attList.length === 0 ? 'bottom-distance' : ''">
            <ShadowHtml class="shadow-html" :html="formatImage(email.content)" v-if="email.content" />
            <pre v-else class="email-text" >{{email.text}}</pre>
          </el-scrollbar>

          <!-- Attachments -->
          <div class="att" v-if="email.attList.length > 0">
            <h4 class="att-title">
              <Icon icon="material-symbols:attachment" width="18" height="18" />
              {{$t('attCount',{total: email.attList.length})}} Attachments
            </h4>
            <div class="att-box">
              <div class="att-item" v-for="att in email.attList" :key="att.attId">
                <div class="att-icon-wrapper" :class="getExtName(att.filename)" @click="showImage(att.key)">
                  <Icon v-bind="getIconByName(att.filename)" width="24" height="24" />
                </div>
                <div class="att-details" @click="showImage(att.key)">
                  <p class="att-name">{{ att.filename }}</p>
                  <p class="att-size">{{ formatBytes(att.size) }}</p>
                </div>
                <div class="opt-icon">
                  <Icon v-if="isImage(att.filename)" icon="hugeicons:view" width="20" height="20" @click="showImage(att.key)"/>
                  <a :href="cvtR2Url(att.key)" download>
                    <Icon icon="system-uicons:push-down" width="20" height="20"/>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Inline Reply Box -->
          <div class="inline-reply" v-if="emailStore.contentData.showReply">
            <div class="reply-box" @click="openReply">
              <div class="reply-header">
                <Icon icon="material-symbols:reply" width="20" height="20" />
                <span>{{ $t('replyTo') || 'Reply to' }} {{ email.name || email.sendEmail }}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
    
    <el-image-viewer
        v-if="showPreview"
        :url-list="srcList"
        show-progress
        @close="showPreview = false"
    />
  </div>
</template>
<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import {reactive, ref, watch, onMounted, onUnmounted} from "vue";
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {emailDelete, emailRead} from "@/request/email.js";
import {Icon} from "@iconify/vue";
import {useEmailStore} from "@/store/email.js";
import {useAccountStore} from "@/store/account.js";
import {formatDetailDate} from "@/utils/day.js";
import {starAdd, starCancel} from "@/request/star.js";
import {getExtName, formatBytes} from "@/utils/file-utils.js";
import {cvtR2Url,toOssDomain} from "@/utils/convert.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {allEmailDelete} from "@/request/all-email.js";
import {useUiStore} from "@/store/ui.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";

const uiStore = useUiStore();
const settingStore = useSettingStore();
const accountStore = useAccountStore();
const emailStore = useEmailStore();
const router = useRouter()
const email = emailStore.contentData.email
const showPreview = ref(false)
const srcList = reactive([])

const isMobile = ref(window.innerWidth < 1024);
const handleResize = () => { isMobile.value = window.innerWidth < 1024; };

onMounted(() => {
  window.addEventListener('resize', handleResize);
  if (emailStore.contentData.showUnread && email.unread === EmailUnreadEnum.UNREAD) {
    email.unread = EmailUnreadEnum.READ;
    emailRead([email.emailId]);
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  emailStore.contentData.showUnread = false;
})

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/[\s.@]+/);
  let initials = '';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else {
    initials = parts[0].substring(0, 2).toUpperCase();
  }
  return initials;
}

const avatarColors = [
  '#004ac6', '#ba1a1a', '#00759f', '#565e74', '#005b7c', '#2563eb', '#131b2e'
];

function getAvatarStyle(name) {
  if (!name) return { backgroundColor: avatarColors[0], color: '#fff' };
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = avatarColors[Math.abs(hash) % avatarColors.length];
  return { backgroundColor: color, color: '#fff' };
}

const { t } = useI18n()
watch(() => accountStore.currentAccountId, () => {
  handleBack()
})

onMounted(() => {
  if (emailStore.contentData.showUnread && email.unread === EmailUnreadEnum.UNREAD) {
    email.unread = EmailUnreadEnum.READ;
    emailRead([email.emailId]);
  }
})

onUnmounted(() => {
  emailStore.contentData.showUnread = false;
})

function openReply() {
  uiStore.writerRef.openReply(email)
}

function openForward() {
  uiStore.writerRef.openForward(email)
}

function toMessage(message) {
  return  message ? JSON.parse(message).message : '';
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return  content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function showImage(key) {
  if (!isImage(key)) return;
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif','jfif'].includes(getExtName(filename))
}

function formateReceive(recipient) {
  recipient = JSON.parse(recipient)
  return recipient.map(item => item.address).join(', ')
}

function changeStar() {
  if (email.isStar) {
    email.isStar = 0;
    starCancel(email.emailId).then(() => {
      email.isStar = 0;
      emailStore.cancelStarEmailId = email.emailId
      setTimeout(() => emailStore.cancelStarEmailId = 0)
      emailStore.starScroll?.deleteEmail([email.emailId])
    }).catch((e) => {
      console.error(e)
      email.isStar = 1;
    })
  } else {
    email.isStar = 1;
    starAdd(email.emailId).then(() => {
      email.isStar = 1;
      emailStore.addStarEmailId = email.emailId
      setTimeout(() => emailStore.addStarEmailId = 0)
      emailStore.starScroll?.addItem(email)
    }).catch((e) => {
      console.error(e)
      email.isStar = 0;
    })
  }
}

const handleBack = () => {
  router.back()
}

const handleDelete = () => {
  ElMessageBox.confirm(t('delEmailConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    if (emailStore.contentData.delType === 'logic') {
      emailDelete(email.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.emailId]
      })
    } else  {

      allEmailDelete(email.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.emailId]
      })
    }

    router.back()
  })
}
</script>
<style scoped lang="scss">
.box {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-shrink: 0;

  @media (max-width: 1023px) {
    padding: 0 16px;
  }

  .left-actions, .right-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--el-text-color-regular);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }
    
    &.delete-btn:hover {
      background: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }
  }

  .divider {
    width: 1px;
    height: 24px;
    background: var(--el-border-color-lighter);
    margin: 0 8px;
  }
}

.scrollbar {
  flex: 1;
  width: 100%;
  background: var(--el-bg-color-page);
}

.container {
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  margin-top: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--el-border-color-lighter);
  font-family: 'Manrope', sans-serif;

  @media (max-width: 1023px) {
    padding: 20px;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  .email-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 24px 0;
    line-height: 1.3;
  }

  .sender-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    @media (max-width: 767px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .sender-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .sender-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .sender-details {
        display: flex;
        flex-direction: column;

        .name-line {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;

          .sender-name {
            font-size: 15px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          .sender-email {
            font-size: 13px;
            color: var(--el-text-color-secondary);
          }
        }

        .to-line {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-top: 4px;

          .dropdown-icon {
            cursor: pointer;
            &:hover { color: var(--el-color-primary); }
          }
        }
      }
    }

    .sender-right {
      .sender-date {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .content {
    display: flex;
    flex-direction: column;

    .email-msg {
      max-width: 400px;
      margin-bottom: 16px;
    }

    .email-text, .shadow-html {
      font-size: 15px;
      line-height: 1.6;
      color: var(--el-text-color-regular);
      font-family: inherit;
    }
    
    .email-text {
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }

    .att {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--el-border-color-lighter);

      .att-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .att-box {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;

        .att-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 8px;
          background: var(--el-bg-color);
          width: 260px;
          cursor: pointer;
          transition: background 0.15s;

          &:hover {
            background: var(--el-fill-color-light);
          }

          .att-icon-wrapper {
            width: 40px;
            height: 40px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--el-color-danger-light-9);
            color: var(--el-color-danger);
          }

          .att-details {
            flex: 1;
            min-width: 0;

            .att-name {
              font-size: 13px;
              font-weight: 600;
              color: var(--el-text-color-primary);
              margin: 0 0 2px 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .att-size {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              margin: 0;
            }
          }

          .opt-icon {
            display: flex;
            gap: 8px;
            color: var(--el-text-color-secondary);
            
            a {
              color: inherit;
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }

    /* Inline Reply Box */
    .inline-reply {
      margin-top: 32px;

      .reply-box {
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 12px;
        padding: 16px;
        background: var(--el-bg-color);
        cursor: text;
        transition: border-color 0.15s;

        &:hover {
          border-color: var(--el-color-primary);
        }

        .reply-header {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--el-text-color-regular);
          font-size: 14px;
        }
      }
    }
  }
}

.shadow-html::after  {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--message-block-color);
  pointer-events: none;
}



</style>
