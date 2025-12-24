<script setup lang="ts">
/**
 * SimpleEditor.vue
 * Zed風のミニマルなテキストエディタ。
 */
import { ref, onMounted, onUnmounted, computed } from 'vue';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import OSSelect from '../components/OSSelect.vue';

const props = defineProps<{
  filePath: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'context-menu', payload: { x: number, y: number, file: any }): void;
}>();

const content = ref('');
const loading = ref(true);
const saving = ref(false);
const statusMsg = ref('');
const encoding = ref('utf-8');
const detectedEncoding = ref('');
const isWrapping = ref(false);

const textAreaRef = ref<HTMLTextAreaElement | null>(null);
const overlayRef = ref<HTMLPreElement | null>(null);

// 行数を計算
const lineCount = computed(() => content.value.split('\n').length);

/**
 * Prism.js を使用したハイライト
 */
const highlightedContent = computed(() => {
  const ext = props.filePath.split('.').pop() || '';
  let lang = 'javascript';
  if (ext === 'ts') lang = 'typescript';
  else if (ext === 'py') lang = 'python';
  else if (ext === 'css') lang = 'css';
  else if (ext === 'json') lang = 'json';

  const grammar = Prism.languages[lang] || Prism.languages.javascript;
  if (!grammar) return content.value;
  return Prism.highlight(content.value, grammar, lang);
});

// スクロール同期
const syncScroll = () => {
  if (textAreaRef.value && overlayRef.value) {
    overlayRef.value.scrollTop = textAreaRef.value.scrollTop;
    overlayRef.value.scrollLeft = textAreaRef.value.scrollLeft;
  }
};

const encodingOptions = computed(() => 
  supportedEncodings.map(enc => ({
    label: enc.toUpperCase(),
    value: enc,
    info: enc === detectedEncoding.value ? '(Auto)' : ''
  }))
);

const supportedEncodings = [
  'utf-8', 'shift_jis', 'euc-jp', 'iso-2022-jp', 'utf-16le', 'utf-16be'
];

// ファイル読み込み
const loadFile = async (targetEncoding?: string) => {
  loading.value = true;
  try {
    const encParam = targetEncoding ? `&encoding=${targetEncoding}` : '';
    const response = await fetch(`http://localhost:3000/api/file/read?path=${encodeURIComponent(props.filePath)}${encParam}`);
    if (!response.ok) throw new Error('読み込み失敗');
    
    // ヘッダーから自動判別された文字コードを取得
    detectedEncoding.value = response.headers.get('X-Detected-Encoding') || 'utf-8';
    if (!targetEncoding) {
      encoding.value = detectedEncoding.value;
    }

    content.value = await response.text();
    statusMsg.value = '読み込み完了';
  } catch (err: any) {
    statusMsg.value = `エラー: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const changeEncoding = (newEnc: string) => {
  encoding.value = newEnc;
  loadFile(newEnc);
};

// エンコーディング変更処理（必要に応じて将来実装）

// 保存
const saveFile = async () => {
  if (saving.value) return;
  saving.value = true;
  statusMsg.value = '保存中...';
  try {
    const response = await fetch(`http://localhost:3000/api/file/write?path=${encodeURIComponent(props.filePath)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.value }),
    });
    if (!response.ok) throw new Error('保存失敗');
    statusMsg.value = '保存しました';
    setTimeout(() => { statusMsg.value = ''; }, 2000);
  } catch (err: any) {
    statusMsg.value = `エラー: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const handleContextMenu = (e: MouseEvent) => {
  emit('context-menu', {
    x: e.clientX,
    y: e.clientY,
    file: { name: props.filePath.split(/[/\\]/).pop(), path: props.filePath, isDirectory: false }
  });
};

// ショートカットキー (Ctrl + S)
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveFile();
  }
};

onMounted(() => {
  loadFile();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="zed-editor">
    <div class="editor-header">
      <div class="file-info">
        <span class="icon">📝</span>
        <span class="filename">{{ filePath.split('/').pop() }}</span>
      </div>
      <div class="actions">
        <button class="save-btn" @click="saveFile" :disabled="saving">保存</button>
      </div>
    </div>

    <div class="editor-main">
      <div v-if="loading" class="editor-loading">読み込み中...</div>
      <div v-else class="editor-container" :class="{ 'is-wrapping': isWrapping }">
        <div class="line-numbers">
          <div v-for="n in lineCount" :key="n" class="line-no">{{ n }}</div>
        </div>
        <div class="editor-view">
          <pre 
            ref="overlayRef" 
            class="syntax-overlay" 
            v-html="highlightedContent"
          ></pre>
          <textarea 
            ref="textAreaRef"
            v-model="content" 
            class="text-area" 
            spellcheck="false"
            @scroll="syncScroll"
            @contextmenu.prevent="handleContextMenu"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="editor-footer">
      <div class="footer-left">
        <span class="status">{{ statusMsg }}</span>
      </div>
      <div class="footer-right">
        <label class="toggle-wrap">
          <input type="checkbox" v-model="isWrapping" />
          <span>折り返し</span>
        </label>
        <OSSelect 
          v-model="encoding" 
          :options="encodingOptions" 
          @update:model-value="changeEncoding"
        />
        <span class="stats">Lines: {{ lineCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.zed-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #181818;
  color: #cccccc;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.editor-header {
  height: 32px;
  background: #202020;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid #101010;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 10px;
}

.save-btn {
  background: transparent;
  color: #888;
  border: none;
  font-size: 12px;
  cursor: pointer;
}

.save-btn:hover {
  color: #fff;
}

.close-btn {
  background: transparent;
  color: #666;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.close-btn:hover {
  color: #ff5f57;
}

.editor-main {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
}

.editor-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
}

.editor-container {
  display: flex;
  height: 100%;
}

.line-numbers {
  width: 45px;
  background: #181818;
  padding: 10px 0;
  color: #404040;
  text-align: right;
  padding-right: 12px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  user-select: none;
  border-right: 1px solid #222;
}

.editor-view {
  flex-grow: 1;
  position: relative;
  background: transparent;
}

.text-area, .syntax-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 10px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre;
  word-wrap: normal;
  overflow: auto;
  box-sizing: border-box;
}

.is-wrapping .text-area,
.is-wrapping .syntax-overlay {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: hidden;
}

.text-area {
  background: transparent;
  border: none;
  color: transparent;
  caret-color: #fff;
  resize: none;
  outline: none;
  z-index: 2;
}

.syntax-overlay {
  pointer-events: none;
  z-index: 1;
  background: transparent;
}

/* Prism 調整 */
:deep(code), :deep(span) {
  font-family: inherit !important;
}

.editor-footer {
  height: 32px;
  background: #151515;
  border-top: 1px solid #202020;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  font-size: 11px;
  color: #666;
}

.footer-left {
  display: flex;
  align-items: center;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.toggle-wrap input {
  cursor: pointer;
}

.toggle-wrap:hover {
  color: #aaa;
}
</style>
