// Core Calculator Logic with API Integration
//
// Two input styles share one display:
//   - basic mode:      operand  operator  operand  (=)   -> sent to /calculator/calculate
//   - scientific mode: a free-form expression string     -> sent to /scientific/calculate
class Calculator {
    constructor() {
        this.inputDisplay = document.getElementById('input-display');
        this.resultDisplay = document.getElementById('result-display');
        this.mode = 'basic';
        this.isDegreeMode = true;
        this.busy = false;
        this.clear();
    }

    get isScientific() {
        return this.mode === 'scientific';
    }

    setMode(mode) {
        this.mode = mode;
        this.clear();
    }

    clear() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.shouldResetScreen = false;
        this.updateDisplay();
    }

    backspace() {
        if (this.shouldResetScreen || this.currentInput === 'Error' || this.currentInput.length <= 1) {
            this.currentInput = '0';
            this.shouldResetScreen = false;
        } else {
            this.currentInput = this.currentInput.slice(0, -1);
        }
        this.updateDisplay();
    }

    // Start a fresh entry if the screen shows a finished result / error / bare 0
    startFreshIfNeeded() {
        if (this.currentInput === 'Error' || this.currentInput === '0' || this.shouldResetScreen) {
            this.currentInput = '';
            this.shouldResetScreen = false;
        }
    }

    appendNumber(number) {
        this.startFreshIfNeeded();
        this.currentInput += number;
        this.updateDisplay();
    }

    appendDecimal() {
        if (this.isScientific) {
            this.startFreshIfNeeded();
            // only one '.' in the number currently being typed
            const lastNumber = this.currentInput.split(/[^0-9.]/).pop();
            if (!lastNumber.includes('.')) {
                this.currentInput += lastNumber === '' ? '0.' : '.';
            }
        } else {
            if (this.currentInput === 'Error' || this.shouldResetScreen) {
                this.currentInput = '0';
                this.shouldResetScreen = false;
            }
            if (!this.currentInput.includes('.')) {
                this.currentInput += '.';
            }
        }
        this.updateDisplay();
    }

    // Scientific mode: append any token (functions, brackets, constants) to the expression
    appendToken(token) {
        if (this.currentInput === 'Error') this.currentInput = '0';
        if (this.currentInput === '0' || this.shouldResetScreen) {
            // after a result, a function/bracket/constant starts a new expression
            this.currentInput = '';
            this.shouldResetScreen = false;
        }
        this.currentInput += token;
        this.updateDisplay();
    }

    async setOperator(operator) {
        if (this.busy) return;

        if (this.isScientific) {
            if (this.currentInput === 'Error') this.currentInput = '0';
            // continue from a previous result, e.g. "3" then "+"
            this.shouldResetScreen = false;
            const last = this.currentInput.slice(-1);
            if ('+-*/^%'.includes(last) && this.currentInput.length > 0 && operator !== '-') {
                // replace a dangling operator instead of stacking "1+*"
                this.currentInput = this.currentInput.slice(0, -1);
            } else if (this.currentInput === '0' && operator === '-') {
                this.currentInput = '';
            }
            this.currentInput += operator;
            this.updateDisplay();
            return;
        }

        if (this.currentInput === 'Error') return;

        // Pressing a second operator before typing a number just swaps it
        if (this.operator !== null && this.shouldResetScreen) {
            this.operator = operator;
            this.updateDisplay();
            return;
        }

        // Chain: 1 + 2 + ...  -> wait for "1 + 2" to finish before continuing
        if (this.operator !== null) {
            const ok = await this.calculate();
            if (!ok) return;
        }

        this.previousInput = this.currentInput;
        this.operator = operator;
        this.shouldResetScreen = true;
        this.updateDisplay();
    }

    async calculate() {
        if (this.busy) return false;

        let request;
        if (this.isScientific) {
            if (this.shouldResetScreen || this.currentInput === 'Error') return false;
            const expression = this.currentInput;
            request = () => calculateScientific(expression, this.isDegreeMode);
        } else {
            if (this.operator === null) return false;
            const expression = `${this.previousInput} ${this.operator} ${this.currentInput}`;
            request = () => calculateBasic(expression);
        }

        this.busy = true;
        try {
            const result = await request();
            this.currentInput = formatNumber(result.result);
            this.operator = null;
            this.previousInput = '';
            this.shouldResetScreen = true;
            this.updateDisplay();
            loadHistory(); // Reload history from backend
            return true;
        } catch (error) {
            console.error('Calculation error:', error);
            this.currentInput = 'Error';
            this.operator = null;
            this.previousInput = '';
            this.shouldResetScreen = true;
            this.updateDisplay();
            this.resultDisplay.textContent = error.message;
            return false;
        } finally {
            this.busy = false;
        }
    }

    updateDisplay() {
        this.inputDisplay.textContent = this.currentInput;
        if (!this.isScientific && this.operator !== null) {
            this.resultDisplay.textContent = `${this.previousInput} ${this.operator}`;
        } else {
            this.resultDisplay.textContent = '';
        }
    }
}

// 3.0 -> "3", 0.30000000000000004 -> "0.3"
function formatNumber(value) {
    return String(parseFloat(Number(value).toPrecision(12)));
}

// Initialize calculator
const calculator = new Calculator();

// Event listeners for number buttons (the "." button is handled separately)
document.querySelectorAll('.btn-number').forEach(button => {
    button.addEventListener('click', () => {
        const value = button.dataset.value;
        if (value === '.') {
            calculator.appendDecimal();
        } else {
            calculator.appendNumber(value);
        }
    });
});

document.querySelectorAll('.btn-operator').forEach(button => {
    button.addEventListener('click', () => {
        calculator.setOperator(button.dataset.value);
    });
});

document.querySelectorAll('.btn-clear').forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'clear') {
            calculator.clear();
        } else if (action === 'backspace') {
            calculator.backspace();
        }
    });
});

document.querySelectorAll('.btn-equals').forEach(button => {
    button.addEventListener('click', () => {
        calculator.calculate();
    });
});

// Mode switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const mode = button.dataset.mode;

        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Show corresponding calculator mode
        document.querySelectorAll('.calculator-mode').forEach(calc => calc.classList.remove('active'));
        document.getElementById(`${mode}-mode`).classList.add('active');

        // Switch input style and reset display
        calculator.setMode(mode);
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    // Don't hijack typing inside form fields (e.g. the financial calculator inputs)
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (calculator.mode === 'financial') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key >= '0' && e.key <= '9') {
        calculator.appendNumber(e.key);
    } else if (e.key === '.') {
        calculator.appendDecimal();
    } else if (['+', '-', '*', '/', '%'].includes(e.key)) {
        e.preventDefault();
        calculator.setOperator(e.key);
    } else if (calculator.isScientific && ['(', ')'].includes(e.key)) {
        calculator.appendToken(e.key);
    } else if (calculator.isScientific && e.key === '^') {
        calculator.setOperator('^');
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculator.calculate();
    } else if (e.key === 'Backspace') {
        calculator.backspace();
    } else if (e.key === 'Escape') {
        calculator.clear();
    }
});
