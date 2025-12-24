<script setup lang="ts">
/**
 * StartMenu.vue
 * OSのメインメニューとシステム検索ハブ。
 */
import { ref, watch, computed } from 'vue';
import { apps } from '../appRegistry';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'openApp', payload: { id: string, path?: string }): void;
  (e: 'navigate', path: string): void;
}>();

const searchQuery = ref('');
const results = ref<any[]>([]);
const isSearching = ref(false);

const search = async () => {
  if (!searchQuery.value) {
    results.value = [];
    return;
  }
  isSearching.value = true;
  try {
    const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(searchQuery.value)}&path=.`);
    results.value = await res.json();
  } catch (err) {
    console.error('Search failed:', err);
  } finally {
    isSearching.value = false;
  }
};

let debounceTimer: any;
watch(searchQuery, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(search, 300);
});

const handleResultClick = (item: any) => {
  if (item.type === 'app') {
    emit('openApp', { id: item.id });
  } else if (item.type === 'folder') {
    emit('navigate', item.path);
  } else if (item.type === 'file') {
    // 拡張子からアプリを判断して開くロジックは App.vue に任せるか
    // ここでは簡易的に path を渡す
    emit('openApp', { id: 'auto', path: item.path });
  }
  emit('close');
};
const pinnedApps = computed(() => {
  return Object.values(apps.value).filter(app => app.pinned);
});
</script>

<template>
  <div class="start-menu-overlay" @click.self="emit('close')">
    <div class="start-menu" @click.stop>
      <div class="search-section">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="検索 (file:, folder:, app:, .)" 
          class="search-input"
          autofocus
        />
        <div v-if="isSearching" class="search-loader"></div>
      </div>

      <div class="menu-content custom-scrollbar">
        <!-- 検索結果表示 -->
        <div v-if="searchQuery" class="results-view">
          <div v-if="results.length > 0" class="result-list">
            <div 
              v-for="(res, i) in results" 
              :key="i" 
              class="result-item" 
              @click="handleResultClick(res)"
            >
              <span class="icon">{{ res.icon || (res.type === 'folder' ? '📁' : '📄') }}</span>
              <div class="info">
                <div class="name">{{ res.name }}</div>
                <div class="type">{{ res.type }} {{ res.path ? `(${res.path})` : '' }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="!isSearching" class="no-results">一致する項目は見つかりませんでした</div>
        </div>

        <!-- デフォルト表示（ピン留めアプリなど） -->
        <div v-else class="default-view">
          <div class="section-title">ピン留め済み</div>
          <div class="apps-grid">
            <div 
              v-for="app in pinnedApps" 
              :key="app.id" 
              class="app-card"
              @click="emit('openApp', { id: app.id }); emit('close');"
            >
              <div class="app-icon">{{ app.icon }}</div>
              <div class="app-name">{{ app.name }}</div>
            </div>
          </div>

          <div class="section-title">すべてのアプリ</div>
          <div class="all-apps-list">
            <div 
              v-for="app in Object.values(apps)" 
              :key="app.id" 
              class="all-app-item"
              @click="emit('openApp', { id: app.id }); emit('close');"
            >
              <span class="icon">{{ app.icon }}</span>
              <span class="name">{{ app.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="start-footer">
        <div class="user-info">
          <div class="avatar">👤</div>
          <div class="username">Guest User</div>
        </div>
        <button class="power-btn" title="Shut Down">🔌</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.start-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: transparent;
}

.start-menu {
  position: absolute;
  bottom: 60px;
  left: 10px;
  width: 500px;
  max-height: 80vh;
  background: rgba(32, 32, 32, 0.7);
  backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.1, 0.9, 0.2, 1);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.search-section {
  padding: 20px;
  position: relative;
}

.search-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 2px solid #3b82f6;
  color: #fff;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(59, 130, 246, 0.5);
}

.search-loader {
  position: absolute;
  right: 35px;
  top: 32px;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
}

.section-title {
  font-size: 12px;
  font-weight: bold;
  color: #888;
  margin: 20px 0 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.app-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.app-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.app-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.app-name {
  font-size: 12px;
  text-align: center;
  color: #ccc;
}

.all-apps-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.all-app-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.all-app-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.all-app-item .icon {
  font-size: 18px;
}

.all-app-item .name {
  font-size: 13px;
  color: #ccc;
}

.results-view {
  display: flex;
  flex-direction: column;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.result-item:hover {
  background: rgba(59, 130, 246, 0.15);
}

.result-item .icon {
  font-size: 24px;
}

.result-item .info {
  display: flex;
  flex-direction: column;
}

.result-item .name {
  font-size: 14px;
  color: #fff;
}

.result-item .type {
  font-size: 11px;
  color: #888;
}

.no-results {
  text-align: center;
  padding: 40px 0;
  color: #666;
  font-style: italic;
}

.start-footer {
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  font-size: 18px;
  background: #444;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
}

.username {
  font-size: 13px;
  color: #eee;
}

.power-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.power-btn:hover {
  opacity: 1;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
