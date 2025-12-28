/**
 * SiteDelta Demo - Simulation State Machine
 */

const DemoState = {
    IDLE: 'idle',
    RUNNING: 'running',
    COMPLETE: 'complete'
};

class SiteDeltaDemo {
    constructor() {
        this.state = DemoState.IDLE;
        this.originalPrice = 449;
        this.newPrice = 399;

        // DOM Elements
        this.consoleEl = document.getElementById('console-output');
        this.priceEl = document.getElementById('price-value');
        this.priceContainerEl = document.getElementById('demo-price');
        this.statusEl = document.getElementById('patrol-status');
        this.resultEl = document.getElementById('patrol-result');
        this.startBtn = document.getElementById('start-demo-btn');
        this.resetBtn = document.getElementById('reset-demo-btn');

        this.bindEvents();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.run());
        this.resetBtn.addEventListener('click', () => this.reset());
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Add line to console
     */
    log(message, type = 'info') {
        const placeholder = this.consoleEl.querySelector('.console-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const line = document.createElement('div');
        line.className = `console-line console-${type}`;
        line.textContent = message;
        this.consoleEl.appendChild(line);
        this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
    }

    /**
     * Type text character by character
     */
    async typeLog(message, type = 'info', charDelay = 15) {
        const placeholder = this.consoleEl.querySelector('.console-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const line = document.createElement('div');
        line.className = `console-line console-${type}`;
        this.consoleEl.appendChild(line);

        for (const char of message) {
            line.textContent += char;
            this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
            await this.sleep(charDelay);
        }
    }

    /**
     * Update status badge
     */
    setStatus(status) {
        this.statusEl.textContent = status;
        this.statusEl.className = 'patrol-status';

        if (status === 'Running') {
            this.statusEl.classList.add('status-running');
        } else if (status === 'Complete') {
            this.statusEl.classList.add('status-complete');
        }
    }

    /**
     * Highlight price element
     */
    highlightElement() {
        this.priceContainerEl.classList.add('selector-highlight');
        setTimeout(() => {
            this.priceContainerEl.classList.remove('selector-highlight');
        }, 1000);
    }

    /**
     * Animate price change
     */
    async animatePriceChange() {
        // Flash effect
        this.priceContainerEl.classList.add('price-changing');
        await this.sleep(400);

        // Count down animation
        let current = this.originalPrice;
        const step = Math.ceil((this.originalPrice - this.newPrice) / 8);

        while (current > this.newPrice) {
            current = Math.max(current - step, this.newPrice);
            this.priceEl.textContent = current;
            await this.sleep(50);
        }

        this.priceContainerEl.classList.remove('price-changing');
        this.priceContainerEl.classList.add('price-changed');
    }

    /**
     * Show result card
     */
    showResult() {
        document.getElementById('result-previous').textContent = '$' + this.originalPrice;
        document.getElementById('result-current').textContent = '$' + this.newPrice;
        this.resultEl.classList.remove('hidden');
        this.resultEl.classList.add('result-appear');
    }

    /**
     * Main demo sequence
     */
    async run() {
        if (this.state !== DemoState.IDLE) return;

        this.state = DemoState.RUNNING;
        this.startBtn.disabled = true;
        this.startBtn.classList.remove('pulse-animation');

        // Clear console
        this.consoleEl.innerHTML = '';

        // Start
        this.setStatus('Running');

        // Step 1: Load config
        await this.typeLog('Loading config from config.yaml...');
        await this.sleep(400);

        // Step 2: First check (no change)
        await this.typeLog('[switch-price] Nintendo Switch 2');
        await this.sleep(200);

        await this.typeLog('  Fetching https://shop.example.com... (static)');
        await this.sleep(600);

        // Highlight the price element
        this.highlightElement();
        await this.sleep(800);

        await this.typeLog('  [-] unchanged', 'dim');
        await this.typeLog('  Matched: 449', 'success');
        await this.sleep(800);

        // Step 3: Time passes
        await this.typeLog('');
        await this.typeLog('--- 6 hours later... ---', 'dim');
        await this.sleep(1200);

        // Step 4: Price changes
        await this.typeLog('');
        await this.animatePriceChange();
        await this.sleep(400);

        // Step 5: SiteDelta detects change
        await this.typeLog('[switch-price] Nintendo Switch 2');
        await this.sleep(200);

        await this.typeLog('  Fetching https://shop.example.com... (static)');
        await this.sleep(500);

        // Highlight again
        this.highlightElement();
        await this.sleep(700);

        await this.typeLog('  [!] changed', 'warning');
        await this.typeLog('  Matched: 399', 'success');
        await this.sleep(400);

        // Step 6: Summary
        await this.typeLog('');
        await this.typeLog('--- Summary ---');
        await this.typeLog('Total: 1');
        await this.typeLog('Changed: 1', 'warning');

        // Step 7: Show result
        this.state = DemoState.COMPLETE;
        this.setStatus('Complete');
        this.showResult();

        await this.sleep(400);
        await this.typeLog('');
        await this.typeLog('Notification sent!', 'success');

        // Show reset button
        this.resetBtn.classList.remove('hidden');
    }

    /**
     * Reset demo to initial state
     */
    reset() {
        this.state = DemoState.IDLE;

        // Reset price
        this.priceEl.textContent = this.originalPrice;
        this.priceContainerEl.classList.remove('price-changed', 'price-changing', 'selector-highlight');

        // Reset console
        this.consoleEl.innerHTML = '<div class="console-placeholder">Click "Start Demo" to begin...</div>';

        // Reset result
        this.resultEl.classList.add('hidden');
        this.resultEl.classList.remove('result-appear');

        // Reset status
        this.setStatus('Idle');

        // Reset buttons
        this.startBtn.disabled = false;
        this.resetBtn.classList.add('hidden');
    }
}

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.siteDeltaDemo = new SiteDeltaDemo();
});
