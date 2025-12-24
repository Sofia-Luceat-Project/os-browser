<script setup lang="ts">
/**
 * StickyNotes.vue
 * デスクトップ用付箋アプリ。
 */
import { ref } from 'vue';

const note = ref('');
const colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'];
const selectedColor = ref(colors[0]);

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <div class="sticky-note" :style="{ backgroundColor: selectedColor }">
    <div class="note-header">
      <div class="color-dots">
        <div 
          v-for="color in colors" 
          :key="color" 
          class="dot" 
          :style="{ backgroundColor: color }"
          @click="selectedColor = color"
        ></div>
      </div>
      <button class="close-btn" @click="emit('close')">×</button>
    </div>
    <textarea 
      v-model="note" 
      placeholder="メモを入力..."
      spellcheck="false"
    ></textarea>
  </div>
</template>

<style scoped>
.sticky-note {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  border-radius: 4px;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  cursor: default;
}

.color-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.1);
  transition: transform 0.1s;
}

.dot:hover {
  transform: scale(1.2);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.5;
  line-height: 1;
}

.close-btn:hover {
  opacity: 1;
}

textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Segoe UI', serif;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

textarea::placeholder {
  color: rgba(0,0,0,0.3);
}
</style>
