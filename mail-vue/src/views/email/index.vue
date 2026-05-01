<template>
  <div class="email-layout-wrapper" :class="{ 'is-mobile': isMobile }">
    <!-- Email List Pane -->
    <div class="email-list-pane">
      <emailScroll ref="scroll"
                   :cancel-success="cancelStar"
                   :star-success="addStar"
                   :getEmailList="getEmailList"
                   :emailDelete="emailDelete"
                   :star-add="starAdd"
                   :star-cancel="starCancel"
                   :time-sort="params.timeSort"
                   :email-read="emailRead"
                   :show-unread="true"
                   actionLeft="4px"
                   @jump="jumpContent"
      >
        <template #first>
          <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-down-outline"
                v-if="params.timeSort === 0" width="28" height="28"/>
          <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-up-outline" v-else
                width="28" height="28"/>
        </template>
      </emailScroll>
    </div>

    <!-- Preview Pane (Desktop Only) -->
    <div class="email-preview-pane" v-if="!isMobile && emailStore.contentData.email">
      <ContentIndex />
    </div>
    <div class="email-preview-pane empty-pane" v-else-if="!isMobile">
      <el-empty :description="$t('selectEmailToRead') || 'Select an email to read'" />
    </div>

    <!-- Mobile Compose FAB -->
    <button v-if="isMobile" v-perm="'email:send'" class="mobile-compose-fab" @click="openSend">
      <Icon icon="material-symbols:edit-outline-sharp" width="24" height="24" style="font-variation-settings: 'FILL' 1" />
    </button>
  </div>
</template>

<script setup>
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {useSettingStore} from "@/store/setting.js";
import {useUiStore} from "@/store/ui.js";
import emailScroll from "@/components/email-scroll/index.vue"
import ContentIndex from "@/views/content/index.vue"
import {emailList, emailDelete, emailLatest, emailRead} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, onMounted, onBeforeUnmount, reactive, ref, watch} from "vue";
import {sleep} from "@/utils/time-utils.js";
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";
import { useRoute } from 'vue-router'

defineOptions({
  name: 'email'
})

const route = useRoute();
const emailStore = useEmailStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const uiStore = useUiStore();
const scroll = ref({})
const params = reactive({
  timeSort: 0,
})

const isMobile = ref(window.innerWidth < 1024);
const handleResize = () => { isMobile.value = window.innerWidth < 1024; };

onMounted(() => {
  window.addEventListener('resize', handleResize);
  emailStore.emailScroll = scroll;
  latest()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
})

watch(() => accountStore.currentAccountId, () => {
  scroll.value.refreshList();
})

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  scroll.value.refreshList();
}

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showUnread = true
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  
  // On mobile, navigate to the separate message screen. On desktop, the Two-Pane handles it.
  if (isMobile.value) {
    router.push('/message')
  }
}

function openSend() {
  uiStore.writerRef.open();
}

const existIds = new Set();

async function latest() {
  while (true) {

    let autoRefresh = settingStore.settings.autoRefresh;
    await sleep(autoRefresh > 1 ? autoRefresh * 1000 : 3000);

    if (route.name !== 'email') {
      continue;
    }

    const latestId = scroll.value.latestEmail?.emailId

    if (!scroll.value.firstLoad && autoRefresh > 1) {
      try {
        const accountId = accountStore.currentAccountId
        const allReceive = scroll.value.latestEmail?.allReceive
        const curTimeSort = params.timeSort
        let list = []

        if (accountId === scroll.value.latestEmail?.reqAccountId) {
          list = await emailLatest(latestId, accountId, allReceive);
        }

        if (accountId === accountStore.currentAccountId && params.timeSort === curTimeSort && allReceive === accountStore.currentAccount.allReceive) {
          if (list.length > 0) {
            for (let email of list) {
              email.reqAccountId = accountId;
              email.allReceive = allReceive;

              if (!existIds.has(email.emailId)) {
                existIds.add(email.emailId)
                scroll.value.addItem(email)
                await sleep(50)
              }
            }
          }
        }
      } catch (e) {
        if (e.code === 401 || e.code === 403) {
          settingStore.settings.autoRefresh = 0;
        }
        console.error(e)
      }
    }
  }
}

function addStar(email) {
  emailStore.starScroll?.addItem(email)
}

function cancelStar(email) {
  emailStore.starScroll?.deleteEmail([email.emailId])
}

function getEmailList(emailId, size) {
  const accountId =  accountStore.currentAccountId;
  const allReceive = accountStore.currentAccount.allReceive;
  return emailList(accountId, allReceive, emailId, params.timeSort, size, 0).then(data => {
    data.latestEmail.reqAccountId = accountId;
    data.latestEmail.allReceive = allReceive;
    return data;
  })
}

</script>
<style scoped lang="scss">
.email-layout-wrapper {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--el-bg-color);
  
  &.is-mobile {
    flex-direction: column;
    
    .email-list-pane {
      width: 100%;
      border-right: none;
    }
    
    .email-preview-pane {
      display: none;
    }
  }
}

.email-list-pane {
  flex-shrink: 0;
  width: 100%;
  max-width: 400px;
  height: 100%;
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  z-index: 10;
  
  /* Inherit the internal scroll styling from existing components if needed */
  ::v-deep(.email-container) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.email-preview-pane {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  
  &.empty-pane {
    align-items: center;
    justify-content: center;
  }
}

/* Mobile Compose FAB */
.mobile-compose-fab {
  position: fixed;
  bottom: 80px; /* Above bottom nav */
  right: 20px;
  width: 56px;
  height: 56px;
  background: var(--el-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 74, 198, 0.3);
  z-index: 40;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  border: none;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.icon {
  cursor: pointer;
}
</style>

