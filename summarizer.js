const options = {
    sharedContext: 'These are multiple web pages to be summarized together ',
    type: 'key-points',
    format: 'plain-text',
    length: 'long',
};

// Helper function to extract main content from HTML
function extractMainContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove unwanted elements
    ['script', 'style', 'nav', 'header', 'footer', 'iframe', 'noscript'].forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
    });
    
    // Try to find the main content area using common selectors
    const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.post-content',
        '.article-content',
        '#content',
        '.content'
    ];
    
    let mainContent = null;
    for (const selector of contentSelectors) {
        mainContent = doc.querySelector(selector);
        if (mainContent) break;
    }
    
    // If no specific content area found, use body
    const textContent = (mainContent || doc.body).textContent;
    
    // Clean up the text
    return textContent
        .replace(/\s+/g, ' ')    // Replace multiple spaces
        .replace(/\n+/g, '\n')   // Replace multiple newlines
        .trim();
}

export async function summarizeBookmarks(bookmarkUrls) {
    const available = (await self.ai.summarizer.capabilities()).available;
    if (available === 'no') {
        throw new Error('Summarizer API is not available');
    }

    // Main summarization logic
    const articleContents = await Promise.all(
        bookmarkUrls.map(async (url) => {
            try {
                const response = await fetch(url);
                const html = await response.text();
                const content = extractMainContent(html);
                return `Article from ${url}:\n${content}`;
            } catch (error) {
                console.error(`Error fetching ${url}:`, error);
                return `Failed to fetch content from ${url}`;
            }
        })
    );

    const combinedContent = articleContents.join('\n\n---\n\n');
    console.log("contents", combinedContent);

    let summarizer;
    if (available === 'readily') {
        summarizer = await self.ai.summarizer.create(options);
    } else {
        summarizer = await self.ai.summarizer.create(options);
        summarizer.addEventListener('downloadprogress', (e) => {
            console.log(`Loading model: ${Math.round((e.loaded / e.total) * 100)}%`);
        });
        await summarizer.ready;
    }

    
    //Generate summary
    const summary = await summarizer.summarize(combinedContent);
    return summary;
}