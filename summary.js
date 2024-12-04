document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = 'popup.html';
});

function displaySummary() {
    const summaryText = document.getElementById('summaryText');
    const folderTitle = document.getElementById('folderTitle');
    
    chrome.runtime.sendMessage({ type: 'getSummary' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting summary:', chrome.runtime.lastError);
            summaryText.textContent = 'Error retrieving summary. Please try again.';
            return;
        }
        
        // Display folder name
        folderTitle.textContent = `Summary of "${response.folderName}"`;
        
        // Display summary with proper formatting
        if (response.summary) {
            summaryText.textContent = response.summary;
        } else {
            summaryText.textContent = 'No summary available.';
        }
    });
}

displaySummary(); 