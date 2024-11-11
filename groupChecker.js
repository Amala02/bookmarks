export const folderArray = [
  "Artificial Intelligence", "Biological Sciences", "Data Science and Analytics",
  "Computer Science", "Medical and Health Sciences", "Physical Sciences",
  "Environmental Science", "Social Sciences", "Humanities and Arts"
];

export async function checkGroup(title) {
  const msg = title;
  const { available } = await ai.languageModel.capabilities();

  if (available !== "no") {
    const session = await ai.languageModel.create();
    
    // Update the prompt to restrict the AI to the specific categories in folderArray
    const promptMessage = `${msg}. Categorize this title into one of the following categories: ${folderArray.join(", ")}. Respond with only one of these exact categories.`;

    const result = await session.prompt(promptMessage);

    // Ensure the result is valid
    if (folderArray.includes(result.trim())) {
      console.log("group:", result);
      return result.trim();  // Return the matched category
    } else {
      console.warn(`Invalid category returned: ${result}`);
      return "Uncategorized"; // Fallback if no valid category
    }
  }
  
  return null;  // In case the AI capability is unavailable
}
