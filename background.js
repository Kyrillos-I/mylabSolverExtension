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
    if (question == "" && answerPart == "") {
      sendResponse({
        answer:
          "Final Answer: Nothing was detected. Try highlighting before using the highlight button.",
      });
      return;
    }

    console.log("Received question:", question);
    console.log("Received answerPart:", answerPart);

    chrome.storage.local.get(["token"], async (result) => {
      const token = result.token;
      if (!token) {
        console.log("No token found, user might not be logged in");
      }

      try {
        // Call the Express backend
        fetch(
          "https://gptbackend-production-7f4a.up.railway.app/process-question",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ question, answerPart }),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            if (data.answer) {
              console.log("Received answer from backend:", data.answer);
              sendResponse({ answer: data.answer });
            } else {
              console.error("No answer received from backend:", data);
              sendResponse({ error: "No answer received from backend" });
            }
          })
          .catch((error) => {
            console.error("Error calling backend:", error);
            sendResponse({ error: "Error calling backend" });
          });
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    });

    // Return true to indicate we're sending a response asynchronously
    return true;
  }
});
