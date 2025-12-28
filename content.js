/*
  Content Script
  Handles interaction with the page DOM, such as extracting colors.
*/

console.log('Advanced Color Picker: Content script loaded.');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzePage') {
        const findings = analyzePageColors();
        sendResponse({ success: true, data: findings });
    }
    return true; // Keep message channel open for async response
});

/**
 * Analyzes the current page to find dominant colors.
 * This is a basic implementation scanning computed styles of significant elements.
 */
function analyzePageColors() {
    const colorCounts = {};
    const elements = document.querySelectorAll('*');

    elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;

        // Helper to process color strings
        const processColor = (c) => {
            if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' && c !== 'rgb(255, 255, 255)') { // Filter transparent/white/black if desired, strictly transparent is mostly noise
                // Simple frequency count
                colorCounts[c] = (colorCounts[c] || 0) + 1;
            }
        };

        processColor(bg);
        processColor(color);
    });

    // Sort by frequency
    const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10
        .map(([color, count]) => ({ color, count }));

    return sortedColors;
}
