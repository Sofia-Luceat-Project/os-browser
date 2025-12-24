<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Knob from '../components/Knob.vue';

const props = defineProps<{
  filePath: string;
}>();

const brightness = ref(100);
const contrast = ref(100);
const saturate = ref(100);
const hueRotate = ref(0);
const blur = ref(0);
const opacity = ref(100);
const shadow = ref(0);
const vignette = ref(0);
const grayscale = ref(0);
const invert = ref(0);
const sepia = ref(0);

// パン（移動）用
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
  brightness.value = 100;
  contrast.value = 100;
  saturate.value = 100;
  hueRotate.value = 0;
  blur.value = 0;
  opacity.value = 100;
  shadow.value = 0;
  vignette.value = 0;
  grayscale.value = 0;
  invert.value = 0;
  sepia.value = 0;
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
  <div class="image-editor">
    <div class="editor-body">
      <div class="sidebar">
        <div class="control-grid">
          <Knob label="明るさ" v-model="brightness" :min="0" :max="200" unit="%" />
          <Knob label="コントラスト" v-model="contrast" :min="0" :max="200" unit="%" />
          <Knob label="彩度" v-model="saturate" :min="0" :max="200" unit="%" />
          <Knob label="色相" v-model="hueRotate" :min="0" :max="360" unit="°" />
          <Knob label="ぼかし" v-model="blur" :min="0" :max="20" unit="px" />
          <Knob label="不透明度" v-model="opacity" :min="0" :max="100" unit="%" />
          <Knob label="影・グロー" v-model="shadow" :min="0" :max="50" unit="px" />
          <Knob label="ビネット" v-model="vignette" :min="0" :max="100" unit="%" />
          <Knob label="グレー" v-model="grayscale" :min="0" :max="100" unit="%" />
          <Knob label="セピア" v-model="sepia" :min="0" :max="100" unit="%" />
          <Knob label="階調反転" v-model="invert" :min="0" :max="100" unit="%" />
        </div>

        <div class="actions">
          <button @click="reset" class="reset-btn">すべてリセット</button>
        </div>
      </div>

      <div 
        class="preview-area"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        :class="{ dragging: isDragging }"
      >
        <div class="preview-container">
          <img 
            :src="imageUrl" 
            :style="{ 
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) blur(${blur}px) grayscale(${grayscale}%) invert(${invert}%) sepia(${sepia}%) opacity(${opacity}%) drop-shadow(0 0 ${shadow}px rgba(0,0,0,1))`,
              transform: `translate(${offset.x}px, ${offset.y}px)`
            }"
            draggable="false"
          />
          <div 
            class="vignette-overlay" 
            :style="{ 
              background: `radial-gradient(circle, transparent ${100 - vignette}%, rgba(0,0,0,${vignette / 100}) 100%)`,
              transform: `translate(${offset.x}px, ${offset.y}px)`
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  color: #ccc;
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #222;
  border-right: 1px solid #333;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  overflow-y: auto;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.preview-area {
  flex: 1;
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  overflow: hidden;
  cursor: grab;
}

.preview-area.dragging {
  cursor: grabbing;
}

.preview-container {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  position: relative;
}

img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  box-shadow: 0 40px 100px rgba(0,0,0,0.9);
  transition: transform 0.1s ease-out;
  user-select: none;
}

.vignette-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: transform 0.1s ease-out;
}

.actions {
  margin-top: auto;
  padding-top: 20px;
}

.reset-btn {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #444;
  color: #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>
