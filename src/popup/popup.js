// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const eyedropperBtn = document.getElementById('eyedropper-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const colorPreview = document.getElementById('color-preview');
    const hexVal = document.getElementById('hex-value');
    const rgbVal = document.getElementById('rgb-value');
    const hslVal = document.getElementById('hsl-value');
    const historyContainer = document.getElementById('color-history');

    // State
    let currentColor = '#FFFFFF';

    // Initialize
    loadHistory();
    initSpectrum();

    // --- Native EyeDropper API ---
    eyedropperBtn.addEventListener('click', async () => {
        if (!window.EyeDropper) {
            alert('Your browser does not support the EyeDropper API');
            return;
        }

        const eyeDropper = new EyeDropper();
        // Close popup is NOT needed for EyeDropper API usually, but sometimes it helps perception.
        // Actually, EyeDropper API works even if popup is open, but popup might hide page content.
        // Chrome handles this by dismissing the popup usually unless we persist it.
        // Let's try calling it directly.

        try {
            const result = await eyeDropper.open();
            const color = result.sRGBHex;
            updateColor(color);
            addToHistory(color);
            copyToClipboard(color);
        } catch (e) {
            console.log('User canceled selection', e);
        }
    });

    // --- Page Analysis ---
    analyzeBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'analyzePage' }, (response) => {
                if (response && response.success) {
                    displayAnalysisResults(response.data);
                } else {
                    console.error('Analysis failed or no response');
                }
            });
        });
    });

    // --- Canvas Spectrum Picker ---
    function initSpectrum() {
        const canvas = document.getElementById('spectrum-canvas');
        const ctx = canvas.getContext('2d');
        const hueSlider = document.getElementById('hue-slider');

        let currentHue = 0;

        function drawSpectrum() {
            // Draw Saturation/Lightness Box
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Gradient 1: White to Color (Horizontal)
            const gradientH = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradientH.addColorStop(0, '#fff');
            gradientH.addColorStop(1, `hsl(${currentHue}, 100%, 50%)`);
            ctx.fillStyle = gradientH;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Gradient 2: Transparent to Black (Vertical)
            const gradientV = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradientV.addColorStop(0, 'rgba(0,0,0,0)');
            gradientV.addColorStop(1, '#000');
            ctx.fillStyle = gradientV;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        drawSpectrum();

        // Hue Slider Change
        hueSlider.addEventListener('input', (e) => {
            currentHue = e.target.value;
            drawSpectrum();
            // Update current color based on pointer fallback or center? 
            // For simplicity, we just update the visual spectrum. 
            // Ideally we track a selection cursor.
        });

        // Canvas Click
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Get pixel data
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const hex = ColorUtils.rgbToHex(pixel[0], pixel[1], pixel[2]);
            updateColor(hex);
            // Don't auto-add to history on spectrum click, only explicit picks? 
            // Or maybe yes, let's keep it simple.
            addToHistory(hex);
        });
    }

    // --- Core Functions ---
    function updateColor(input) {
        const formats = ColorUtils.getAllFormats(input);
        if (formats) {
            currentColor = formats.hex;
            colorPreview.style.backgroundColor = formats.hex;

            hexVal.textContent = formats.hex;
            rgbVal.textContent = formats.rgb;
            hslVal.textContent = formats.hsl;
        }
    }

    function addToHistory(hex) {
        chrome.storage.local.get(['colorHistory'], (result) => {
            let history = result.colorHistory || [];
            // Remove duplicate if exists to move to top
            history = history.filter(c => c !== hex);
            // Add to front
            history.unshift(hex);
            // Limit to 20
            if (history.length > 20) history.pop();

            chrome.storage.local.set({ colorHistory: history }, () => {
                renderHistory(history);
            });
        });
    }

    function loadHistory() {
        chrome.storage.local.get(['colorHistory'], (result) => {
            if (result.colorHistory) {
                renderHistory(result.colorHistory);
                // Select first one if exists
                if (result.colorHistory.length > 0) {
                    updateColor(result.colorHistory[0]);
                }
            }
        });
    }

    function renderHistory(history) {
        historyContainer.innerHTML = '';
        history.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.title = color;
            swatch.addEventListener('click', () => {
                updateColor(color);
                copyToClipboard(color);
            });
            historyContainer.appendChild(swatch);
        });
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            // Visual feedback could be added here
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }

    function displayAnalysisResults(colors) {
        const container = document.getElementById('analysis-results');
        const grid = document.getElementById('dominant-colors-grid');
        container.classList.remove('hidden');
        grid.innerHTML = '';

        colors.forEach(item => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = item.color;
            swatch.title = `${item.color} (${item.count} occurrences)`;
            swatch.addEventListener('click', () => {
                updateColor(item.color);
                copyToClipboard(item.color);
            });
            grid.appendChild(swatch);
        });
    }

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const text = document.getElementById(targetId).textContent;
            copyToClipboard(text);
        });
    });
});
