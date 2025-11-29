export class SoundManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.initCtx();
    }

    initCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playTone(freq, type, duration, startTime = 0) {
        if (!this.enabled) return;
        this.initCtx();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playNoise(duration) {
        if (!this.enabled) return;
        this.initCtx();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter for "swish" effect
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playCardFlip() {
        this.playNoise(0.15);
    }

    playShow() {
        // A little chord
        this.playTone(440, 'sine', 0.3, 0);
        this.playTone(554, 'sine', 0.3, 0.1);
        this.playTone(659, 'sine', 0.5, 0.2);
    }

    playWin() {
        this.playTone(523.25, 'triangle', 0.2, 0);
        this.playTone(659.25, 'triangle', 0.2, 0.15);
        this.playTone(783.99, 'triangle', 0.4, 0.3);
        this.playTone(1046.50, 'triangle', 0.6, 0.45);
    }

    playLose() {
        this.playTone(300, 'sawtooth', 0.3, 0);
        this.playTone(250, 'sawtooth', 0.3, 0.2);
        this.playTone(200, 'sawtooth', 0.5, 0.4);
    }
}
