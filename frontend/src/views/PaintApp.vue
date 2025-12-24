<script setup lang="ts">
/**
 * PaintApp.vue
 * キャンバスを使用した自由描画ツール。
 */
import { ref, onMounted } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const isDrawing = ref(false);
const color = ref("#3b82f6");
const brushSize = ref(5);

const startDrawing = (e: MouseEvent) => {
  isDrawing.value = true;
  draw(e);
};

const stopDrawing = () => {
  isDrawing.value = false;
  ctx.value?.beginPath();
};

const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !ctx.value || !canvasRef.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.value.lineWidth = brushSize.value;
  ctx.value.lineCap = 'round';
  ctx.value.strokeStyle = color.value;

  ctx.value.lineTo(x, y);
  ctx.value.stroke();
  ctx.value.beginPath();
  ctx.value.moveTo(x, y);
};

const clear = () => {
  if (!ctx.value || !canvasRef.value) return;
  ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
};

onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d');
    canvasRef.value.width = canvasRef.value.parentElement?.clientWidth || 800;
    canvasRef.value.height = canvasRef.value.parentElement?.clientHeight || 600;
  }
});
</script>

<template>
  <div class="paint-app">
    <div class="paint-toolbar">
      <input type="color" v-model="color" class="color-picker" />
      <div class="brush-settings">
        <span>Size:</span>
        <input type="range" min="1" max="50" v-model="brushSize" />
        <span>{{ brushSize }}px</span>
      </div>
      <button @click="clear" class="clear-btn">Clear</button>
    </div>
    <div class="canvas-container">
      <canvas 
        ref="canvasRef"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.paint-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #eee;
}

.paint-toolbar {
  height: 50px;
  background: #252525;
  display: flex;
  align-items: center;
  padding: 0 15px;
  gap: 20px;
  color: #fff;
  border-bottom: 2px solid #1a1a1a;
}

.canvas-container {
  flex: 1;
  background: white;
  cursor: crosshair;
  overflow: hidden;
}

.color-picker {
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.brush-settings {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.clear-btn {
  margin-left: auto;
  padding: 5px 15px;
  background: #ff5f57;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.clear-btn:hover { background: #ff7b72; }
</style>
