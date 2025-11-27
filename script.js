// contentScript.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "rerunContentScript") {
    if (
      window.location.href.includes("tdx.acs.pearson.com/Player/Player.aspx")
    ) {
      // Place the logic you want to re-execute here
      console.log("Content script running in:", window.location.href);
      let questionText = "";
      let answerText = "";

      // Add error handling for messaging
      const handleError = () => {
        // Notify the popup about the error

        console.error("Failed to send error message:", e);
      };

      // Wait for both elements
      (async () => {
        try {
          const questionElement = document.querySelector("#contentHoldertop");
          //below is not an await as it may never be found
          const removeElement = document.querySelector("span.tempAnswer");
          const removeButton = document.querySelector("button.stopSolving");
          const existingSolvingIndicator =
            document.querySelector(".solving-indicator");
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
          if (removeButton) {
            removeButton.remove();
          }
          if (existingSolvingIndicator) {
            existingSolvingIndicator.remove();
          }
          var CLevent = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          async function waitForClearButtonAndClick(button) {
            if (button && !button.disabled) {
              await button.click();
              await button.dispatchEvent(CLevent);
            } // Check every 100ms
          }

          // Call the function with your button selector
          let clearButton = document.querySelector("button.btnClear");
          await waitForClearButtonAndClick(clearButton);

          const answerElement = document.querySelector("#bottom");
          /*
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.backgroundColor = "rgba(61, 53, 53, 0)"; // Transparent overlay
        overlay.style.zIndex = "9999"; // Ensure it's above all other elements
        overlay.style.pointerEvents = "auto"; // Block all interactions except excluded ones
        document.body.appendChild(overlay);
        */
          if (questionElement) {
            console.log("Question element found:", questionElement);
            questionText = questionElement.innerText.trim();
            console.log("This is the question text:", questionText);
          } else {
            console.log("question text not found");
            questionText = "";
          }
          if (answerElement) {
            console.log("Answer element found:", answerElement);
            answerText = answerElement.innerText.trim();
            console.log("This is the answer part text:", answerText);
          } else {
            console.log("question text not found");
            answerText = "";
          }
          // Add our styles and solving indicator BEFORE processing
          addGlowStyles();

          // Create the "Solving..." indicator BEFORE sending request
          if (answerElement) {
            const solvingIndicator = document.createElement("span");
            solvingIndicator.textContent = "Solving...";
            solvingIndicator.classList.add("solving-indicator");
            answerElement.insertBefore(
              solvingIndicator,
              answerElement.firstChild
            );
          }

          // Send the question and answerPart to the background script
          chrome.runtime.sendMessage(
            {
              action: "processQuestion",
              question: questionText,
              answerPart: answerText,
            },
            (response) => {
              // Remove the solving indicator when we get a response
              const indicator = document.querySelector(".solving-indicator");
              if (indicator) {
                indicator.remove();
              }

              if (chrome.runtime.lastError) {
                console.error("Runtime error:", chrome.runtime.lastError);
                handleError();
                return;
              }

              if (response && response.answer) {
                console.log("This is the answer:", response.answer);

                // Explicitly notify that processing is complete and include the answer
                chrome.runtime.sendMessage({
                  action: "updatePopup",
                  data: response.answer,
                  complete: true,
                });

                // contentScript.js
                chrome.runtime.sendMessage({
                  action: "sendData",
                  data: response.answer,
                });
                if (response.answer === "User not logged in") {
                  alert(
                    "Please log in through the chrome extension or sign up to begin solving!"
                  );
                  const displayAnswer = document.createElement("span");
                  displayAnswer.style.color = "#007dff";
                  displayAnswer.style.fontSize = "20px";
                  displayAnswer.innerText =
                    "Please log in through the chrome extension or sign up to begin solving!";
                  displayAnswer.classList.add("tempAnswer");
                  answerElement.insertBefore(
                    displayAnswer,
                    answerElement.firstChild
                  );
                  return;
                }
                if (
                  response.answer ===
                  "Final answer: You have reached your free limit of 10 uses, please subscribe at mylabsolver.com to have unlimited uses!"
                ) {
                  alert(
                    "You have reached your free limit of 10 uses, please subscribe at mylabsolver.com to have unlimited uses!"
                  );
                  const displayAnswer = document.createElement("span");
                  displayAnswer.style.color = "#007dff";
                  displayAnswer.style.fontSize = "20px";
                  displayAnswer.innerText =
                    "You have reached your free limit of 10 uses, please subscribe at mylabsolver.com to have unlimited uses!";
                  displayAnswer.classList.add("tempAnswer");
                  answerElement.insertBefore(
                    displayAnswer,
                    answerElement.firstChild
                  );
                  return;
                }

                const displayAnswer = document.createElement("span");
                displayAnswer.style.color = "#007dff";
                displayAnswer.style.fontSize = "20px";
                const keyword = "Final Answer: ";
                const answer = response.answer.substring(
                  response.answer.indexOf(keyword) + keyword.length
                );
                function fixExponentFormatting(text) {
                  console.log("Updated formatting 9!");

                  // First, let's add a placeholder to any existing <esc> tags to protect them
                  text = text.replace(/<esc>/g, "##ESCAPE_PLACEHOLDER##");

                  // 0. Handle LaTeX-style fractions (\frac and \fract)
                  text = text.replace(
                    /\\frac(?:t)?\{([^{}]*)\}\{([^{}]*)\}/g,
                    "$1/$2##ESCAPE_PLACEHOLDER##"
                  );
                  // 1. Handle all exponents - for both positive and negative powers
                  text = text.replace(
                    /\^(-?\d+|\{[^}]+\})/g,
                    "^$1##ESCAPE_PLACEHOLDER##"
                  );

                  // 2. Handle all trig functions with exponents (including inverse)
                  text = text.replace(
                    /(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|arccot|arcsec|arccsc)\^(-?\d+|\{[^}]+\})/g,
                    "$1^$2##ESCAPE_PLACEHOLDER##"
                  );

                  // 3. Handle functions with arguments
                  text = text.replace(
                    /(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|arccot|arcsec|arccsc|ln|log|sqrt)(\^(-?\d+|\{[^}]+\}))?##ESCAPE_PLACEHOLDER##?\(([^()]*)\)/g,
                    (match, func, exp, power, arg) => {
                      // Return the function, possibly with its exponent (with escape), followed by parentheses with argument (with escape)
                      const expPart = exp ? exp + "##ESCAPE_PLACEHOLDER##" : "";
                      return (
                        func + expPart + "(" + arg + ")##ESCAPE_PLACEHOLDER##"
                      );
                    }
                  );

                  // 4. Handle fractions with parenthetical denominators
                  text = text.replace(
                    /(\d+|[a-zA-Z])\/\(([^()]*)\)/g,
                    "$1/($2)##ESCAPE_PLACEHOLDER##"
                  );

                  // 5. Handle simple fractions
                  text = text.replace(
                    /(\d+|[a-zA-Z])\/(\d+|[a-zA-Z])/g,
                    "$1/$2##ESCAPE_PLACEHOLDER##"
                  );

                  // 6. Handle square roots
                  text = text.replace(
                    /sqrt\{([^{}]*)\}/g,
                    "sqrt{$1}##ESCAPE_PLACEHOLDER##"
                  );

                  // 7. Handle parenthesized fractions like (1/9)
                  text = text.replace(
                    /\((\d+)\/(\d+)\)/g,
                    "($1/$2)##ESCAPE_PLACEHOLDER##"
                  );

                  // 8. Remove backslashes from trig functions but preserve the functions
                  text = text.replace(
                    /\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|arccot|arcsec|arccsc)/g,
                    "$1"
                  );

                  // Restore the <esc> tags
                  text = text.replace(/##ESCAPE_PLACEHOLDER##/g, "<esc>");

                  console.log("After processing: " + text);
                  return text;
                }
                const formated = fixExponentFormatting(answer);

                const parts = formated.split("<esc>");
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
                      function wait500ms() {
                        return new Promise((resolve) => {
                          setTimeout(resolve, 500); // Waits for 500 milliseconds
                        });
                      }
                      function simulateRightArrowKey(element) {
                        const rightArrowDown = new KeyboardEvent("keydown", {
                          key: "ArrowRight",
                          code: "ArrowRight",
                          keyCode: 39,
                          which: 39,
                          bubbles: true,
                          cancelable: true,
                        });

                        const rightArrowUp = new KeyboardEvent("keyup", {
                          key: "ArrowRight",
                          code: "ArrowRight",
                          keyCode: 39,
                          which: 39,
                          bubbles: true,
                          cancelable: true,
                        });

                        element.dispatchEvent(rightArrowDown);
                        element.dispatchEvent(rightArrowUp);
                      }
                      function replaceSqrtWithoutBackslash(str) {
                        return str.replace(/(?<!\\)sqrt/g, "\\sqrt");
                      }

                      for (let i = 0; i < parts.length; i++) {
                        let result = replaceSqrtWithoutBackslash(
                          parts[i].replace(/[{}]/g, "")
                        );
                        inputField.value = result + "\t";
                        console.log(inputField.value);
                        let inputEvent = new Event("input", { bubbles: true });
                        inputField.dispatchEvent(inputEvent);
                        inputField.click();
                        inputField.focus();
                        await wait500ms();
                        inputField.click();
                        inputField.focus();
                        /*inputField.setSelectionRange(
                        inputField.selectionStart + 1,
                        inputField.selectionStart + 1
                      );
                      */
                        simulateRightArrowKey(inputField);
                        await wait500ms();
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
                    if (targetElement) {
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
                }
              } else {
                console.error(
                  "Failed to receive an answer from the background script."
                );
                handleError();
              }
            }
          );
        } catch (error) {
          console.error("Error while waiting for elements:", error);
          handleError();
        }
      })();
    }
  }
  // Return true to keep the message channel open for async responses
  return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "solveAllContentScript") {
    // Reset the stop flag at the beginning of a new solve all operation
    window.solvingStopped = false;

    if (
      window.location.href.includes("tdx.acs.pearson.com/Player/Player.aspx")
    ) {
      // Place the logic you want to re-execute here
      let detected = true;
      function solve1(error) {
        // Check if solving has been stopped
        if (window.solvingStopped) {
          console.log("Solving process was stopped");
          // Reset the flag for future operations
          window.solvingStopped = false;
          // Reset the detected flag to stop the recursion
          detected = false;
          return;
        }

        console.log("Content script running in:", window.location.href);
        let questionText = "";
        let answerText = "";

        // Wait for both elements
        (async () => {
          try {
            const questionElement = document.querySelector("#contentHoldertop");
            //below is not an await as it may never be found
            // Step 4: Select the "Check Answer" button
            let checkButton = document.querySelector(
              "button.navButton.gr-btn-primary"
            );

            // Ensure the button exists
            if (!checkButton) {
              checkButton = document.querySelector(
                "button.navButton.btn-primary"
              );
            }
            if (!checkButton) {
              console.log(
                "Check button not found. Attempting to navigate to the next question..."
              );

              // Find the currently selected LI element
              let selectedLi = document.querySelector(
                "li:has(div.acs-selected)"
              );
              if (!selectedLi) {
                selectedLi = document.querySelector("li.selected");
              }
              if (!selectedLi) {
                console.error("No selected question found. Ending execution.");
                return;
              }

              // Get the next list item
              const nextLi = selectedLi.nextElementSibling;

              if (nextLi) {
                // Old UI: div.acs-acs5; New UI: div.acs-acs6 plus anchor
                const link =
                  nextLi.querySelector("div.acs-acs5") ||
                  nextLi.querySelector("div.acs-acs6");
                const link2 = nextLi.querySelector("a.questionLabel");

                if (link) {
                  console.log("Navigating to the next question...");
                  link.click();
                } else if (link2) {
                  link2.click(); // fallback for old UI anchor-only case
                } else {
                  console.warn("No link found in the next list item.");
                }

                // Allow time for the next question to load before continuing
                setTimeout(() => {
                  if (detected && !window.solvingStopped) {
                    solve1();
                  }
                }, 500); // Adjust delay as needed for your application
              } else {
                console.error("No next question found. Ending execution.");
                return; // Stop execution if there are no more questions
              }
              return;
            }

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
            let removeElement = document.querySelector("span.tempAnswer");
            let removeButton = document.querySelector("button.stopSolving");
            var CLevent = new MouseEvent("click", {
              view: window,
              bubbles: true,
              cancelable: true,
            });
            async function waitForClearButtonAndClick(button) {
              if (button && !button.disabled) {
                await button.click();
                await button.dispatchEvent(CLevent);
              } // Check every 100ms
            }

            // Call the function with your button selector
            let clearButton = document.querySelector("button.btnClear");
            await waitForClearButtonAndClick(clearButton);
            if (removeElement) {
              removeElement.remove();
            }
            if (removeButton) {
              removeButton.remove();
            }

            let additional = "";
            if (questionElement) {
              console.log("Question element found:", questionElement);
              questionText = questionElement.innerText.trim();
              console.log("This is the question text:", questionText);
              additional = "";
              if (error != null) {
                additional = "Be careful of this: " + error;
              }
            } else {
              questionText = "";
            }
            const answerElement = document.querySelector("#bottom");
            if (answerElement) {
              console.log("Answer element found:", answerElement);
              answerText = answerElement.innerText.trim();
              console.log(
                "This is the answer part text:",
                answerText + additional
              );
            } else {
              answerText = "";
            }
            if (questionText == "" && answerText == "") {
              detected = false;
              chrome.runtime.sendMessage({
                action: "updatePopup",
                data: "Final Answer: Nothing was detected. Try highlighting text with your mouse then using the solve highlight button.",
              });
              return;
            }

            // Add solving indicator BEFORE sending the request
            addGlowStyles();
            if (answerElement) {
              // Create the "Solving..." indicator
              const solvingIndicator = document.createElement("span");
              solvingIndicator.textContent = "Solving...";
              solvingIndicator.classList.add("solving-indicator");
              answerElement.insertBefore(
                solvingIndicator,
                answerElement.firstChild
              );
            }

            // Send the question and answerPart to the background script
            chrome.runtime.sendMessage(
              {
                action: "processQuestion",
                question: questionText,
                answerPart: answerText + additional,
              },
              (response) => {
                // Remove the solving indicator when we get a response
                const indicator = document.querySelector(".solving-indicator");
                if (indicator) {
                  indicator.remove();
                }

                if (response && response.answer) {
                  console.log("This is the answer:", response.answer);
                  if (response.answer === "User not logged in") {
                    alert(
                      "Please log in through the chrome extension or sign up to begin solving!"
                    );
                    const displayAnswer = document.createElement("span");
                    displayAnswer.style.color = "#007dff";
                    displayAnswer.style.fontSize = "20px";
                    displayAnswer.innerText =
                      "Please log in through the chrome extension or sign up to begin solving!";
                    displayAnswer.classList.add("tempAnswer");
                    if (answerElement) {
                      answerElement.insertBefore(
                        displayAnswer,
                        answerElement.firstChild
                      );
                    }
                    return;
                  }
                  if (
                    response.answer ===
                    "Final answer: You have reached your free limit of 10 uses, please subscribe at mylabsolver.com to have unlimited uses!"
                  ) {
                    alert(
                      "You have reached your free limit of 10 uses, please subscribe at mylabsolver.com to have unlimited uses!"
                    );
                    const displayAnswer = document.createElement("span");
                    displayAnswer.style.color = "#007dff";
                    displayAnswer.style.fontSize = "20px";
                    displayAnswer.innerText =
                      "You have reached your free limit of 10 uses, please subscribe at mylabsolver.com to have unlimited uses!";
                    displayAnswer.classList.add("tempAnswer");
                    if (answerElement) {
                      answerElement.insertBefore(
                        displayAnswer,
                        answerElement.firstChild
                      );
                    }
                    return;
                  }

                  // Explicitly notify that processing is complete and include the answer
                  chrome.runtime.sendMessage({
                    action: "updatePopup",
                    data: response.answer,
                    complete: true,
                  });

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
                  function fixExponentFormatting(text) {
                    console.log("Updated formatting 9!");

                    // First, let's add a placeholder to any existing <esc> tags to protect them
                    text = text.replace(/<esc>/g, "##ESCAPE_PLACEHOLDER##");

                    // 0. Handle LaTeX-style fractions (\frac and \fract)
                    text = text.replace(
                      /\\frac(?:t)?\{([^{}]*)\}\{([^{}]*)\}/g,
                      "$1/$2##ESCAPE_PLACEHOLDER##"
                    );

                    // 1. Handle all exponents - for both positive and negative powers
                    text = text.replace(
                      /\^(-?\d+|\{[^}]+\})/g,
                      "^$1##ESCAPE_PLACEHOLDER##"
                    );

                    // 2. Handle all trig functions with exponents (including inverse)
                    text = text.replace(
                      /(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|arccot|arcsec|arccsc)\^(-?\d+|\{[^}]+\})/g,
                      "$1^$2##ESCAPE_PLACEHOLDER##"
                    );

                    // 3. Handle functions with arguments
                    text = text.replace(
                      /(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|arccot|arcsec|arccsc|ln|log|sqrt)(\^(-?\d+|\{[^}]+\}))?##ESCAPE_PLACEHOLDER##?\(([^()]*)\)/g,
                      (match, func, exp, power, arg) => {
                        // Return the function, possibly with its exponent (with escape), followed by parentheses with argument (with escape)
                        const expPart = exp
                          ? exp + "##ESCAPE_PLACEHOLDER##"
                          : "";
                        return (
                          func + expPart + "(" + arg + ")##ESCAPE_PLACEHOLDER##"
                        );
                      }
                    );

                    // 4. Handle fractions with parenthetical denominators
                    text = text.replace(
                      /(\d+|[a-zA-Z])\/\(([^()]*)\)/g,
                      "$1/($2)##ESCAPE_PLACEHOLDER##"
                    );

                    // 5. Handle simple fractions
                    text = text.replace(
                      /(\d+|[a-zA-Z])\/(\d+|[a-zA-Z])/g,
                      "$1/$2##ESCAPE_PLACEHOLDER##"
                    );

                    // 6. Handle square roots
                    text = text.replace(
                      /sqrt\{([^{}]*)\}/g,
                      "sqrt{$1}##ESCAPE_PLACEHOLDER##"
                    );

                    // 7. Handle parenthesized fractions like (1/9)
                    text = text.replace(
                      /\((\d+)\/(\d+)\)/g,
                      "($1/$2)##ESCAPE_PLACEHOLDER##"
                    );

                    // 8. Remove backslashes from trig functions but preserve the functions
                    text = text.replace(
                      /\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|arccot|arcsec|arccsc)/g,
                      "$1"
                    );

                    // Restore the <esc> tags
                    text = text.replace(/##ESCAPE_PLACEHOLDER##/g, "<esc>");

                    console.log("After processing: " + text);
                    return text;
                  }

                  const formated = fixExponentFormatting(answer);
                  const parts = formated.split("<esc>");
                  displayAnswer.innerText = "Answer: " + parts.join("");
                  console.log(parts);
                  displayAnswer.classList.add("tempAnswer");
                  if (answerElement) {
                    answerElement.insertBefore(
                      displayAnswer,
                      answerElement.firstChild
                    );
                  }
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

                        function wait500ms() {
                          return new Promise((resolve) => {
                            setTimeout(resolve, 500); // Waits for 500 milliseconds
                          });
                        }
                        function simulateRightArrowKey(element) {
                          const rightArrowDown = new KeyboardEvent("keydown", {
                            key: "ArrowRight",
                            code: "ArrowRight",
                            keyCode: 39,
                            which: 39,
                            bubbles: true,
                            cancelable: true,
                          });

                          const rightArrowUp = new KeyboardEvent("keyup", {
                            key: "ArrowRight",
                            code: "ArrowRight",
                            keyCode: 39,
                            which: 39,
                            bubbles: true,
                            cancelable: true,
                          });

                          element.dispatchEvent(rightArrowDown);
                          element.dispatchEvent(rightArrowUp);
                        }
                        function replaceSqrtWithoutBackslash(str) {
                          return str.replace(/(?<!\\)sqrt/g, "\\sqrt");
                        }

                        for (let i = 0; i < parts.length; i++) {
                          let result = replaceSqrtWithoutBackslash(
                            parts[i].replace(/[{}]/g, "")
                          );
                          inputField.value = result + "\t";
                          console.log(inputField.value);
                          let inputEvent = new Event("input", {
                            bubbles: true,
                          });
                          inputField.dispatchEvent(inputEvent);
                          inputField.click();
                          inputField.focus();
                          await wait500ms();
                          inputField.click();
                          inputField.focus();
                          /*inputField.setSelectionRange(
                          inputField.selectionStart + 1,
                          inputField.selectionStart + 1
                        );
                        */

                          simulateRightArrowKey(inputField);
                          await wait500ms();
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
                    }

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
                      let title = await document.querySelector("span.titleText")
                        .innerText;
                      if (
                        title == "That's incorrect." ||
                        title == "Try again."
                      ) {
                        console.log("Incorrect if statement ran succesfully.");
                        let description =
                          document.querySelector("div.messageBox").innerText;
                        await wait500ms();
                        waitForButtonAndClick(okButton);
                        await wait500ms();
                        solve1(
                          description +
                            " This is the incorrect answer: " +
                            parts.join(" ")
                        );
                        return;
                      }
                      await wait500ms();
                      waitForButtonAndClick(okButton);
                      await wait500ms();
                      solve1();
                      return;
                    }
                  }
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
      if (detected) {
        solve1();
      }
    }
  }
});

