<script setup lang="ts">
/**
 * FileExplorer.vue
 * Windows Explorer風に高度化されたファイルエクスプローラー。
 */
import { ref, onMounted } from 'vue';
import FileItem from '../components/FileItem.vue';
import FileSidebar from '../components/FileSidebar.vue';
import FileDetailsList from '../components/FileDetailsList.vue';
import { getAppsForExtension, type AppConfig } from '../appRegistry';

const emit = defineEmits<{
  (e: 'openApp', payload: { app: AppConfig, path: string }): void;
  (e: 'context-menu', payload: { x: number, y: number, file: any }): void;
}>();

const currentPath = ref('.');
const files = ref<any[]>([]);
const loading = ref(false);
const viewMode = ref<'grid' | 'details'>('grid');

// バックエンドからファイル一覧を取得する
const fetchFiles = async (path: string) => {
  loading.value = true;
  try {
    const response = await fetch(`http://localhost:3000/api/files?path=${encodeURIComponent(path)}`);
    const data = await response.json();
    if (data.error) {
      console.error(`Error: ${data.error}`);
    } else {
      files.value = data.files;
      currentPath.value = data.currentPath;
    }
  } catch (err) {
    console.error('Failed to fetch files:', err);
  } finally {
    loading.value = false;
  }
};

// フォルダを開く
const openEntry = (entry: any) => {
  const fullPath = entry.isLnk && entry.lnkTarget 
    ? entry.lnkTarget 
    : (currentPath.value === '.' || currentPath.value === '' 
        ? entry.name 
        : `${currentPath.value}/${entry.name}`);

  if (entry.isDirectory) {
    fetchFiles(fullPath);
  } else {
    const ext = entry.name.split('.').pop() || '';
    const suitableApps = getAppsForExtension(`.${ext}`);
    if (suitableApps.length > 0) {
      const app = suitableApps[0];
      if (app) emit('openApp', { app, path: fullPath });
    }
  }
};

// 右クリックでコンテキストメニューを表示 (App.vue へ委譲)
const handleContextMenu = (e: MouseEvent, file: any) => {
  e.preventDefault();
  const fullPath = currentPath.value === '.' || currentPath.value === ''
    ? file.name
    : `${currentPath.value}/${file.name}`;
  
  emit('context-menu', { 
    x: e.clientX, 
    y: e.clientY, 
    file: { ...file, path: fullPath } 
  });
};

// ナビゲーション
const goBack = () => {
  if (currentPath.value === '.' || currentPath.value === '') return;
  const parts = currentPath.value.split(/[/\\]/);
  parts.pop();
  fetchFiles(parts.join('/') || '.');
};

const navigateTo = (path: string) => {
  fetchFiles(path);
};

onMounted(() => fetchFiles('.'));
</script>

<template>
  <div class="file-explorer">
    <!-- ツールバー -->
    <div class="explorer-toolbar">
      <div class="nav-actions">
        <button class="icon-btn" @click="goBack" :disabled="currentPath === '.' || currentPath === ''">⬅️</button>
        <button class="icon-btn" @click="fetchFiles(currentPath)">🔄</button>
      </div>

      <div class="address-bar">
        <span class="root-icon">📁</span>
        <span class="path-text">{{ currentPath }}</span>
      </div>

      <div class="view-actions">
        <button 
          :class="['icon-btn', { active: viewMode === 'grid' }]" 
          @click="viewMode = 'grid'" 
          title="グリッド表示"
        >🔲</button>
        <button 
          :class="['icon-btn', { active: viewMode === 'details' }]" 
          @click="viewMode = 'details'" 
          title="詳細表示"
        >📝</button>
      </div>
    </div>

    <!-- メインエリア（サイドバー + コンテツ） -->
    <div class="explorer-body">
      <FileSidebar @navigate="navigateTo" />
      
      <div class="explorer-content">
        <div v-if="loading" class="loading-overlay">同期中...</div>
        
        <!-- グリッド表示モード -->
        <div v-if="viewMode === 'grid'" class="file-grid">
          <FileItem 
            v-for="file in files" 
            :key="file.name" 
            :name="file.name" 
            :is-directory="file.isDirectory" 
            :is-lnk="file.isLnk"
            @open="openEntry(file)"
            @contextmenu="handleContextMenu($event, file)"
          />
        </div>

        <!-- 詳細表示モード -->
        <FileDetailsList 
          v-else 
          :files="files" 
          @open="openEntry"
          @contextmenu="({ e, file }) => handleContextMenu(e, file)"
        />
        
        <div v-if="files.length === 0 && !loading" class="empty-state">
          このフォルダは空です
        </div>
      </div>
    </div>



    <!-- ステータスバー -->
    <div class="explorer-status">
      {{ files.length }} 個のアイテム
    </div>
  </div>
</template>

<style scoped>
.file-explorer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: rgba(30, 30, 30, 0.6);
  backdrop-filter: blur(25px) saturate(150%);
  color: #eee;
  overflow: hidden;
}

/* ツールバー */
.explorer-toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-actions, .view-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #aaa;
  font-size: 16px;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.icon-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.address-bar {
  flex: 1;
  height: 30px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 10px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 13px;
}

.path-text {
  color: #888;
}

/* メインエリア */
.explorer-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.explorer-content {
  flex: 1;
  position: relative;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
  padding: 20px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  z-index: 100;
  color: #666;
}

.empty-state {
  margin: auto;
  color: #555;
  font-size: 14px;
}

.explorer-status {
  height: 24px;
  padding: 0 15px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 11px;
  color: #666;
  display: flex;
  align-items: center;
}
</style>
