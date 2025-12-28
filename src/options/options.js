// Options Logic

const els = {
    autoCopy: document.getElementById('toggle-autocopy'),
    btnClear: document.getElementById('btn-clear')
};

// Load settings
chrome.storage.local.get(['autoCopy'], (result) => {
    els.autoCopy.checked = result.autoCopy !== false; // Default true
});

// Save settings
els.autoCopy.addEventListener('change', () => {
    chrome.storage.local.set({ autoCopy: els.autoCopy.checked });
});

// Clear History
els.btnClear.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your color history?')) {
        chrome.storage.local.set({ history: [] }, () => {
            alert('History cleared.');
        });
    }
});
