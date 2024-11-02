async function getActiveTabContent() {
    try {
      // Get the current active tab
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
  
      // Execute script to get page content
      const result = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: () => {
          return document.documentElement.outerHTML;
        }
      });
  
      // Return the content from the first result
      return result[0].result;
    } catch (error) {
      console.error('Error getting tab content:', error);
      return null;
    }
  }

const content = await getActiveTabContent();
if (content) {
  console.log('Tab content:', content);
}