<script setup lang="ts">
/**
 * VideoPlayer.vue
 * 動画を再生するアプリ。
 */
import { computed } from 'vue';

const props = defineProps<{
  filePath: string;
}>();

const videoUrl = computed(() => {
  return `http://localhost:3000/api/media?path=${encodeURIComponent(props.filePath)}`;
});
</script>

<template>
  <div class="video-player">
    <video controls autoplay :src="videoUrl">
      Your browser does not support the video tag.
    </video>
    <div class="video-info">
      <span class="filename">{{ filePath.split(/[/\\]/).pop() }}</span>
    </div>
  </div>
</template>

<style scoped>
.video-player {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
}

video {
  width: 100%;
  flex: 1;
  background: #000;
  outline: none;
}

.video-info {
  height: 30px;
  background: #111;
  display: flex;
  align-items: center;
  padding: 0 15px;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #222;
}

.filename {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
