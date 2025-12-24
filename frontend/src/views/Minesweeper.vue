<script setup lang="ts">
/**
 * Minesweeper.vue
 * クラシックなマインスイーパゲーム。
 */
import { ref, onMounted } from 'vue';

const rows = 10;
const cols = 10;
const minesCount = 10;

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

const grid = ref<Cell[][]>([]);
const gameState = ref<'playing' | 'won' | 'lost'>('playing');
const flagsUsed = ref(0);
const timer = ref(0);
let timerInterval: any = null;

const initGame = () => {
  gameState.value = 'playing';
  flagsUsed.value = 0;
  timer.value = 0;
  clearInterval(timerInterval);
  
  // グリッド初期化
  const newGrid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r, col: c, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0
      });
    }
    newGrid.push(row);
  }

  // 地雷配置
  let minesPlaced = 0;
  while (minesPlaced < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const cell = newGrid[r]?.[c];
    if (cell && !cell.isMine) {
      cell.isMine = true;
      minesPlaced++;
    }
  }

  // 近傍地雷数計算
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newGrid[r]?.[c]?.isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr]?.[nc]?.isMine) {
            count++;
          }
        }
      }
      const targetCell = newGrid[r]?.[c];
      if (targetCell) targetCell.neighborMines = count;
    }
  }
  grid.value = newGrid;
};

const revealCell = (r: number, c: number) => {
  if (gameState.value !== 'playing') return;
  const cell = grid.value[r]?.[c];
  if (!cell || cell.isRevealed || cell.isFlagged) return;

  if (timer.value === 0) {
    timerInterval = setInterval(() => timer.value++, 1000);
  }

  cell.isRevealed = true;

  if (cell.isMine) {
    gameState.value = 'lost';
    revealAllMines();
    clearInterval(timerInterval);
    return;
  }

  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          revealCell(nr, nc);
        }
      }
    }
  }

  checkWin();
};

const toggleFlag = (e: Event, r: number, c: number) => {
  e.preventDefault();
  if (gameState.value !== 'playing') return;
  const cell = grid.value[r]?.[c];
  if (!cell || cell.isRevealed) return;

  cell.isFlagged = !cell.isFlagged;
  flagsUsed.value += cell.isFlagged ? 1 : -1;
};

const revealAllMines = () => {
  grid.value.forEach(row => row.forEach(cell => {
    if (cell.isMine) cell.isRevealed = true;
  }));
};

const checkWin = () => {
  let revealedCount = 0;
  grid.value.forEach(row => row.forEach(cell => {
    if (cell.isRevealed) revealedCount++;
  }));
  if (revealedCount === (rows * cols) - minesCount) {
    gameState.value = 'won';
    clearInterval(timerInterval);
  }
};

onMounted(initGame);
</script>

<template>
  <div class="minesweeper">
    <div class="ms-header">
      <div class="stat">🚩 {{ minesCount - flagsUsed }}</div>
      <button class="reset-btn" @click="initGame">
        {{ gameState === 'playing' ? '😊' : gameState === 'won' ? '😎' : '😵' }}
      </button>
      <div class="stat">⏱️ {{ timer }}</div>
    </div>

    <div class="ms-grid" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
      <template v-for="(row, r) in grid">
        <div 
          v-for="(cell, c) in row" 
          :key="`${r}-${c}`"
          class="cell"
          :class="{ revealed: cell.isRevealed, mine: cell.isRevealed && cell.isMine }"
          @click="revealCell(r, c)"
          @contextmenu="toggleFlag($event, r, c)"
        >
          <template v-if="cell.isFlagged && !cell.isRevealed">🚩</template>
          <template v-if="cell.isRevealed">
            <span v-if="cell.isMine">💣</span>
            <span v-else-if="cell.neighborMines > 0" :class="`num-${cell.neighborMines}`">
              {{ cell.neighborMines }}
            </span>
          </template>
        </div>
      </template>
    </div>

    <div v-if="gameState !== 'playing'" class="overlay">
      <div class="msg">{{ gameState === 'won' ? 'YOU WIN!' : 'GAME OVER' }}</div>
      <button @click="initGame">再挑戦</button>
    </div>
  </div>
</template>

<style scoped>
.minesweeper {
  background: #bdbdbd;
  padding: 10px;
  border: 4px outset #eee;
  display: flex;
  flex-direction: column;
  gap: 10px;
  user-select: none;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
  height: 100%;
}

.ms-header {
  background: #bdbdbd;
  border: 4px inset #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
}

.stat {
  background: #000;
  color: #f00;
  font-family: monospace;
  font-size: 20px;
  padding: 2px 5px;
  border: 2px inset #eee;
  min-width: 50px;
  text-align: right;
}

.reset-btn {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 4px outset #eee;
  background: #bdbdbd;
  cursor: pointer;
}

.reset-btn:active {
  border-style: inset;
}

.ms-grid {
  display: grid;
  border: 4px inset #eee;
  background: #7b7b7b;
}

.cell {
  width: 30px;
  height: 30px;
  border: 3px outset #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  cursor: pointer;
  background: #bdbdbd;
}

.cell.revealed {
  border: 1px solid #7b7b7b;
  background: #bdbdbd;
}

.cell.mine {
  background: #f00;
}

.num-1 { color: blue; }
.num-2 { color: green; }
.num-3 { color: red; }
.num-4 { color: darkblue; }
.num-5 { color: darkred; }

.overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.msg {
  color: #fff;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 20px;
  text-shadow: 2px 2px #000;
}

.overlay button {
  padding: 10px 20px;
  font-size: 18px;
  cursor: pointer;
}
</style>
