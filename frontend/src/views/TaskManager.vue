<script setup lang="ts">
/**
 * TaskManager.vue
 * リアルタイムシステム監視とプロセス管理。
 */
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  windows: any[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'killProcess', windowId: string): void;
  (e: 'focusWindow', windowId: string): void;
}>();

const stats = ref<any>(null);
const cpuHistory = ref<number[]>([]);
const memHistory = ref<number[]>([]);
const maxHistory = 30;

const fetchStats = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/stats');
    const data = await res.json();
    stats.value = data;
    
    // 履歴の更新 (パーセンテージ)
    // CPU負荷は loadavg[0] をコア数で割ったものなどで簡易換算
    const cpuLoad = Math.min(100, (data.cpu.load[0] / data.cpu.cores) * 100);
    cpuHistory.value.push(cpuLoad);
    if (cpuHistory.value.length > maxHistory) cpuHistory.value.shift();

    memHistory.value.push(parseFloat(data.memory.percentage));
    if (memHistory.value.length > maxHistory) memHistory.value.shift();
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
};

let interval: any;
onMounted(() => {
  fetchStats();
  interval = setInterval(fetchStats, 2000);
});

onUnmounted(() => {
  clearInterval(interval);
});

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<template>
  <div class="task-manager">
    <div class="tm-sidebar">
      <div class="nav-item active">📈 パフォーマンス</div>
      <div class="nav-item">🗂️ プロセス</div>
    </div>
    
    <div class="tm-content custom-scrollbar">
      <section class="performance-section" v-if="stats">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>CPU</h3>
            <div class="main-val">{{ (stats.cpu.load[0] / stats.cpu.cores * 100).toFixed(1) }}%</div>
            <div class="sub-val">{{ stats.cpu.model }}</div>
            <div class="chart-container">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="1.5"
                  :points="cpuHistory.map((v, i) => `${(i / (maxHistory-1)) * 100},${40 - (v / 100) * 40}`).join(' ')"
                />
              </svg>
            </div>
          </div>

          <div class="stat-card">
            <h3>メモリ</h3>
            <div class="main-val">{{ stats.memory.percentage }}%</div>
            <div class="sub-val">{{ formatBytes(stats.memory.used) }} / {{ formatBytes(stats.memory.total) }}</div>
            <div class="chart-container">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#10b981"
                  stroke-width="1.5"
                  :points="memHistory.map((v, i) => `${(i / (maxHistory-1)) * 100},${40 - (v / 100) * 40}`).join(' ')"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="process-list-container">
          <h3>実行中のプロセス ({{ windows.length }})</h3>
          <table class="process-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="win in windows" :key="win.id">
                <td>{{ win.title }}</td>
                <td><span class="badge">Running</span></td>
                <td>
                  <button class="kill-btn" @click="emit('killProcess', win.id)">終了</button>
                  <button class="focus-btn" @click="emit('focusWindow', win.id)">切替</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
      <div v-else class="loading-state">
        システムデータを取得中...
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-manager {
  display: flex;
  height: 100%;
  background: #1a1a1a;
  color: #eee;
  font-family: 'Inter', sans-serif;
}

.tm-sidebar {
  width: 160px;
  background: #252525;
  border-right: 1px solid #333;
  padding: 10px 0;
}

.nav-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.05);
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.2);
  border-left: 3px solid #3b82f6;
  color: #fff;
}

.tm-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #333;
}

.stat-card h3 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #888;
}

.main-val {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.sub-val {
  font-size: 11px;
  color: #666;
  margin-bottom: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-container {
  height: 60px;
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
  overflow: hidden;
}

.chart-container svg {
  width: 100%;
  height: 100%;
}

.process-list-container h3 {
  font-size: 16px;
  margin-bottom: 15px;
}

.process-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.process-table th {
  text-align: left;
  padding: 10px;
  border-bottom: 1px solid #333;
  color: #666;
}

.process-table td {
  padding: 10px;
  border-bottom: 1px solid #222;
}

.badge {
  background: #065f46;
  color: #34d399;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.kill-btn, .focus-btn {
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  margin-right: 5px;
}

.kill-btn:hover {
  background: #7f1d1d;
  border-color: #b91c1c;
  color: #fff;
}

.focus-btn:hover {
  background: #1e3a8a;
  border-color: #2563eb;
  color: #fff;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
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
