export async function storageSet(key, value) {
    return new Promise((resolve, reject) => {
        if (!chrome || !chrome.storage || !chrome.storage.local) {
            reject(new Error('Chrome storage API not available'));
            return;
        }
        
        chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

export async function storageGet(key) {
    return new Promise((resolve, reject) => {
        if (!chrome || !chrome.storage || !chrome.storage.local) {
            reject(new Error('Chrome storage API not available'));
            return;
        }
        
        chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key]);
            }
        });
    });
} 