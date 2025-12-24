<script setup lang="ts">
/**
 * ContextMenu.vue
 * 右クリックで表示される動的なメニュー。
 */
import { onMounted, onUnmounted } from 'vue';
import { getAppsForExtension, type AppConfig } from '../appRegistry';

const props = defineProps<{
  x: number;
  y: number;
  file: { name: string; isDirectory: boolean; extension: string };
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectApp', app: AppConfig): void;
}>();

const availableApps = props.file.isDirectory ? [] : getAppsForExtension(props.file.extension);

// 外部クリックで閉じる処理
const handleGlobalClick = () => emit('close');
onMounted(() => window.addEventListener('click', handleGlobalClick));
onUnmounted(() => window.removeEventListener('click', handleGlobalClick));

const showAlert = (msg: string) => {
  window.alert(msg);
};
</script>

<template>
  <div class="context-menu" :style="{ top: y + 'px', left: x + 'px' }" @click.stop>
    <div class="menu-item disabled">
      <span class="label">{{ file.name }}</span>
    </div>
    <div class="separator"></div>
    
    <!-- アプリで開くサブメニュー -->
    <div class="menu-item has-submenu" v-if="availableApps.length > 0">
      <span class="icon">🚀</span>
      <span class="label">アプリで開く</span>
      <span class="arrow">▶</span>
      <div class="submenu">
        <div 
          v-for="app in availableApps" 
          :key="app.id" 
          class="menu-item" 
          @click="emit('selectApp', app)"
        >
          <span class="icon">{{ app.icon }}</span>
          <span class="label">{{ app.name }}</span>
        </div>
      </div>
    </div>
    
    <div class="menu-item" @click="showAlert('削除機能は未実装です')">
      <span class="icon">🗑️</span>
      <span class="label">削除</span>
    </div>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 5px 0;
  min-width: 180px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  font-size: 13px;
  color: #eee;
}

.menu-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-item.disabled {
  color: #888;
  cursor: default;
  font-weight: bold;
}

.menu-item.disabled:hover {
  background: transparent;
}

.separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 5px 0;
}

.icon {
  font-size: 16px;
  width: 16px;
  display: flex;
  justify-content: center;
}

.label {
  flex-grow: 1;
}

.arrow {
  font-size: 10px;
  color: #666;
}

/* サブメニューのスタイル */
.has-submenu:hover .submenu {
  display: block;
}

.submenu {
  display: none;
  position: absolute;
  top: 0;
  left: 100%;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 5px 0;
  min-width: 150px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
</style>
