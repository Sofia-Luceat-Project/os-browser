<script setup lang="ts">
/**
 * Terminal.vue
 * ブラウザ上で動作するシェル端末。
 */
import { ref, onMounted, nextTick } from 'vue';

const props = defineProps<{
  initialDir?: string;
}>();

const history = ref<{ type: 'cmd' | 'out' | 'err' | 'info', content: string }[]>([]);
const currentInput = ref('');
const cwd = ref(props.initialDir || 'C:\\');
const isProcessing = ref(false);
const terminalLines = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);

const focusInput = () => {
  input.value?.focus();
};

const executeCommand = async () => {
  const cmd = currentInput.value.trim();
  if (!cmd) return;

  history.value.push({ type: 'cmd', content: `${cwd.value}> ${cmd}` });
  currentInput.value = '';
  isProcessing.value = true;

  // ローカルコマンドの処理 (cd)
  if (cmd.startsWith('cd ')) {
    const newPath = cmd.slice(3).trim();
    // 簡易的なパス解決 (本来はバックエンドで検証すべきだが、ここでは見た目上の制御)
    // 実際にはバックエンドの readdir などで存在確認するのが望ましい
    cwd.value = newPath;
    history.value.push({ type: 'info', content: `Directory changed to ${cwd.value}` });
    isProcessing.value = false;
    scrollToBottom();
    return;
  }

  if (cmd === 'clear' || cmd === 'cls') {
    history.value = [];
    isProcessing.value = false;
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, cwd: cwd.value })
    });
    const data = await res.json();
    
    if (data.stdout) {
      history.value.push({ type: 'out', content: data.stdout });
    }
    if (data.stderr) {
      history.value.push({ type: 'err', content: data.stderr });
    }
  } catch (err: any) {
    history.value.push({ type: 'err', content: `Error: ${err.message}` });
  } finally {
    isProcessing.value = false;
    scrollToBottom();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (terminalLines.value) {
    terminalLines.value.scrollTop = terminalLines.value.scrollHeight;
  }
};

onMounted(() => {
  history.value.push({ type: 'info', content: 'OS-Browser Terminal v1.0.0' });
  history.value.push({ type: 'info', content: 'Type "help" for a list of locally handled commands.' });
});
</script>

<template>
  <div class="terminal-app" @click="focusInput">
    <div class="terminal-output custom-scrollbar" ref="terminalLines">
      <div v-for="(line, i) in history" :key="i" :class="['line', line.type]">
        <pre>{{ line.content }}</pre>
      </div>
      <div v-if="isProcessing" class="line info">
        <span class="loader-dots">Processing...</span>
      </div>
    </div>
    
    <div class="terminal-input-line">
      <span class="prompt">{{ cwd }}></span>
      <input 
        ref="input"
        type="text" 
        v-model="currentInput" 
        @keydown.enter="executeCommand"
        :disabled="isProcessing"
        autofocus
      />
    </div>
  </div>
</template>

<style scoped>
.terminal-app {
  height: 100%;
  background: #0c0c0c;
  color: #ccc;
  font-family: 'Cascadia Code', 'Consolas', 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  padding: 10px;
  font-size: 14px;
}

.terminal-output {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 5px;
}

.line {
  margin-bottom: 2px;
  white-space: pre-wrap;
  word-break: break-all;
}

.line pre {
  margin: 0;
  font-family: inherit;
}

.line.cmd { color: #fff; font-weight: bold; }
.line.out { color: #ccc; }
.line.err { color: #ef4444; }
.line.info { color: #3b82f6; font-style: italic; }

.terminal-input-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt {
  color: #10b981;
  white-space: nowrap;
}

input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-family: inherit;
  font-size: inherit;
}

.loader-dots {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 10px;
}
</style>
