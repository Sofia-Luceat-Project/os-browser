<script setup lang="ts">
/**
 * FileSidebar.vue
 * Windows Explorer風のナビゲーションサイドバー。
 */
import { ref, onMounted } from 'vue';

const emit = defineEmits<{
  (e: 'navigate', path: string): void
}>();

const shortcuts = ref([
  { id: 'quick-access', name: 'クイック アクセス', icon: '⭐', isHeader: true },
  { id: 'desktop', name: 'デスクトップ', icon: '🖥️', path: '' },
  { id: 'documents', name: 'ドキュメント', icon: '📄', path: '' },
  { id: 'downloads', name: 'ダウンロード', icon: '⬇️', path: '' },
  { id: 'this-pc', name: 'この PC', icon: '💻', isHeader: true },
  { id: 'root', name: 'OS ルート (C:)', icon: '💽', path: 'C:\\' },
]);

onMounted(async () => {
  try {
    // ユーザーパスの取得
    const pathsRes = await fetch('http://localhost:3000/api/user-paths');
    const paths = await pathsRes.json();
    
    // システムドライブの取得
    const drivesRes = await fetch('http://localhost:3000/api/system/drives');
    const drives = await drivesRes.json();
    
    // パスを更新
    shortcuts.value.forEach(item => {
      if (item.id === 'desktop') item.path = paths.desktop;
      if (item.id === 'documents') item.path = paths.documents;
      if (item.id === 'downloads') item.path = paths.downloads;
    });

    // ドライブ一覧を追加 (既存の root は削除して動的に生成)
    const rootIndex = shortcuts.value.findIndex(s => s.id === 'root');
    if (rootIndex !== -1) shortcuts.value.splice(rootIndex, 1);

    drives.forEach((drive: string, index: number) => {
      shortcuts.value.push({
        id: `drive-${index}`,
        name: `ローカル ディスク (${drive.replace('\\', '')})`,
        icon: '💽',
        path: drive
      });
    });

  } catch (err) {
    console.error('Failed to fetch system info:', err);
  }
});
</script>

<template>
  <aside class="file-sidebar">
    <div v-for="item in shortcuts" :key="item.id" 
         :class="['sidebar-item', { header: item.isHeader, disabled: !item.isHeader && !item.path }]"
         @click="!item.isHeader && item.path && emit('navigate', item.path)">
      <span class="icon">{{ item.icon }}</span>
      <span class="name">{{ item.name }}</span>
    </div>
  </aside>
</template>

<style scoped>
.file-sidebar {
  width: 200px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  user-select: none;
}

.sidebar-item {
  padding: 8px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #ccc;
  cursor: pointer;
  transition: background 0.2s;
}

.sidebar-item:not(.header):hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.sidebar-item.disabled {
  opacity: 0.4;
  cursor: default;
}

.sidebar-item.header {
  font-weight: bold;
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 15px;
  cursor: default;
}

.sidebar-item.header:first-child {
  margin-top: 0;
}

.icon {
  font-size: 16px;
  width: 20px;
  display: flex;
  justify-content: center;
}

.name {
  flex: 1;
}
</style>
