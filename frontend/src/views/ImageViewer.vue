<script setup lang="ts">
/**
 * ImageViewer.vue
 * 画像を表示・簡易調整するアプリ。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  filePath: string;
}>();

const emit = defineEmits<{
  (e: 'edit-image', path: string): void;
}>();

const zoom = ref(1);
const rotation = ref(0);
const offset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const startPos = ref({ x: 0, y: 0 });

const imageUrl = computed(() => {
  return `http://localhost:3000/api/media?path=${encodeURIComponent(props.filePath)}`;
});

const onMouseDown = (e: MouseEvent) => {
  isDragging.value = true;
  startPos.value = { x: e.clientX - offset.value.x, y: e.clientY - offset.value.y };
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  offset.value = {
    x: e.clientX - startPos.value.x,
    y: e.clientY - startPos.value.y
  };
};

const onMouseUp = () => {
  isDragging.value = false;
};

const reset = () => {
  zoom.value = 1;
  rotation.value = 0;
  offset.value = { x: 0, y: 0 };
};

onMounted(() => {
  window.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
  window.removeEventListener('mouseup', onMouseUp);
});
</script>

<template>
  <div class="image-viewer">
    <div class="viewer-toolbar">
      <div class="controls">
        <button @click="zoom += 0.1" title="ズームイン">➕</button>
        <button @click="zoom = Math.max(0.1, zoom - 0.1)" title="ズームアウト">➖</button>
        <button @click="rotation += 90" title="回転">🔄</button>
        <button @click="reset">Reset</button>
        <button class="edit-btn" @click="emit('edit-image', filePath)">🎨 編集</button>
      </div>
    </div>
    <div 
      class="image-container" 
      @mousedown="onMouseDown" 
      @mousemove="onMouseMove"
      :class="{ dragging: isDragging }"
    >
      <img 
        :src="imageUrl" 
        :style="{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`
        }"
        draggable="false"
      />
    </div>
  </div>
</template>

<style scoped>
.image-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #111;
  color: white;
}

.viewer-toolbar {
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 30px;
  font-size: 12px;
}

.controls, .sliders {
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle, #222 0%, #000 100%);
  position: relative;
  cursor: grab;
}

.image-container.dragging {
  cursor: grabbing;
}

img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.1s ease-out;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  user-select: none;
}

button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover { background: rgba(255, 255, 255, 0.2); }

.edit-btn {
  margin-left: 20px;
  background: #3b82f6;
}

.edit-btn:hover { background: #2563eb; }
</style>
