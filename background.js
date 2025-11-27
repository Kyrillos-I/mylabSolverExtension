chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendData") {
    // Forward the data to the popup
    chrome.runtime.sendMessage({ action: "updatePopup", data: request.data });
  }
});

// In background.js, modify the processQuestion handler to track active requests
let activeRequest = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processQuestion") {
    const question = message.question;
    const answerPart = message.answerPart;
    if (question == "" && answerPart == "") {
      sendResponse({
        answer:
          "Final Answer: Nothing was detected. Try highlighting text with your mouse then using the solve highlight button.",
      });
      return;
    }

    console.log("Received question:", question);
    console.log("Received answerPart:", answerPart);

    // Create an AbortController to cancel the fetch if needed
    const controller = new AbortController();
    const signal = controller.signal;

    // Store the controller so we can abort it later if needed
    activeRequest = controller;

    chrome.storage.local.get(["token"], async (result) => {
      const token = result.token;
      if (!token) {
        console.log("No token found, user might not be logged in");
      }
      chrome.storage.local.get(["deepThinkEnabled"], async (result) => {
        const deepThinkEnabled = result.deepThinkEnabled;
        if (deepThinkEnabled) {
          console.log("Deep Think is enabled");
        } else {
          console.log("Deep Think is disabled");
        }

        try {
          // Call the Express backend with the abort signal
          fetch("https://www.mylabsolver.com/process-question", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ question, answerPart, deepThinkEnabled }),
            signal: signal, // Add the abort signal
          })
            .then((response) => response.json())
            .then((data) => {
              activeRequest = null; // Clear the reference when done
              if (data.answer) {
                console.log("Received answer from backend:", data.answer);
                sendResponse({ answer: data.answer });
              } else {
                console.error("No answer received from backend:", data);
                sendResponse({
                  answer: "Final Answer: No answer received from backend",
                });
              }
            })
            .catch((error) => {
              activeRequest = null; // Clear the reference on error
              if (error.name === "AbortError") {
                console.log("Fetch aborted due to stop solving request");
                // Don't send response as the process was intentionally aborted
              } else {
                console.error("Error calling backend:", error);
                sendResponse({ error: "Error calling backend" });
              }
            });
        } catch (error) {
          console.error("Unexpected error:", error);
        }
      });
    });

    // Return true to indicate we're sending a response asynchronously
    return true;
  }
});

// Listen for the message from content script that a question is processed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updatePopup") {
    // Get solveAllSelected value before setting storage
    chrome.storage.local.get(["solveAllSelected"], (result) => {
      // Store the response data and update the processing state
      chrome.storage.local.set({
        processingQuestion: false,
        lastResponse: message.data,
        // If this is part of a solve all sequence, keep processingQuestion true
        processingQuestion: result.solveAllSelected ? true : false,
      });
    });

    // Forward the message to any open popups
    chrome.runtime.sendMessage(message);
  }
});

// Handle the solvingStopped message to abort any active request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.action === "solvingStopped" ||
    message.action === "pageUnloaded"
  ) {
    // Abort the active request if it exists
    if (activeRequest && typeof activeRequest.abort === "function") {
      console.log("Aborting active request");
      activeRequest.abort();
      activeRequest = null;
    }

    // Reset all solving states
    chrome.storage.local.set({
      processingQuestion: false,
      solveAllSelected: false,
    });

    // Notify any open popups with proper data
    chrome.runtime.sendMessage({
      action: "updatePopup",
      data: "Final Answer: Solving stopped by user.",
    });
  }
});