//Solve selected(highlighted)

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "solveSelectedContentScript") {
    console.log("hey selected route hit!");

    if (window.getSelection) {
      const removeElement = document.querySelector("span.tempAnswer");
      const removeButton = document.querySelector("button.stopSolving");
      const existingSolvingIndicator =
        document.querySelector(".solving-indicator");

      if (removeElement) {
        removeElement.remove();
      }
      if (removeButton) {
        removeButton.remove();
      }
      if (existingSolvingIndicator) {
        existingSolvingIndicator.remove();
      }

      // Add our styles
      addGlowStyles();

      const answerElement = document.querySelector("#bottom");
      if (answerElement) {
        // Create the "Solving..." indicator
        const solvingIndicator = document.createElement("span");
        solvingIndicator.textContent = "Solving...";
        solvingIndicator.classList.add("solving-indicator");
        answerElement.insertBefore(solvingIndicator, answerElement.firstChild);

        let text = window.getSelection().toString();
        console.log(text);

        chrome.runtime.sendMessage(
          {
            action: "processQuestion",
            question: "",
            answerPart: text,
          },
          (response) => {
            // Remove the solving indicator when we get a response
            const indicator = document.querySelector(".solving-indicator");
            if (indicator) {
              indicator.remove();
            }

            if (response && response.answer) {
              console.log("This is the answer:", response.answer);
              if (response.answer === "User not logged in") {
                alert(
                  "Please log in through the chrome extension or sign up to begin solving!"
                );
                const displayAnswer = document.createElement("span");
                displayAnswer.style.color = "#007dff";
                displayAnswer.style.fontSize = "20px";
                displayAnswer.innerText =
                  "Please log in through the chrome extension or sign up to begin solving!";
                displayAnswer.classList.add("tempAnswer");
                if (answerElement) {
                  answerElement.insertBefore(
                    displayAnswer,
                    answerElement.firstChild
                  );
                }
                return;
              }

              if (
                response.answer ===
                "Final answer: You have reached your free limit of 10 uses, please subscribe at mylabsolver.com to have unlimited uses!"
              ) {
                alert(
                  "You have reached your free limit of 10 uses, please subscribe at mylabsolver.com to have unlimited uses!"
                );
                const displayAnswer = document.createElement("span");
                displayAnswer.style.color = "#007dff";
                displayAnswer.style.fontSize = "20px";
                displayAnswer.innerText =
                  "You have reached your free limit of 10 uses, please subscribe at mylabsolver.com to have unlimited uses!";
                displayAnswer.classList.add("tempAnswer");
                if (answerElement) {
                  answerElement.insertBefore(
                    displayAnswer,
                    answerElement.firstChild
                  );
                }
                return;
              }

              // Explicitly notify that processing is complete and include the answer
              chrome.runtime.sendMessage({
                action: "updatePopup",
                data: response.answer,
                complete: true,
              });

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
              if (answerElement) {
                answerElement.insertBefore(
                  displayAnswer,
                  answerElement.firstChild
                );
              }
              spanParts = document.querySelectorAll("span.step");
              spanLastPart = spanParts[spanParts.length - 1];
              console.log(spanParts);
              console.log(spanLastPart);
            }
          }
        );
      }
    }
  }
});

