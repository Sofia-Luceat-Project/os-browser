<script setup lang="ts">
/**
 * FileItem.vue
 * 個別のファイルやフォルダをアイコン形式で表示する最小単位のコンポーネント。
 */
defineProps<{
  name: string;
  isDirectory: boolean;
  isLnk?: boolean;
}>();

const emit = defineEmits<{
  (e: 'open'): void
}>();
</script>

<template>
  <div class="file-item" @dblclick="emit('open')">
    <div class="icon-wrapper">
      <div class="icon">
        <span v-if="isDirectory">📁</span>
        <span v-else>📄</span>
      </div>
      <div v-if="isLnk" class="lnk-overlay">↩️</div>
    </div>
    <div class="name">{{ name }}</div>
  </div>
</template>

<style scoped>
.file-item {
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  user-select: none;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.icon-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.icon {
  font-size: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.lnk-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  font-size: 14px;
  background: white;
  border-radius: 2px;
  line-height: 1;
  padding: 1px;
  box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
}

.name {
  font-size: 13px;
  text-align: center;
  word-break: break-all;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
