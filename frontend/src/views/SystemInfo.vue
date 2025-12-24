<script setup lang="ts">
/**
 * SystemInfo.vue
 * 詳細なシステム仕様の表示。
 */
import { ref, onMounted } from 'vue';

const stats = ref<any>(null);

const fetchStats = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/stats');
    stats.value = await res.json();
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
};

onMounted(fetchStats);

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}日 ${h}時間 ${m}分`;
};
</script>

<template>
  <div class="system-info custom-scrollbar">
    <div class="hero">
      <div class="os-logo">💻</div>
      <div class="os-name">OS-Browser Enterprise</div>
      <div class="os-version" v-if="stats">{{ stats.system.platform }} {{ stats.system.release }}</div>
    </div>

    <div class="info-sections" v-if="stats">
      <section class="info-card">
        <h3>プロセッサ</h3>
        <p>{{ stats.cpu.model }}</p>
        <p class="detail">{{ stats.cpu.cores }} コア / {{ stats.system.arch }}</p>
      </section>

      <section class="info-card">
        <h3>メモリ</h3>
        <p>{{ (stats.memory.total / (1024**3)).toFixed(1) }} GB 合計</p>
      </section>

      <section class="info-card">
        <h3>システム情報</h3>
        <div class="info-row">
          <span>ホスト名:</span>
          <span>{{ stats.system.hostname }}</span>
        </div>
        <div class="info-row">
          <span>稼働時間:</span>
          <span>{{ formatUptime(stats.system.uptime) }}</span>
        </div>
        <div class="info-row">
          <span>プラットフォーム:</span>
          <span>{{ stats.system.platform }}</span>
        </div>
      </section>
    </div>
    <div v-else class="loading">構成情報を読み込み中...</div>
  </div>
</template>

<style scoped>
.system-info {
  height: 100%;
  background: #121212;
  color: #fff;
  padding: 30px;
  overflow-y: auto;
}

.hero {
  text-align: center;
  margin-bottom: 40px;
}

.os-logo {
  font-size: 64px;
  margin-bottom: 15px;
}

.os-name {
  font-size: 24px;
  font-weight: bold;
}

.os-version {
  font-size: 14px;
  color: #888;
  margin-top: 5px;
}

.info-sections {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 600px;
  margin: 0 auto;
}

.info-card {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;
}

.info-card h3 {
  font-size: 12px;
  color: #3b82f6;
  text-transform: uppercase;
  margin: 0 0 10px;
  letter-spacing: 1px;
}

.info-card p {
  font-size: 16px;
  margin: 0;
}

.info-card .detail {
  font-size: 13px;
  color: #666;
  margin-top: 5px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #222;
  font-size: 14px;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row span:first-child {
  color: #888;
}

.loading {
  text-align: center;
  padding: 100px 0;
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
