

/* const canSummarize = await ai.summarizer.capabilities();
let summarizer;

if (canSummarize && canSummarize.available !== 'no') {
  if (canSummarize.available === 'readily') {
    // The summarizer can immediately be used.
    summarizer = await ai.summarizer.create();
  } else {
    // The summarizer can be used after the model download.
    summarizer = await ai.summarizer.create();
    summarizer.addEventListener('downloadprogress', (e) => {
      console.log(e.loaded, e.total);
    });
    await summarizer.ready;
  }
} else {
    // The summarizer can't be used at all.
}*/

export async function checkGroup(){

  const msg = "Special Session: Embedded Software for Robotics: Challenges and Future Directions | IEEE Conference Publication | IEEE Xplore";

  const {available, defaultTemperature, defaultTopK, maxTopK } = await ai.languageModel.capabilities();

  if (available !== "no") {
    const session = await ai.languageModel.create();

    // Prompt the model and wait for the whole result to come back.  
    const result = await session.prompt(msg+"what one word category does this come under");
    console.log(result);
    //return result;
  }

}



