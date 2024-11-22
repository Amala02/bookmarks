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


// Function to display folders first, followed by normal URLs
function displayFolders(nodes, parentNode) {
  const folders = []; // Array to hold folder nodes
  const urls = []; // Array to hold URL nodes

  // Separate folders and URLs
  for (const node of nodes) {
    if (node.children) {
      folders.push(node);
    } else if (node.url) {
      urls.push(node);
    }
  }

  // Display folders first
  for (const folder of folders) {
    const listItem = document.createElement('li');
    listItem.textContent = folder.title;
    listItem.style.cursor = 'pointer'; // Make folder clickable
    parentNode.appendChild(listItem);

    // Sublist for child folders/bookmarks
    const sublist = document.createElement('ul');
    sublist.style.display = 'none'; // Initially hidden
    parentNode.appendChild(sublist);

    // Toggle sublist visibility on click
    listItem.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent bubbling
      sublist.style.display = sublist.style.display === 'none' ? 'block' : 'none';
    });

    // Recursively display child folders/bookmarks
    displayFolders(folder.children, sublist);
  }

  // Display normal URLs after folders
  for (const urlNode of urls) {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = urlNode.url;
    link.textContent = urlNode.title;
    link.target = '_blank'; // Open in a new tab
    listItem.appendChild(link);
    parentNode.appendChild(listItem);
  }
}


// Initialize the extension by displaying the full bookmark tree
chrome.bookmarks.getTree((tree) => {
  const bookmarkList = document.getElementById('bookmarkList'); // Target container in your popup
  displayFolders(tree[0].children, bookmarkList); // Traverse all root folders
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
