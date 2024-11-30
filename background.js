// Store your OpenAI API key securely
const OPENAI_API_KEY =
  "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";
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendData") {
    // Forward the data to the popup
    chrome.runtime.sendMessage({ action: "updatePopup", data: request.data });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processQuestion") {
    const question = message.question;
    const answerPart = message.answerPart;
    console.log("Received question:", question);
    console.log("Received question 2:", answerPart);
    // Call the OpenAI API
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content:
              question +
              " answer only this part of the question: format your answer so that at the end of it you write 'Final Answer: [answer]' obviously replacing the brackets with the actual final answer, also do not format the final answer in markdown, you can format all the other math in markdown but the final answer should be in normal text, something a human can type out (in the case of this part of the question having multiple parts as in 'part 1' or 'part 2' answer only the LAST part in your final answer, if it does not have multiple parts in this part, just answer this one)" +
              answerPart,
          },
        ],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.choices && data.choices.length > 0) {
          const answer = data.choices[0].message.content.trim();
          console.log("Received answer:", answer);
          sendResponse({ answer: answer });
        } else {
          console.error("No choices in response:", data);
          sendResponse({ error: "No answer received from OpenAI" });
        }
      })
      .catch((error) => {
        console.error("Error calling OpenAI API:", error);
        sendResponse({ error: "Error calling OpenAI API" });
      });

    // Return true to indicate asynchronous response
    return true;
  }
});
