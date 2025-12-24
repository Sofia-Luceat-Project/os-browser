<script setup lang="ts">
/**
 * OSSelect.vue
 * OSテーマに合わせたスタイリッシュなセレクトボックス。
 */
defineProps<{
  modelValue: string;
  options: { label: string; value: string; info?: string }[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const handleChange = (e: Event) => {
  const val = (e.target as HTMLSelectElement).value;
  emit('update:modelValue', val);
};
</script>

<template>
  <div class="os-select-wrapper">
    <select :value="modelValue" @change="handleChange" class="os-select">
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}{{ opt.info ? ` ${opt.info}` : '' }}
      </option>
    </select>
    <div class="arrow">▾</div>
  </div>
</template>

<style scoped>
.os-select-wrapper {
  position: relative;
  display: inline-block;
}

.os-select {
  appearance: none;
  background: rgba(40, 40, 40, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ccc;
  font-size: 11px;
  padding: 4px 24px 4px 8px;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.os-select:hover {
  background: rgba(60, 60, 60, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.os-select option {
  background: #252525;
  color: #ccc;
}

.arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #666;
  pointer-events: none;
}
</style>
