const options = {
    sharedContext: 'These are multiple web pages to be summarized together',
    type: 'key-points',
    format: 'markdown',
    length: 'medium',
};

export async function summarizeBookmarks(bookmarkUrls) {
    const available = (await self.ai.summarizer.capabilities()).available;
    if (available === 'no') {
        throw new Error('Summarizer API is not available');
    }

    //Fetch URLs
    const contents = await Promise.all(
        bookmarkUrls.map(async (url) => {
            const response = await fetch(url);
            const text = await response.text();
            return text;
        })
    );

    //Combine contents
    const combinedContent = contents.join('\n\n');

    let summarizer;
    if (available === 'readily') {
        summarizer = await self.ai.summarizer.create(options);
    } else {
        summarizer = await self.ai.summarizer.create(options);
        summarizer.addEventListener('downloadprogress', (e) => {
            console.log(e.loaded, e.total);
        });
        await summarizer.ready;
    }

    //Generate summary
    const summary = await summarizer.summarize(combinedContent);
    return summary;
}