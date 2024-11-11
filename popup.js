import { checkGroup } from "./groupChecker.js";
import { folderArray } from "./groupChecker.js";

let folderName = null; // Initially null

// Function to check or create the folder based on the determined `folderName`
function checkOrCreateFolder(nodes, callback) {
  let folderId = null;

  function traverseBookmarks(nodes) {
    for (const node of nodes) {
      if (!node.url && node.title === folderName) {
        folderId = node.id;
        return;
      }
      if (node.children) {
        traverseBookmarks(node.children);
      }
    }
  }

  traverseBookmarks(nodes);

  if (folderId === null) {
    chrome.bookmarks.create(
      {
        parentId: '1', // Default to bookmarks bar
        title: folderName
      },
      (newFolder) => callback(newFolder.id)
    );
  } else {
    callback(folderId);
  }
}

// Function to bookmark the current page in the determined folder
async function bookmarkCurrentPage() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true, lastFocusedWindow: true });
    
    if (!tabs || tabs.length === 0) {
      console.error('No active tab found');
      return;
    }

    const activeTab = tabs[0];
    console.log("URL:", activeTab.url, "Title:", activeTab.title);
    
    // Check for the appropriate folder based on title
    const category = await checkGroup(activeTab.title);
    folderName = folderArray.includes(category) ? category : "Uncategorized";

    chrome.bookmarks.getTree((tree) => {
      checkOrCreateFolder(tree[0].children, (folderId) => {
        chrome.bookmarks.create({
          parentId: folderId,
          title: activeTab.title,
          url: activeTab.url
        });
        console.log(`Page "${activeTab.title}" bookmarked in "${folderName}" folder.`);
      });
    });
  } catch (error) {
    console.error('Error bookmarking page:', error);
  }
}

// Add event listener to bookmark button
document.getElementById('bookmarkPageButton').addEventListener('click', async () => {
  await bookmarkCurrentPage();
});
