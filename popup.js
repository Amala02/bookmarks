import { checkGroup } from "./groupChecker.js";
import { folderArray } from "./groupChecker.js";
import { summarizeBookmarks } from "./summarizer.js";

let folderName = null; // Initially null
let selectedFolder = null; // Add this line to track selected folder

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
document.getElementById('addButton').addEventListener('click', async () => {
  await bookmarkCurrentPage();
});


// Function to create a bookmark button
function createBookmarkButton(bookmark) {
    const button = document.createElement('button');
    
    if (bookmark.children) {
        button.textContent = `📁 ${bookmark.title}`;
        button.addEventListener('click', () => {
            // Remove selected class from all buttons
            document.querySelectorAll('.folder-button').forEach(btn => {
                btn.classList.remove('selected');
            });
            // Add selected class to clicked button
            button.classList.add('selected');
            selectedFolder = bookmark.title;
            displayBookmarks(bookmark.children);
        });
    } else {
        button.textContent = bookmark.title;
        // Add wrap-text class if text is too long
        if (bookmark.title.length > 40) {
            button.classList.add('wrap-text');
        }
        button.addEventListener('click', () => chrome.tabs.create({ url: bookmark.url }));
    }
    
    return button;
}

// Keep track of navigation history
const navigationStack = [];

// Function to display bookmarks in container
function displayBookmarks(bookmarks, isBack = false) {
    const container = document.getElementById('bookmarkContainer');
    const backButton = document.getElementById('backButton');
    
    // Clear existing bookmarks
    while (container.children.length > 1) {
        container.removeChild(container.lastChild);
    }
    
    // Handle navigation stack
    if (!isBack && bookmarks !== navigationStack[navigationStack.length - 1]) {
        navigationStack.push(bookmarks);
    }
    
    // Show/hide back button
    backButton.style.display = navigationStack.length > 1 ? 'block' : 'none';
    
    // Create folder row
    const folderRow = document.createElement('div');
    folderRow.className = 'folder-row';
    container.appendChild(folderRow);
    
    bookmarks.forEach(folder => {
        const button = createBookmarkButton(folder);
        button.className = 'folder-button';
        folderRow.appendChild(button);
    });
}

// Handle back button
document.getElementById('backButton').addEventListener('click', () => {
    if (navigationStack.length > 1) {
        navigationStack.pop(); // Remove current view
        const previousBookmarks = navigationStack[navigationStack.length - 1];
        displayBookmarks(previousBookmarks, true);
    }
});

// Initialize the extension by displaying only the bookmarks bar folders
chrome.bookmarks.getTree((tree) => {
    // Get the Bookmarks Bar (typically the first child at index 0)
    const bookmarksBar = tree[0].children[0];
    // Only get folders from the bookmarks bar
    const bookmarksBarFolders = bookmarksBar.children.filter(node => !node.url);
    navigationStack.push(bookmarksBarFolders);
    displayBookmarks(bookmarksBarFolders);
});




async function clickedSUmmarizer(folderName1) {
    try {
        const tree = await chrome.bookmarks.getTree();
        const urls = [];
        
        const bookmarksBar = tree[0].children[0];
        console.log('Searching for folder:', folderName1);
        
        function findFolder(nodes) {
            for (const node of nodes) {
                if (!node.url && node.title === folderName1) {
                    function collectUrls(folderNode) {
                        if (!folderNode.children) return;
                        for (const child of folderNode.children) {
                            if (child.url) {
                                urls.push(child.url);
                            }
                            if (child.children) {
                                collectUrls(child);
                            }
                        }
                    }
                    collectUrls(node);
                    return true;
                }
                if (node.children) {
                    if (findFolder(node.children)) return true;
                }
            }
            return false;
        }

        findFolder(bookmarksBar.children);
        console.log('Final URLs collected:', urls);
        
        if (urls.length === 0) {
            throw new Error('No URLs found in the selected folder');
        }

        console.log('Summarizing...');
        const summary = await summarizeBookmarks(urls);
        console.log('Summary:', summary);
        
        // Send message with both summary and folder name
        await new Promise((resolve) => {
            chrome.runtime.sendMessage({ 
                type: 'openSummary',
                summary: summary,
                folderName: folderName1
            }, () => {
                setTimeout(() => {
                    window.close();
                    resolve();
                }, 100);
            });
        });

        return urls;
    } catch (error) {
        console.error('Error in clickedSUmmarizer:', error);
        throw error;
    }
}

document.getElementById('summarizeButton').addEventListener('click', async () => {
  await clickedSUmmarizer(selectedFolder);
});