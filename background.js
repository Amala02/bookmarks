chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Store the latest summary
let currentSummary = '';
let selectedFolderName = '';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'openSummary') {
        // Store the summary and folder name
        currentSummary = message.summary;
        selectedFolderName = message.folderName;
        
        // Open the summary window and send response after window is created
        chrome.windows.create({
            url: 'summary.html',
            type: 'popup',
            width: 400,
            height: 600
        }, () => {
            sendResponse({ success: true });
        });
        
        return true;
    } else if (message.type === 'getSummary') {
        // Return both the summary and folder name
        sendResponse({ 
            summary: currentSummary,
            folderName: selectedFolderName 
        });
    }
    return true;
});