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
        /*
        const firstInputFields = document.querySelectorAll("input.focusNode");
        const deleteInput = firstInputFields[firstInputFields.length - 1];
        if (deleteInput) {
          deleteInput.innerText = "";
          deleteInput.value = "";
          var event = new Event("input", { bubbles: true });
          inputField.dispatchEvent(event);
          inputField.dispatchEvent(new Event("change", { bubbles: true }));
        }
          */
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
              const keyword = "Final Answer: ";
              const answer = response.answer.substring(
                response.answer.indexOf(keyword) + keyword.length
              );
              const parts = answer.split("<esc>");
              displayAnswer.innerText = "Answer: " + parts.join("");
              console.log(parts);
              displayAnswer.classList.add("tempAnswer");
              answerElement.insertBefore(
                displayAnswer,
                answerElement.firstChild
              );
              spanParts = document.querySelectorAll("span.step");
              spanLastPart = spanParts[spanParts.length - 1];
              console.log(spanParts);
              console.log(spanLastPart);
              fillAnswerAndSubmit(answer, spanLastPart, parts);

              function fillAnswerAndSubmit(answer, lastPart, parts) {
                var inputFields = document.querySelectorAll("input.focusNode");
                var spanHolders = document.querySelectorAll(
                  "span.eqDocument.current"
                );
                var eqEditors = document.querySelectorAll(
                  "span.eqEditor.inputField"
                );
                // Check if any matching elements were found
                if (inputFields) {
                  if (inputFields.length > 0) {
                    // Select the last input field
                    var inputField = inputFields[inputFields.length - 1];
                    var spanHolder = spanHolders[spanHolders.length - 1];
                    var eqEditor = eqEditors[eqEditors.length - 1];
                    console.log(spanHolder);
                    inputField.value = null;
                    inputField.focus();
                    var event = new Event("input", { bubbles: true });
                    inputField.dispatchEvent(event);
                    inputField.dispatchEvent(
                      new Event("change", { bubbles: true })
                    );
                    spanHolder.innerHTML = "";
                    inputField.focus();
                    inputField.click();

                    let styleButtons = document.querySelector(
                      "div.dijitContentPane"
                    );
                    styleButtons.style.visibility = "visible";
                    let moreButton = document.querySelector(
                      "button.iconMoreTools"
                    );
                    let rightArrow = document.querySelector(
                      "button.iconRightArrowDir"
                    );

                    for (let i = 0; i < parts.length; i++) {
                      inputField.value += parts[i] + "\t";
                      console.log(inputField.value);
                      let inputEvent = new Event("input", { bubbles: true });
                      inputField.dispatchEvent(inputEvent);
                      var Cevent = new MouseEvent("click", {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                      });
                      function waitForButtonAndClick(button) {
                        const interval = setInterval(() => {
                          if (button && !button.disabled) {
                            button.removeAttribute("disabled");
                            button.setAttribute("aria-disabled", "false");
                            console.log(
                              "Button is enabled. Clicking now:",
                              button
                            );
                            button.click();
                            button.dispatchEvent(Cevent);
                            clearInterval(interval); // Stop polling after the button is clicked
                          }
                        }, 100); // Check every 100ms
                      }
                      inputField.focus();
                      const pos = inputField.selectionStart;
                      inputField.selectionStart = pos + 1;
                      inputField.selectionEnd = pos + 1;
                      eqEditor.focus();
                      eqEditor.click();
                      eqEditor.classList.add("focused");
                      waitForButtonAndClick(inputField);
                      waitForButtonAndClick(eqEditor);
                      waitForButtonAndClick(moreButton);
                      waitForButtonAndClick(rightArrow);
                      inputField.dispatchEvent(inputEvent);
                      console.log(inputField.value);
                    }
                    // Step 3: Dispatch input event
                    var event = new Event("input", { bubbles: true });
                    //inputField.dispatchEvent(event);
                    //inputField.dispatchEvent(
                    //  new Event("change", { bubbles: true })
                    //);

                    //inputField.dispatchEvent(tabEvent);
                    console.log(inputField.value);
                  } else {
                    console.error("Input field not found.");
                  }
                }
                //MC
                let arr = answer.split(" ");
                console.log(arr);
                let allRadioButtons = lastPart.querySelectorAll(
                  "input.dijitCheckBoxInput"
                );
                for (let i = 0; i < allRadioButtons.length; i++) {
                  if (allRadioButtons[i].checked) {
                    allRadioButtons[i].click();
                  }
                }
                for (let i = 0; i < arr.length; i++) {
                  const elements = Array.from(
                    lastPart.querySelectorAll("label")
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

                // Step 4: Select the "Check Answer" button
                /*var checkButton = document.querySelector(
                  "button.navButton.btn-primary"
                );
                */

                // Ensure the button exists
                if (checkButton) {
                  // Step 5: Click the button
                  var event = new MouseEvent("click", {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                  });
                  function waitForButtonAndClick(button) {
                    const interval = setInterval(() => {
                      if (button && !button.disabled) {
                        console.log("Button is enabled. Clicking now:", button);
                        button.click();
                        button.dispatchEvent(event);
                        clearInterval(interval); // Stop polling after the button is clicked
                      }
                    }, 100); // Check every 100ms
                  }

                  // Call the function with your button selector
                  waitForButtonAndClick(checkButton);
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "solveAllContentScript") {
    // Place the logic you want to re-execute here
    function solve1(error) {
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
          /*
        const firstInputFields = document.querySelectorAll("input.focusNode");
        const deleteInput = firstInputFields[firstInputFields.length - 1];
        if (deleteInput) {
          deleteInput.innerText = "";
          deleteInput.value = "";
          var event = new Event("input", { bubbles: true });
          inputField.dispatchEvent(event);
          inputField.dispatchEvent(new Event("change", { bubbles: true }));
        }
          */
          if (removeElement) {
            removeElement.remove();
          }

          console.log("Question element found:", questionElement);
          questionText = questionElement.innerText.trim();
          console.log("This is the question text:", questionText);
          let additional = "";
          if (error != null) {
            additional = "Be careful of this: " + error;
          }
          const answerElement = await waitForElement("#bottom");
          console.log("Answer element found:", answerElement);
          answerText = answerElement.innerText.trim();
          console.log("This is the answer part text:", answerText + additional);

          // Send the question and answerPart to the background script
          chrome.runtime.sendMessage(
            {
              action: "processQuestion",
              question: questionText,
              answerPart: answerText + additional,
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
                const keyword = "Final Answer: ";
                const answer = response.answer.substring(
                  response.answer.indexOf(keyword) + keyword.length
                );
                const parts = answer.split("<esc>");
                displayAnswer.innerText = "Answer: " + parts.join("");
                console.log(parts);
                displayAnswer.classList.add("tempAnswer");
                answerElement.insertBefore(
                  displayAnswer,
                  answerElement.firstChild
                );
                spanParts = document.querySelectorAll("span.step");
                spanLastPart = spanParts[spanParts.length - 1];
                console.log(spanParts);
                console.log(spanLastPart);
                fillAnswerAndSubmit(answer, spanLastPart, parts);

                async function fillAnswerAndSubmit(answer, lastPart, parts) {
                  var inputFields =
                    document.querySelectorAll("input.focusNode");
                  var spanHolders = document.querySelectorAll(
                    "span.eqDocument.current"
                  );
                  var eqEditors = document.querySelectorAll(
                    "span.eqEditor.inputField"
                  );
                  // Check if any matching elements were found
                  if (inputFields) {
                    if (inputFields.length > 0) {
                      // Select the last input field
                      var inputField = inputFields[inputFields.length - 1];
                      var spanHolder = spanHolders[spanHolders.length - 1];
                      var eqEditor = eqEditors[eqEditors.length - 1];
                      console.log(spanHolder);
                      inputField.value = null;
                      inputField.focus();
                      var event = new Event("input", { bubbles: true });
                      inputField.dispatchEvent(event);
                      inputField.dispatchEvent(
                        new Event("change", { bubbles: true })
                      );
                      spanHolder.innerHTML = "";
                      inputField.focus();
                      inputField.click();

                      let styleButtons = document.querySelector(
                        "div.dijitContentPane"
                      );
                      styleButtons.style.visibility = "visible";
                      let moreButton = document.querySelector(
                        "button.iconMoreTools"
                      );
                      let rightArrow = document.querySelector(
                        "button.iconRightArrowDir"
                      );

                      for (let i = 0; i < parts.length; i++) {
                        inputField.value = parts[i] + "\t";
                        console.log(inputField.value);
                        let inputEvent = new Event("input", { bubbles: true });
                        inputField.dispatchEvent(inputEvent);
                        var Cevent = new MouseEvent("click", {
                          view: window,
                          bubbles: true,
                          cancelable: true,
                        });
                        function wait500ms() {
                          return new Promise((resolve) => {
                            setTimeout(resolve, 500); // Waits for 500 milliseconds
                          });
                        }
                        async function waitForButtonAndClick(button) {
                          await wait500ms();
                          const interval = setInterval(() => {
                            if (button && !button.disabled) {
                              button.removeAttribute("disabled");
                              console.log(
                                "Button is enabled. Clicking now:",
                                button
                              );
                              button.click();
                              button.dispatchEvent(Cevent);
                              clearInterval(interval); // Stop polling after the button is clicked
                            }
                          }, 100); // Check every 100ms
                        }
                        inputField.focus();
                        const pos = inputField.selectionStart;
                        inputField.selectionStart = pos + 1;
                        inputField.selectionEnd = pos + 1;
                        eqEditor.focus();
                        eqEditor.click();
                        eqEditor.classList.add("focused");
                        await waitForButtonAndClick(inputField);
                        await waitForButtonAndClick(eqEditor);
                        await waitForButtonAndClick(moreButton);
                        await waitForButtonAndClick(rightArrow);
                        inputField.dispatchEvent(inputEvent);
                        console.log(inputField.value);
                        inputField.focus();
                        inputField.setSelectionRange(99999, 99999);
                      }
                      // Step 3: Dispatch input event
                      var event = new Event("input", { bubbles: true });
                      //inputField.dispatchEvent(event);
                      //inputField.dispatchEvent(
                      //  new Event("change", { bubbles: true })
                      //);

                      //inputField.dispatchEvent(tabEvent);
                      console.log(inputField.value);
                    } else {
                      console.error("Input field not found.");
                    }
                  }
                  //MC
                  let arr = answer.split(" ");
                  console.log(arr);
                  let allRadioButtons = lastPart.querySelectorAll(
                    "input.dijitCheckBoxInput"
                  );
                  for (let i = 0; i < allRadioButtons.length; i++) {
                    if (allRadioButtons[i].checked) {
                      allRadioButtons[i].click();
                    }
                  }
                  for (let i = 0; i < arr.length; i++) {
                    const elements = Array.from(
                      lastPart.querySelectorAll("label")
                    ); // Select all label elements
                    const targetElement = elements.find((el) =>
                      el.textContent.trim().startsWith(arr[i] + ".")
                    );
                    console.log(targetElement);
                    if (targetElement) {
                      var id = "" + targetElement.htmlFor;
                    }
                    console.log(id);
                    let select = document.getElementById(id);
                    console.log(select);
                    if (select) {
                      if (!select.checked) {
                        select.click();
                      }
                    }
                    console.log(select);
                  }

                  // Step 4: Select the "Check Answer" button
                  let checkButton = document.querySelector(
                    "button.navButton.btn-primary"
                  );

                  // Ensure the button exists
                  if (checkButton) {
                    // Step 5: Click the button
                    var event = new MouseEvent("click", {
                      view: window,
                      bubbles: true,
                      cancelable: true,
                    });
                    function waitForButtonAndClick(button) {
                      const interval = setInterval(() => {
                        if (button && !button.disabled) {
                          console.log(
                            "Button is enabled. Clicking now:",
                            button
                          );
                          button.click();
                          button.dispatchEvent(event);
                          clearInterval(interval); // Stop polling after the button is clicked
                        }
                      }, 100); // Check every 100ms
                    }

                    // Call the function with your button selector
                    waitForButtonAndClick(checkButton);

                    function wait500ms() {
                      return new Promise((resolve) => {
                        setTimeout(resolve, 500); // Waits for 500 milliseconds
                      });
                    }
                    await wait500ms();
                    let okButton = document.querySelector(
                      '[data-dojo-attach-point="btnOk"]'
                    );
                    while (!okButton) {
                      await wait500ms();
                      okButton = document.querySelector(
                        '[data-dojo-attach-point="btnOk"]'
                      );
                    }
                    if (okButton) {
                      let title =
                        document.querySelector("span.titleText").innerText;
                      if (title == "That's incorrect") {
                        let description =
                          document.querySelector("span.rvText").innerText;
                        solve1(
                          description +
                            " This is the incorrect answer: " +
                            parts.join(" ")
                        );
                      }
                      await wait500ms();
                      waitForButtonAndClick(okButton);
                      await wait500ms();
                      solve1();
                    }
                  } else {
                    // Find the currently selected LI element
                    const selectedLi = document.querySelector("li.selected");

                    // Get the next list item (the one underneath the selected)
                    const nextLi = selectedLi.nextElementSibling;

                    if (nextLi) {
                      // There might be an <a> inside the <li> you actually want to click
                      const link = nextLi.querySelector("a.questionLabel");

                      // If the link exists, simulate a click on it
                      if (link) {
                        link.click();
                        nextLi.click();
                      } else {
                        // If there's no link, you can directly click the LI if it has a click handler
                        nextLi.click();
                      }
                      solve1();
                    }
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
    solve1();
  }
});
