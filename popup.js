const folderName = "food";

// folder names --> store

const folderArray = [];


// Function to check if 'food' folder exists, and if not, create it
function checkOrCreateFolder(nodes, callback) {
  let folderId = null;

  // Helper function to traverse through nodes
  function traverseBookmarks(nodes) {
    for (const node of nodes) {
      // Check if the node is a folder and has the same name as folderName
      if (!node.url && node.title === folderName) {
        folderId = node.id;
        folderArray.push(node.title);

        return;
      }
      // Recursively traverse if the node has children (indicating it's a folder)
      if (node.children) {
        traverseBookmarks(node.children);
      }
    }
  }
  console.log(folderArray);

  // Traverse the tree to find the folder
  traverseBookmarks(nodes);

  // If folder doesn't exist, create it
  if (folderId === null) {
    chrome.bookmarks.create(
      {
        parentId: '1', // '1' is usually the bookmarks bar ID
        title: folderName
      },
      (newFolder) => {
        callback(newFolder.id);
      }
    );
  } else {
    callback(folderId);
  }

}


// Function to add the current page to the 'food' folder
function bookmarkCurrentPage() {
  // Get the current active tab URL and title
  chrome.tabs.query({ active: true, currentWindow: true, lastFocusedWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    console.log(activeTab.url); 
    chrome.bookmarks.getTree((tree) => {
      checkOrCreateFolder(tree[0].children, (folderId) => {
        // Add the current page to the 'food' folder
        chrome.bookmarks.create({
          parentId: folderId,
          title: activeTab.title,
          url: activeTab.url
        }, () => {
          console.log(`Page "${activeTab.title}" bookmarked in "${folderName}" folder.`);
          
        });
      });
    });
  });
}

// Add an event listener to the button in the popup
document.getElementById('bookmarkPageButton').addEventListener('click', bookmarkCurrentPage);


chrome.bookmarks.getTree((tree) => {
  const bookmarkList = document.getElementById('bookmarkList');
  displayFolders(tree[0].children, bookmarkList);
});

// Function to display only bookmark folders
function displayFolders(nodes, parentNode) {
  for (const node of nodes) {
    // Check if the node has children, indicating it is a folder
    if (node.children) {
      const listItem = document.createElement('li');
      listItem.textContent = node.title;
      parentNode.appendChild(listItem);

      // Optionally create a sublist for nested folders
      const sublist = document.createElement('ul');
      parentNode.appendChild(sublist);

      // Recursively display child folders
      displayFolders(node.children, sublist);
    }
  }
}

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
