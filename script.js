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
        //below is not an await as it may never be found
        const removeElement = document.querySelector("span.tempAnswer");
        if (removeElement) {
          removeElement.remove();
        }

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

              const displayAnswer = document.createElement("span");
              displayAnswer.style.color = "#007dff";
              displayAnswer.style.fontSize = "20px";
              let mc = response.answer.includes("MC: ");
              const keyword = "Final Answer: ";
              const answer = response.answer.substring(
                response.answer.indexOf(keyword) + keyword.length
              );
              displayAnswer.innerText = "Answer: " + answer;
              console.log(mc);
              displayAnswer.classList.add("tempAnswer");
              answerElement.insertBefore(
                displayAnswer,
                answerElement.firstChild
              );
              fillAnswerAndSubmit(answer, mc);

              function fillAnswerAndSubmit(answer, mc) {
                var inputFields = document.querySelectorAll("input.focusNode");
                var spanHolder = document.querySelectorAll("span.txtNum");
                // Check if any matching elements were found
                if (inputFields) {
                  if (inputFields.length > 0) {
                    // Select the last input field
                    var inputField = inputFields[inputFields.length - 1];
                    inputField.value = "";
                    spanHolder.innerHTML = "";
                    inputField.value = answer;
                    // Step 3: Dispatch input event
                    var event = new Event("input", { bubbles: true });
                    inputField.dispatchEvent(event);
                  } else {
                    console.error("Input field not found.");
                  }
                }

                if (mc) {
                  console.log("If(mc) statement ran succesfully");
                  let arr = answer.split(" ");
                  console.log(arr);
                  let allRadioButtons = document.querySelectorAll(
                    "input.dijitCheckBoxInput"
                  );
                  for (let i = 0; i < allRadioButtons.length; i++) {
                    if (allRadioButtons[i].checked) {
                      allRadioButtons[i].click();
                    }
                  }
                  for (let i = 0; i < arr.length; i++) {
                    const elements = Array.from(
                      document.querySelectorAll("label")
                    ); // Select all label elements
                    const targetElement = elements.find((el) =>
                      el.textContent.trim().startsWith(arr[i] + ".")
                    );
                    console.log(targetElement);
                    console.log(targetElement.htmlFor);
                    let id = "" + targetElement.htmlFor;
                    console.log(id);
                    let select = document.getElementById(id);
                    console.log(select);
                    if (!select.checked) {
                      select.click();
                    }
                    console.log(select);
                  }
                }

                // Step 4: Select the "Check Answer" button
                // var checkButton = document.querySelector("button.btn-primary");

                // Ensure the button exists
                if (checkButton) {
                  // Step 5: Click the button
                  checkButton.disabled = "false";
                  checkButton.removeAttribute("disabled");
                  checkButton.click();
                  var event = new MouseEvent("click", {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                  });
                  checkButton.dispatchEvent(event);
                  console.log(checkButton);
                } else {
                  console.error('"Check Answer" button not found.');
                }
              }

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
