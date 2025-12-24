<script setup lang="ts">
/**
 * HexEditor.vue
 * 全てのファイルをバイナリ形式で表示するアプリ。
 */
import { ref, onMounted, computed } from 'vue';

const props = defineProps<{
  filePath: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'context-menu', payload: { x: number, y: number, file: any }): void;
}>();

const hexData = ref("");
const loading = ref(false);
// スクロール制御（必要に応じて将来実装）

const fetchHex = async () => {
  if (!props.filePath) return;
  loading.value = true;
  try {
    const res = await fetch(`http://localhost:3000/api/file/read?path=${encodeURIComponent(props.filePath)}&encoding=hex`);
    hexData.value = await res.text();
  } catch (err) {
    console.error('Failed to read hex:', err);
  } finally {
    loading.value = false;
  }
};

const rows = computed(() => {
  const result = [];
  const chunkSize = 32; // 16 bytes (32 hex characters)
  for (let i = 0; i < hexData.value.length; i += chunkSize) {
    const hex = hexData.value.substring(i, i + chunkSize);
    const offset = (i / 2).toString(16).padStart(8, '0').toUpperCase();
    
    // Hex pairs
    const pairs = [];
    for (let j = 0; j < hex.length; j += 2) {
      pairs.push(hex.substring(j, j + 2).toUpperCase());
    }

    // ASCII representation
    let ascii = "";
    for (const pair of pairs) {
      const charCode = parseInt(pair, 16);
      ascii += (charCode >= 32 && charCode <= 126) ? String.fromCharCode(charCode) : '.';
    }

    result.push({ offset, pairs, ascii });
  }
  return result;
});

onMounted(fetchHex);
</script>

<template>
  <div class="hex-editor">
    <div class="toolbar">
      <span class="path">{{ filePath }}</span>
      <div v-if="loading" class="spinner">Loading...</div>
    </div>
    <div class="hex-container">
      <div v-for="(row, idx) in rows" :key="idx" class="hex-row">
        <span class="offset">{{ row.offset }}</span>
        <div class="bytes">
          <span v-for="(pair, pIdx) in row.pairs" :key="pIdx" class="byte">{{ pair }}</span>
        </div>
        <span class="ascii">{{ row.ascii }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hex-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #121212;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
}

.toolbar {
  padding: 8px 15px;
  background: #222;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #aaa;
}

.hex-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.hex-row {
  display: flex;
  gap: 20px;
  line-height: 1.4;
  white-space: pre;
}

.offset {
  color: #888;
}

.bytes {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 8px;
  color: #00ff00;
}

.byte {
  width: 2ch;
}

.ascii {
  color: #0088ff;
  border-left: 1px solid #333;
  padding-left: 15px;
}

/* スクロールバー */
.hex-container::-webkit-scrollbar { width: 8px; }
.hex-container::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
</style>
