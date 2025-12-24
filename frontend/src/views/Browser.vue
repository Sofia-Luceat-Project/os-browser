<script setup lang="ts">
/**
 * Browser.vue
 * シンプルなWebブラウザアプリ。
 */
import { ref } from 'vue';

const props = defineProps<{
  initialUrl?: string;
}>();

const urlInput = ref(props.initialUrl || 'https://www.google.com/search?igu=1');
const currentUrl = ref(urlInput.value);
const isLoading = ref(false);

const navigate = () => {
  let url = urlInput.value.trim();
  if (!url) return;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}&igu=1`;
    }
  }
  
  currentUrl.value = url;
  urlInput.value = url;
  isLoading.value = true;
};

const handleLoad = () => {
  isLoading.value = false;
};

const goHome = () => {
  urlInput.value = 'https://www.google.com/search?igu=1';
  navigate();
};
</script>

<template>
  <div class="browser-app">
    <div class="browser-toolbar">
      <div class="nav-btns">
        <button class="nav-btn" @click="goHome" title="Home">🏠</button>
      </div>
      
      <div class="address-bar-wrapper">
        <input 
          type="text" 
          v-model="urlInput" 
          @keydown.enter="navigate" 
          class="address-bar"
          placeholder="URLを入力、または検索"
        />
        <button class="go-btn" @click="navigate">➔</button>
      </div>

      <div class="status-indicators">
        <div v-if="isLoading" class="loader"></div>
      </div>
    </div>

    <div class="browser-content">
      <iframe 
        :src="currentUrl" 
        class="browser-viewport" 
        @load="handleLoad"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
      
      <!-- iframeがブロックされた場合のメッセージ（簡易） -->
      <div class="iframe-overlay" v-if="false">
        <p>このサイトは直接表示できない可能性があります。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.browser-app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #fff;
  color: #333;
}

.browser-toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  background: #f3f3f3;
  border-bottom: 1px solid #ddd;
}

.nav-btns {
  display: flex;
  gap: 4px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: rgba(0,0,0,0.05);
}

.address-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 20px;
  padding: 0 4px 0 12px;
  height: 32px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.address-bar-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.address-bar {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #333;
}

.go-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  display: flex;
  justify-content: center;
  align-items: center;
}

.go-btn:hover {
  background: #eee;
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0,0,0,0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.browser-content {
  flex: 1;
  position: relative;
}

.browser-viewport {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

.iframe-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}
</style>
