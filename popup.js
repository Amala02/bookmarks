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


// Function to create a bookmark button
function createBookmarkButton(bookmark) {
    const button = document.createElement('button');
    
    if (bookmark.children) {
        button.textContent = `📁 ${bookmark.title}`;
        button.addEventListener('click', () => displayBookmarks(bookmark.children));
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
    
    // Sort bookmarks: folders first, then regular bookmarks
    const folders = bookmarks.filter(b => b.children);
    const regularBookmarks = bookmarks.filter(b => !b.children);
    
    // Create folder row
    if (folders.length > 0) {
        const folderRow = document.createElement('div');
        folderRow.className = 'folder-row';
        container.appendChild(folderRow);
        
        folders.forEach(folder => {
            const button = createBookmarkButton(folder);
            button.className = 'folder-button';
            folderRow.appendChild(button);
        });
    }
    
    // Create bookmark tabs section
    if (regularBookmarks.length > 0) {
        const bookmarkTabs = document.createElement('div');
        bookmarkTabs.className = 'bookmark-tabs';
        container.appendChild(bookmarkTabs);
        
        regularBookmarks.forEach(bookmark => {
            const button = createBookmarkButton(bookmark);
            button.className = 'bookmark-button';
            bookmarkTabs.appendChild(button);
        });
    }
}

// Handle back button
document.getElementById('backButton').addEventListener('click', () => {
    if (navigationStack.length > 1) {
        navigationStack.pop(); // Remove current view
        const previousBookmarks = navigationStack[navigationStack.length - 1];
        displayBookmarks(previousBookmarks, true);
    }
});

// Initialize the extension by displaying the full bookmark tree
chrome.bookmarks.getTree((tree) => {
    // Start with root children (typically "Bookmarks Bar" and "Other Bookmarks")
    const rootBookmarks = tree[0].children;
    navigationStack.push(rootBookmarks);
    displayBookmarks(rootBookmarks);
});



// Add a bookmark for www.google.com
function addBookmark() {
  chrome.bookmarks.create(
    {
      parentId: '1',
      title: 'Google',
      url: 'https://www.google.com'  
    },
    () => {
      console.log('Bookmark added');
      location.reload(); // Refresh the popup
    }
  );
}

// Remove the bookmark for www.google.com
function removeBookmark() {
  chrome.bookmarks.search({ url: 'https://www.google.com/' }, (results) => {
    for (const result of results) {
      if (result.url === 'https://www.google.com/') {
        chrome.bookmarks.remove(result.id, () => {});
      }
    }
    location.reload();
  });
}

// Add click event listeners to the buttons
document.getElementById('addButton').addEventListener('click', addBookmark);
document
  .getElementById('removeButton')
  .addEventListener('click', removeBookmark);
