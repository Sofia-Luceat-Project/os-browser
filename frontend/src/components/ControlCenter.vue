<script setup lang="ts">
/**
 * ControlCenter.vue
 * システムのクイック設定パネル。
 */
import { ref } from 'vue';

const isNightMode = ref(false);
const isWifiOn = ref(true);
const isBluetoothOn = ref(false);
const volume = ref(70);
const brightness = ref(85);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:nightMode', value: boolean): void;
}>();

const toggleNightMode = () => {
  isNightMode.value = !isNightMode.value;
  emit('update:nightMode', isNightMode.value);
};
</script>

<template>
  <div class="control-center-overlay" @click.self="emit('close')">
    <div class="control-center">
      <div class="quick-settings">
        <div 
          class="setting-tile" 
          :class="{ active: isWifiOn }" 
          @click="isWifiOn = !isWifiOn"
        >
          <div class="icon">📶</div>
          <div class="label">Wi-Fi</div>
        </div>
        <div 
          class="setting-tile" 
          :class="{ active: isBluetoothOn }" 
          @click="isBluetoothOn = !isBluetoothOn"
        >
          <div class="icon">🦷</div>
          <div class="label">Bluetooth</div>
        </div>
        <div 
          class="setting-tile" 
          :class="{ active: isNightMode }" 
          @click="toggleNightMode"
        >
          <div class="icon">🌙</div>
          <div class="label">夜間モード</div>
        </div>
      </div>

      <div class="sliders-section">
        <div class="slider-group">
          <div class="icon">🔊</div>
          <input type="range" v-model="volume" min="0" max="100" />
        </div>
        <div class="slider-group">
          <div class="icon">☀️</div>
          <input type="range" v-model="brightness" min="0" max="100" />
        </div>
      </div>

      <div class="footer">
        <div class="battery">🔋 85% (放電中)</div>
        <button class="settings-btn">⚙️ すべての設定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-center-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10001;
  background: transparent;
}

.control-center {
  position: absolute;
  bottom: 60px;
  right: 10px;
  width: 320px;
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.quick-settings {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.setting-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-tile:hover {
  background: rgba(255, 255, 255, 0.1);
}

.setting-tile.active {
  background: #3b82f6;
  color: #fff;
}

.setting-tile .icon {
  font-size: 20px;
}

.setting-tile .label {
  font-size: 11px;
}

.sliders-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-group .icon {
  font-size: 18px;
  width: 24px;
}

input[type="range"] {
  flex: 1;
  accent-color: #3b82f6;
  height: 4px;
  cursor: pointer;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid rgba(255,255,255,0.05);
  font-size: 12px;
}

.settings-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
