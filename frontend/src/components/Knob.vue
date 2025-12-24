<script setup lang="ts">
/**
 * Knob.vue
 * スタイリッシュな円形ダイアル UI。
 * マウスドラッグで値を変更できます。
 */
import { ref, computed } from 'vue';

const props = defineProps<{
  modelValue: number;
  min: number;
  max: number;
  label: string;
  unit?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const isDragging = ref(false);
const startY = ref(0);
const startValue = ref(0);

const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true;
  startY.value = e.clientY;
  startValue.value = props.modelValue;
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  // 上にドラッグでプラス、下にドラッグでマイナス
  const delta = startY.value - e.clientY;
  const range = props.max - props.min;
  const step = range / 200; // ドラッグ 200px で全レンジ移動
  let newValue = startValue.value + delta * step;
  
  // 範囲制限
  newValue = Math.max(props.min, Math.min(props.max, newValue));
  emit('update:modelValue', Math.round(newValue));
};

const handleMouseUp = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
};

// 回転角度の計算 (-135deg から 135deg の範囲)
const rotationAngle = computed(() => {
  const percent = (props.modelValue - props.min) / (props.max - props.min);
  return (percent * 270) - 135;
});
</script>

<template>
  <div class="knob-container">
    <div class="knob-label">{{ label }}</div>
    <div 
      class="knob-outer" 
      @mousedown="handleMouseDown"
      :class="{ dragging: isDragging }"
    >
      <div class="knob-inner">
        <div class="knob-value">
          <span class="num">{{ modelValue }}</span>
          <span class="unit" v-if="unit">{{ unit }}</span>
        </div>
      </div>
      <!-- 位置を示す棒（指針） -->
      <div class="knob-pointer" :style="{ transform: `rotate(${rotationAngle}deg)` }">
        <div class="pointer-mark"></div>
      </div>
      <!-- 周囲のゲージ（装飾用） -->
      <svg class="knob-gauge" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" class="bg" />
        <circle 
          cx="50" cy="50" r="45" 
          class="val" 
          :style="{ 
            strokeDasharray: '212 283',
            strokeDashoffset: 212 - (212 * ((modelValue - min) / (max - min))) 
          }" 
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.knob-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.knob-label {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.knob-outer {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
  box-shadow: 
    4px 4px 8px #101010,
    -2px -2px 6px #303030,
    inset 0 0 10px rgba(0,0,0,0.5);
  cursor: grab;
  display: flex;
  justify-content: center;
  align-items: center;
}

.knob-outer.dragging {
  cursor: grabbing;
}

.knob-inner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #202020;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.8);
  z-index: 2;
}

.knob-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.knob-value .num {
  font-size: 14px;
  font-weight: bold;
  color: #3b82f6;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.knob-value .unit {
  font-size: 8px;
  color: #666;
  margin-top: 2px;
}

.knob-pointer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
  transition: transform 0.1s ease-out;
}

.pointer-mark {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 10px;
  background: #3b82f6;
  border-radius: 2px;
  box-shadow: 0 0 5px rgba(59, 130, 246, 0.8);
}

.knob-gauge {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(135deg);
  z-index: 1;
}

.knob-gauge circle {
  fill: none;
  stroke-width: 4;
}

.knob-gauge .bg {
  stroke: #111;
  stroke-dasharray: 212 283; /* 270度分の円周 */
}

.knob-gauge .val {
  stroke: #3b82f6;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.1s ease-out;
}
</style>
