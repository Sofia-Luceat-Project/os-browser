<script setup lang="ts">
/**
 * FileDetailsList.vue
 * 詳細リスト表示（詳細ビュー）。
 */
import { ref, computed } from 'vue';

const props = defineProps<{
  files: any[];
}>();

const emit = defineEmits<{
  (e: 'open', file: any): void;
  (e: 'contextmenu', payload: { e: MouseEvent, file: any }): void;
}>();

// ソート状態
const sortKey = ref('name');
const sortOrder = ref<'asc' | 'desc'>('asc');

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

// ソート済みファイルリスト
const sortedFiles = computed(() => {
  return [...props.files].sort((a, b) => {
    // フォルダを常に上に表示（オプション）
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    let valA = a[sortKey.value];
    let valB = b[sortKey.value];

    // 日付の場合
    if (sortKey.value === 'mtime') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    
    // 文字列の比較
    if (typeof valA === 'string') {
      return sortOrder.value === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }
    
    // 数値の比較
    return sortOrder.value === 'asc' ? valA - valB : valB - valA;
  });
});

// フォーマットユーティリティ
const formatDate = (dateStr: string) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const formatSize = (bytes: number) => {
  if (bytes === undefined || bytes === null) return '--';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileType = (file: any) => {
  if (file.isDirectory) return 'フォルダ';
  const ext = file.name.split('.').pop()?.toUpperCase();
  return ext ? `${ext} ファイル` : 'ファイル';
};
</script>

<template>
  <div class="details-list">
    <table class="file-table">
      <thead>
        <tr>
          <th @click="toggleSort('name')" :class="{ active: sortKey === 'name' }">
            名前 <span class="sort-icon">{{ sortKey === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
          </th>
          <th @click="toggleSort('mtime')" :class="{ active: sortKey === 'mtime' }">
            更新日時 <span class="sort-icon">{{ sortKey === 'mtime' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
          </th>
          <th @click="toggleSort('type')" :class="{ active: sortKey === 'type' }">
            種類 <span class="sort-icon">{{ sortKey === 'type' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
          </th>
          <th @click="toggleSort('size')" :class="{ active: sortKey === 'size' }">
            サイズ <span class="sort-icon">{{ sortKey === 'size' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="file in sortedFiles" 
          :key="file.name"
          class="file-row"
          @dblclick="emit('open', file)"
          @contextmenu.prevent="emit('contextmenu', { e: $event, file })"
        >
          <td class="col-name">
            <div class="icon-wrapper">
              <span class="icon">{{ file.isDirectory ? '📁' : '📄' }}</span>
              <span v-if="file.isLnk" class="lnk-overlay">↩️</span>
            </div>
            <span class="text">{{ file.name }}</span>
          </td>
          <td class="col-date">{{ formatDate(file.mtime) }}</td>
          <td class="col-type">{{ getFileType(file) }}</td>
          <td class="col-size">{{ file.isDirectory ? '' : formatSize(file.size) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.details-list {
  flex: 1;
  overflow-y: auto;
  background: transparent;
}

.file-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #ddd;
}

thead th {
  text-align: left;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

thead th:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

thead th.active {
  color: #fff;
}

.sort-icon {
  display: inline-block;
  width: 12px;
  margin-left: 5px;
}

.file-row {
  cursor: default;
  transition: background 0.1s;
}

.file-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.file-row td {
  padding: 8px 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.col-name .icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.col-name .icon {
  font-size: 16px;
}

.col-name .lnk-overlay {
  position: absolute;
  bottom: -2px;
  left: -2px;
  font-size: 10px;
  background: white;
  border-radius: 1px;
  line-height: 1;
}

.col-date, .col-type, .col-size {
  color: #999;
}

.file-row:hover .col-date,
.file-row:hover .col-type,
.file-row:hover .col-size {
  color: #ccc;
}
</style>
