import { hexToRgb, rgbToHex, generatePalettes, getContrastRatio } from '../utils/color-utils.js';

// DOM Elements
const els = {
    hexCode: document.getElementById('hex-code'),
    colorPreview: document.getElementById('color-preview'),
    btnPick: document.getElementById('btn-pick'),
    btnCopy: document.getElementById('btn-copy'),
    btnSettings: document.getElementById('btn-settings'),
    tabs: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    historyList: document.getElementById('history-list'),
    palettes: {
        mono: document.getElementById('palette-mono'),
        analog: document.getElementById('palette-analog'),
        comp: document.getElementById('palette-comp')
    },
    contrast: {
        bg: document.getElementById('contrast-bg'),
        fg: document.getElementById('contrast-fg'),
        ratio: document.getElementById('wcag-ratio'),
        grade: document.getElementById('wcag-grade')
    },
    nudge: document.getElementById('rate-us-nudge'),
    btnRate: document.getElementById('btn-rate'),
    btnShare: document.getElementById('btn-share')
};

// State
let state = {
    currentHex: '#FFFFFF',
    history: [],
    pickCount: 0,
    autoCopy: true
};

// Initialize
async function init() {
    await loadState();
    setupEventListeners();
    updateUI(state.currentHex);
    checkRateNudge();
}

async function loadState() {
    const result = await chrome.storage.local.get(['history', 'lastColor', 'pickCount', 'rated', 'autoCopy']);
    if (result.history) state.history = result.history;
    if (result.lastColor) state.currentHex = result.lastColor;
    if (result.pickCount) state.pickCount = result.pickCount;
    state.rated = result.rated || false;
    state.autoCopy = result.autoCopy !== false; // Default true
}

function setupEventListeners() {
    // EyeDropper
    els.btnPick.addEventListener('click', async () => {
        if (!window.EyeDropper) {
            alert('Your browser does not support the EyeDropper API.');
            return;
        }

        try {
            const eyeDropper = new EyeDropper();
            const result = await eyeDropper.open();
            processNewColor(result.sRGBHex);
        } catch (e) {
            console.log('User cancelled selection');
        }
    });

    // Copy
    els.btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(state.currentHex);
        triggerConfetti(els.btnCopy);
    });

    // Tabs
    els.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            els.tabs.forEach(t => t.classList.remove('active'));
            els.tabPanes.forEach(p => {
                p.classList.remove('active');
                p.style.display = 'none'; // Force hide for animation reset
            });

            tab.classList.add('active');
            const target = document.getElementById(`tab-${tab.dataset.tab}`);
            target.style.display = 'block';
            requestAnimationFrame(() => target.classList.add('active'));
        });
    });

    // Rate Us
    els.btnRate.addEventListener('click', () => {
        // Open Chrome Web Store URL (Placeholder)
        window.open('https://chrome.google.com/webstore', '_blank');
        els.nudge.classList.add('hidden');
        chrome.storage.local.set({ rated: true });
        triggerConfetti(els.btnRate);
    });

    // Share
    els.btnShare.addEventListener('click', () => {
        const text = `I just found this color ${state.currentHex} using Prisma!`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    });

    // Settings
    els.btnSettings.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('src/options/options.html'));
        }
    });
}

function processNewColor(hex) {
    state.currentHex = hex;
    updateUI(hex);
    addToHistory(hex);
    incrementPickCount();

    if (state.autoCopy) {
        navigator.clipboard.writeText(hex);
        triggerConfetti(els.btnPick); // Visual delight
    }
}

function updateUI(hex) {
    els.hexCode.textContent = hex;
    els.colorPreview.style.backgroundColor = hex;
    document.documentElement.style.setProperty('--primary', hex); // Dynamic theme

    // Update Palettes
    const palettes = generatePalettes(hex);
    renderPaletteRow(els.palettes.mono, palettes.mono);
    renderPaletteRow(els.palettes.analog, palettes.analog);
    renderPaletteRow(els.palettes.comp, palettes.comp);

    // Update Contrast
    els.contrast.bg.style.backgroundColor = hex;
    els.contrast.bg.textContent = hex;
    // Simple check for best text color
    const onWhite = getContrastRatio(hex, '#FFFFFF');
    const onBlack = getContrastRatio(hex, '#000000');
    const bestFg = onWhite > onBlack ? '#FFFFFF' : '#000000';

    els.contrast.fg.style.backgroundColor = bestFg;
    els.contrast.fg.style.color = hex; // Invert to be visible
    els.contrast.bg.style.color = bestFg;
    els.contrast.fg.textContent = bestFg;

    const ratio = Math.max(onWhite, onBlack).toFixed(2);
    els.contrast.ratio.textContent = `${ratio}:1`;
    els.contrast.grade.textContent = ratio >= 4.5 ? 'AA' : (ratio >= 7 ? 'AAA' : 'Fail');
    els.contrast.grade.className = `badge ${ratio >= 4.5 ? 'pass' : 'fail'}`;

    chrome.storage.local.set({ lastColor: hex });
}

function addToHistory(hex) {
    // Prevent duplicates at the top
    if (state.history[0] === hex) return;

    state.history.unshift(hex);
    if (state.history.length > 50) state.history.pop();

    chrome.storage.local.set({ history: state.history });
    renderHistory();
}

function renderHistory() {
    els.historyList.innerHTML = '';
    if (state.history.length === 0) {
        els.historyList.innerHTML = '<div class="empty-state">No colors picked yet.</div>';
        return;
    }

    state.history.forEach(hex => {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.style.backgroundColor = hex;
        item.title = hex;
        item.addEventListener('click', () => {
            state.currentHex = hex;
            updateUI(hex);
        });
        els.historyList.appendChild(item);
    });
}

function renderPaletteRow(container, colors) {
    container.innerHTML = '';
    if (!container || !colors) return;

    container.style.display = 'flex';
    container.style.gap = '8px';

    colors.forEach(color => {
        const div = document.createElement('div');
        div.style.backgroundColor = color;
        div.style.width = '30px';
        div.style.height = '30px';
        div.style.borderRadius = '50%';
        div.style.cursor = 'pointer';
        div.title = color;
        div.addEventListener('click', () => {
            navigator.clipboard.writeText(color);
            triggerConfetti(div);
        });
        container.appendChild(div);
    });
}

function incrementPickCount() {
    chrome.runtime.sendMessage({ action: 'incrementPickCount' }, (response) => {
        if (response) {
            state.pickCount = response.count;
            checkRateNudge();
        }
    });
}

function checkRateNudge() {
    // Logic: if count >= 20 and not rated yet
    if (state.pickCount >= 20 && !state.rated) {
        els.nudge.classList.remove('hidden');
    } else {
        els.nudge.classList.add('hidden');
    }
}

// Simple Confetti effect
function triggerConfetti(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = '6px';
        particle.style.height = '6px';
        const color = ['#f43f5e', '#22d3ee', '#f472b6', '#34d399'][Math.floor(Math.random() * 4)];
        particle.style.backgroundColor = color;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 4;
        const tx = Math.cos(angle) * 50 * Math.random();
        const ty = Math.sin(angle) * 50 * Math.random();

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0, .9, .57, 1)',
        }).onfinish = () => particle.remove();
    }
}

// Start
init();
