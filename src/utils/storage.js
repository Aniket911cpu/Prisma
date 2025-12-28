/**
 * Prisma Storage Wrapper
 * Validated async wrapper for chrome.storage.sync
 */

const SETTINGS_KEY = 'prisma_settings';
const HISTORY_KEY = 'prisma_history';

const DEFAULT_SETTINGS = {
    autoCopy: true,
    copyFormat: 'hex', // hex, rgb, hsl, tailwind
    theme: 'system', // system, light, dark
    showNotifications: true
};

export class StorageManager {

    static async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get([SETTINGS_KEY], (result) => {
                resolve({ ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] });
            });
        });
    }

    static async saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ [SETTINGS_KEY]: settings }, resolve);
        });
    }

    static async getHistory() {
        return new Promise((resolve) => {
            chrome.storage.local.get([HISTORY_KEY], (result) => {
                resolve(result[HISTORY_KEY] || []);
            });
        });
    }

    static async addToHistory(hex) {
        const history = await this.getHistory();
        const newItem = {
            id: Date.now(),
            color: hex,
            timestamp: new Date().toISOString(),
            pinned: false
        };

        // Remove duplicate hex if exists (optional logic, maybe keep duplicates if timestamp matters? Let's de-dupe for now to keep list clean)
        const filtered = history.filter(h => h.color !== hex);

        filtered.unshift(newItem);
        // Limit to 50
        if (filtered.length > 50) filtered.pop();

        return new Promise((resolve) => {
            chrome.storage.local.set({ [HISTORY_KEY]: filtered }, resolve);
        });
    }

    static async togglePin(id) {
        const history = await this.getHistory();
        const index = history.findIndex(h => h.id === id);
        if (index > -1) {
            history[index].pinned = !history[index].pinned;
            await new Promise(r => chrome.storage.local.set({ [HISTORY_KEY]: history }, r));
        }
    }

    static async clearHistory() {
        return new Promise(r => chrome.storage.local.set({ [HISTORY_KEY]: [] }, r));
    }
}
