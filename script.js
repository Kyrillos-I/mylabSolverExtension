// contentScript.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "rerunContentScript") {
    // Place the logic you want to re-execute here
    console.log("Content script running in:", window.location.href);
    let questionText = "";
    let answerText = "";
    function waitForElement(selector) {
      return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else {
          const observer = new MutationObserver((mutations, me) => {
            const element = document.querySelector(selector);
            if (element) {
              me.disconnect();
              resolve(element);
            }
          });
          observer.observe(document, { childList: true, subtree: true });
        }
      });
    }

    // Wait for both elements
    (async () => {
      try {
        const questionElement = await waitForElement("#contentHoldertop");
        console.log("Question element found:", questionElement);
        questionText = questionElement.innerText.trim();
        console.log("This is the question text:", questionText);

        const answerElement = await waitForElement("#bottom");
        console.log("Answer element found:", answerElement);
        answerText = answerElement.innerText.trim();
        console.log("This is the answer part text:", answerText);

        // Send the question and answerPart to the background script
        chrome.runtime.sendMessage(
          {
            action: "processQuestion",
            question: questionText,
            answerPart: answerText,
          },
          (response) => {
            if (response && response.answer) {
              console.log("This is the answer:", response.answer);
              // contentScript.js
              chrome.runtime.sendMessage({
                action: "sendData",
                data: response.answer,
              });

              /*
          // If you need to insert the answer into an input field:
          waitForElement("input.answer-input").then((inputElement) => {
            inputElement.value = response.answer;
            console.log("Answer inserted into input field.");
          });
          */
            } else {
              console.error(
                "Failed to receive an answer from the background script."
              );
            }
          }
        );
      } catch (error) {
        console.error("Error while waiting for elements:", error);
      }
    })();
  }
});