// Also add a listener for page unload/refresh
window.addEventListener("beforeunload", function () {
  // Let the background script know the page is being unloaded
  chrome.runtime.sendMessage({
    action: "pageUnloaded",
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "stopSolving") {
    console.log("Stopping solving process from popup button");

    // Remove any temporary answer display
    const tempAnswer = document.querySelector("span.tempAnswer");
    if (tempAnswer) {
      tempAnswer.remove();
    }

    // Remove solving indicator
    const solvingIndicator = document.querySelector(".solving-indicator");
    if (solvingIndicator) {
      solvingIndicator.remove();
    }

    // Set a flag to prevent continuation of any solve operations
    window.solvingStopped = true;

    // Also reset the detected flag to stop the recursion in solveAll
    detected = false;

    // If there are any ongoing operations or timers, cancel them
    if (window.solveTimeout) {
      clearTimeout(window.solveTimeout);
    }

    // Abort any fetch requests
    if (
      window.activeRequest &&
      typeof window.activeRequest.abort === "function"
    ) {
      window.activeRequest.abort();
    }

    // Reset the processing state
    chrome.storage.local.set({
      processingQuestion: false,
      solveAllSelected: false,
    });

    // Let the sender know the action was handled
    if (sendResponse) {
      sendResponse({ result: "Solving process stopped" });
    }
  }
});

// First, let's add a style element for our glow animation
function addGlowStyles() {
  // Check if we've already added the styles
  if (document.getElementById("solving-glow-styles")) return;

  const styleElement = document.createElement("style");
  styleElement.id = "solving-glow-styles";
  styleElement.textContent = `
    @keyframes glowScan {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: 200px 0;
      }
    }
    .solving-indicator {
      display: inline-block;
      font-size: 20px;
      font-weight: bold;
      color: #007dff;
      padding: 8px 12px;
      margin-bottom: 10px;
      background: linear-gradient(90deg, 
                  rgba(0, 125, 255, 0) 0%, 
                  rgba(0, 125, 255, 0.8) 50%, 
                  rgba(0, 125, 255, 0) 100%);
      background-size: 200px 100%;
      background-repeat: no-repeat;
      animation: glowScan 1.5s infinite linear;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(styleElement);
}
