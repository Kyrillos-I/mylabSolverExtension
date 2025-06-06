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

      // Wait for both elements
      (async () => {
        try {
          const questionElement = document.querySelector("#contentHoldertop");
          //below is not an await as it may never be found
          const removeElement = document.querySelector("span.tempAnswer");
          const removeButton = document.querySelector("button.stopSolving");
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
          const stopSolving = document.createElement("button");
          stopSolving.innerText = "Stop Solving";
          stopSolving.style.backgroundColor = "red";
          stopSolving.style.color = "white";
          stopSolving.addEventListener("click", () => {
            window.location.reload();
          });
          if (questionElement) {
            console.log("Question element found:", questionElement);
            questionText = questionElement.innerText.trim();
            console.log("This is the question text:", questionText);
          } else {
            console.log("question text not found");
            questionText = "";
          }
          if (answerElement) {
            answerElement.insertBefore(stopSolving, answerElement.firstChild);
            console.log("Answer element found:", answerElement);
            answerText = answerElement.innerText.trim();
            console.log("This is the answer part text:", answerText);
          } else {
            console.log("question text not found");
            answerText = "";
          }
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
                  if (stopSolving) {
                    stopSolving.remove();
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
                  answerElement.insertBefore(
                    displayAnswer,
                    answerElement.firstChild
                  );
                  if (stopSolving) {
                    stopSolving.remove();
                  }
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
                if (stopSolving) {
                  stopSolving.remove();
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
                chrome.runtime.sendMessage({
                  action: "updatePopup",
                  data: "Final answer: Server error. Please try again.",
                });
              }
            }
          );
        } catch (error) {
          console.error("Error while waiting for elements:", error);
        }
      })();
    }
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "solveAllContentScript") {
    if (
      window.location.href.includes("tdx.acs.pearson.com/Player/Player.aspx")
    ) {
      // Place the logic you want to re-execute here
      let detected = true;
      function solve1(error) {
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
                let link = nextLi.querySelector("div.acs-acs5");
                if (link) {
                  console.log("Navigating to the next question...");
                  link.click(); // Simulate a click on the next question's div
                } else if (!link) {
                  link = nextLi.querySelector("a.questionLabel");
                  link.click();
                } else {
                  console.warn("No link found in the next list item.");
                }

                // Allow time for the next question to load before continuing
                setTimeout(() => {
                  if (detected) {
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
            const stopSolving = document.createElement("button");
            stopSolving.innerText = "Stop Solving";
            stopSolving.style.backgroundColor = "red";
            stopSolving.style.color = "white";
            stopSolving.classList.add("stopSolving");
            stopSolving.addEventListener("click", () => {
              //reload the page
              window.location.reload();
            });
            if (answerElement) {
              answerElement.insertBefore(stopSolving, answerElement.firstChild);
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
                    if (stopSolving) {
                      stopSolving.remove();
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
                    if (stopSolving) {
                      stopSolving.remove();
                    }
                    return;
                  }

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
                  if (stopSolving) {
                    stopSolving.remove();
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
            if (removeButton) {
              removeButton.remove();
            }
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
      if (removeElement) {
        removeElement.remove();
      }
      if (removeButton) {
        removeButton.remove();
      }

      const answerElement = document.querySelector("#bottom");
      const stopSolving = document.createElement("button");
      stopSolving.innerText = "Stop Solving";
      stopSolving.style.backgroundColor = "red";
      stopSolving.style.color = "white";
      stopSolving.classList.add("stopSolving");
      stopSolving.addEventListener("click", () => {
        //reload the page
        window.location.reload();
      });
      if (answerElement) {
        answerElement.insertBefore(stopSolving, answerElement.firstChild);
      } else {
        const panel = document.querySelector(".controlPanel");
        panel.insertBefore(stopSolving, panel.firstChild);
      }
      let text = window.getSelection().toString();
      console.log(text);
      chrome.runtime.sendMessage(
        {
          action: "processQuestion",
          question: "",
          answerPart: text,
        },
        (response) => {
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
              } else {
                const panel = document.querySelector(".controlPanel");
                panel.insertBefore(displayAnswer, panel.firstChild);
              }

              if (stopSolving) {
                stopSolving.remove();
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
              if (stopSolving) {
                stopSolving.remove();
              }
              return;
            }

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
            if (stopSolving) {
              stopSolving.remove();
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
});
