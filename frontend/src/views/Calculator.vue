<script setup lang="ts">
/**
 * Calculator.vue
 * 四則演算が可能なモダンな電卓アプリ。
 */
import { ref } from 'vue';

const display = ref("0");
const equation = ref("");
const isNewNumber = ref(true);

const buttons = [
  ['C', 'DEL', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '=']
];

const input = (val: string) => {
  if (val === 'C') {
    display.value = "0";
    equation.value = "";
    isNewNumber.value = true;
  } else if (val === 'DEL') {
    display.value = display.value.length > 1 ? display.value.slice(0, -1) : "0";
  } else if (val === '=') {
    try {
      const result = eval(equation.value + display.value);
      display.value = result.toString();
      equation.value = "";
      isNewNumber.value = true;
    } catch {
      display.value = "Error";
    }
  } else if (['+', '-', '*', '/', '%'].includes(val)) {
    equation.value += display.value + " " + val + " ";
    isNewNumber.value = true;
  } else {
    if (isNewNumber.value) {
      display.value = val;
      isNewNumber.value = false;
    } else {
      display.value += val;
    }
  }
};
</script>

<template>
  <div class="calculator">
    <div class="calc-display">
      <div class="equation">{{ equation }}</div>
      <div class="main-val">{{ display }}</div>
    </div>
    <div class="calc-grid">
      <template v-for="row in buttons">
        <button 
          v-for="btn in row" 
          :key="btn"
          :class="['calc-btn', { operator: ['/', '*', '-', '+', '=', 'C', 'DEL', '%'].includes(btn), double: btn === '0', primary: btn === '=' }]"
          @click="input(btn)"
        >
          {{ btn }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.calculator {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(20, 20, 20, 0.8);
  backdrop-filter: blur(20px);
  padding: 20px;
  gap: 15px;
}

.calc-display {
  height: 80px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 10px 15px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.equation { color: #888; font-size: 14px; min-height: 1.2em; }
.main-val { color: #fff; font-size: 32px; font-weight: 300; }

.calc-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.calc-btn {
  height: 100%;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: 0.2s;
}

.calc-btn:hover { background: rgba(255, 255, 255, 0.1); }
.calc-btn.operator { background: rgba(255, 255, 255, 0.08); color: #3b82f6; }
.calc-btn.primary { background: #3b82f6; color: #fff; }
.calc-btn.primary:hover { background: #60a5fa; }

.calc-btn.double {
  grid-column: span 2;
}
</style>
