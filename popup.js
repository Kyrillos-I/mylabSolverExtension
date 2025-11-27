// popup.js
let solveAllSelected = false;
document.getElementById("solve").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlPattern = /^https:\/\/(?:[^\/]+\.)?pearson\.com\//;

  if (!urlPattern.test(tab.url)) {
    alert(
      "This extension only works on Pearson MyLab. Please go to https://mylab.pearson.com/ to use."
    );
    chrome.runtime.sendMessage({
      action: "updatePopup",
      data: "Final Answer: This extension only works on Pearson MyLab. Please go to https://mylab.pearson.com/ to use.",
    });
    updatePopupUI(
      "Final Answer: Please go to Pearson MyLab to use the extension."
    );
    return; // Exit if the URL doesn't match
  }
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "rerunContentScript" });
  }
});
document.getElementById("solveAll").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlPattern = /^https:\/\/(?:[^\/]+\.)?pearson\.com\//;

  if (!urlPattern.test(tab.url)) {
    alert(
      "This extension only works on Pearson MyLab. Please go to https://mylab.pearson.com/ to use."
    );
    chrome.runtime.sendMessage({
      action: "updatePopup",
      data: "Final Answer: This extension only works on Pearson MyLab. Please go to https://mylab.pearson.com/ to use.",
    });
    updatePopupUI(
      "Final Answer: Please go to Pearson MyLab to use the extension."
    );
    return; // Exit if the URL doesn't match
  }
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "solveAllContentScript" });
  }
});
document.getElementById("solveSelected").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlPattern = /^https:\/\/(?:[^\/]+\.)?pearson\.com\//;

  if (!urlPattern.test(tab.url)) {
    alert(
      "This extension only works on Pearson MyLab. Please go to https://mylab.pearson.com/ to use."
    );
    chrome.runtime.sendMessage({
      action: "updatePopup",
      data: "Final Answer: This extension only works on Pearson MyLab. Please go to https://mylab.pearson.com/ to use.",
    });
    updatePopupUI(
      "Final Answer: Please go to Pearson MyLab to use the extension."
    );
    return; // Exit if the URL doesn't match
  }
  // Use chrome.scripting.executeScript to get the highlighted text
  try {
    // If text is selected, send the message to the content script
    chrome.tabs.sendMessage(tab.id, { action: "solveSelectedContentScript" });
  } catch (error) {
    console.error("Script injection failed: ", error);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updatePopup") {
    // Update the popup with the received data
    updatePopupUI(request.data);

    // If we received a final answer, clear it from storage (unless in solve all mode)
    chrome.storage.local.get(["solveAllSelected"], (result) => {
      if (
        request.data &&
        request.data.includes("Final Answer:") &&
        !result.solveAllSelected
      ) {
        chrome.storage.local.remove("lastResponse");
        chrome.storage.local.set({ processingQuestion: false });
      }
    });
  }

  if (request.action === "solveComplete") {
    // Set processing state to false when solving is complete
    chrome.storage.local.set({ processingQuestion: false });
  }
});

function updatePopupUI(data) {
  // Check if data is undefined or null
  if (!data) {
    const output = document.querySelector(".text");
    const load = document.querySelector(".spinner");
    if (load) load.style.display = "none";
    if (output) output.innerText = "Solving stopped";

    // Show buttons and hide spinner
    const button = document.querySelector("button#solve");
    const solveAll = document.querySelector("#solveAll");
    const solveSelected = document.querySelector("#solveSelected");
    const deepThinkButton = document.querySelector("#deepThink");
    const stopSolvingButton = document.querySelector("#stopSolving");

    if (button) button.style.display = "block";
    if (solveAll) solveAll.style.display = "block";
    if (solveSelected) solveSelected.style.display = "block";
    if (deepThinkButton) deepThinkButton.style.display = "block";
    if (stopSolvingButton) stopSolvingButton.style.display = "none";

    return;
  }

  // Existing code for when data is defined
  const output = document.querySelector(".text");
  const keyword = "Final Answer: ";
  const answer = data.substring(data.indexOf(keyword) + keyword.length);

  const load = document.querySelector(".spinner");
  load.style.display = "none";

  output.innerText = answer;

  const button = document.querySelector("button#solve");
  const solveAll = document.querySelector("#solveAll");
  const solveSelected = document.querySelector("#solveSelected");
  const deepThinkButton = document.querySelector("#deepThink");
  const deepThinkStatus = document.querySelector(".deep-think-status");
  const stopSolvingButton = document.querySelector("#stopSolving");

  button.style.display = "block";
  solveAll.style.display = "block";
  solveSelected.style.display = "block";
  deepThinkButton.style.display = "block";
  stopSolvingButton.style.display = "none";
  deepThinkStatus.style.display = "none";

  const fullLink = document.querySelector(".fullResponse");
  fullLink.style.display = "block";

  const full = document.querySelector(".gptResponse");
  full.innerText = data;
  if (
    data ==
    "Final Answer: Nothing was detected. Try highlighting text with your mouse then using the solve highlight button."
  ) {
    solveAllSelected = false;
    // Update processing state in storage
    chrome.storage.local.set({ processingQuestion: false });
  }
  fullLink.addEventListener("click", () => {
    if (full.style.display == "none") {
      full.style.display = "flex";
    } else {
      full.style.display = "none";
    }
  });

  if (solveAllSelected == true) {
    const output = document.querySelector(".text");

    const load = document.querySelector(".spinner");
    function showSpinner() {
      output.innerText = "";
      load.style.display = "block";

      // Set processing state to true when showing spinner
      chrome.storage.local.set({ processingQuestion: true });
    }
    if (data) {
      setTimeout(showSpinner, 2000);
    } else {
      showSpinner();
    }

    button.style.display = "none";
    solveAll.style.display = "none";
    solveSelected.style.display = "none";
    deepThinkButton.style.display = "none";

    // ADD THIS LINE to ensure stop solving button stays visible
    stopSolvingButton.style.display = "block";
  }
}

const button = document.querySelector("button#solve");
const solveAll = document.querySelector("button#solveAll");
const solveSelected = document.querySelector("button#solveSelected");

function updateButtonsVisibility(hide) {
  const button = document.querySelector("button#solve");
  const solveAll = document.querySelector("#solveAll");
  const solveSelected = document.querySelector("#solveSelected");
  const deepThinkButton = document.querySelector("#deepThink");
  const deepThinkStatus = document.querySelector(".deep-think-status");
  const stopSolvingButton = document.querySelector("#stopSolving");

  button.style.display = hide ? "none" : "block";
  solveAll.style.display = hide ? "none" : "block";
  solveSelected.style.display = hide ? "none" : "block";
  deepThinkButton.style.display = hide ? "none" : "block";

  // Show stop solving button only when other buttons are hidden (i.e., during solving)
  stopSolvingButton.style.display = hide ? "block" : "none";

  if (deepThinkButton.classList.contains("selected")) {
    deepThinkStatus.style.display = hide ? "block" : "none";
  } else {
    deepThinkStatus.style.display = "none";
  }
}

button.addEventListener("click", async function () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlPattern = /^https:\/\/(?:[^\/]+\.)?pearson\.com\//;

  if (!urlPattern.test(tab.url)) {
    chrome.runtime.sendMessage({
      action: "updatePopup",
      data: "Final Answer: This extension only works on Pearson MyLab. Please go to https://mylab.pearson.com/ to use.",
    });
    return; // Exit if the URL doesn't match
  }
  solveAllSelected = false;

  // Set processing state to true
  chrome.storage.local.set({ processingQuestion: true });

  updateButtonsVisibility(true);
  const output = document.querySelector(".text");
  output.innerText = "";

  const load = document.querySelector(".spinner");
  load.style.display = "block";

  const fullLink = document.querySelector(".fullResponse");

  const full = document.querySelector(".gptResponse");

  fullLink.removeEventListener("click", () => {
    full.style.display = "flex";
  });
  fullLink.style.display = "none";
  full.style.display = "none";
});

solveAll.addEventListener("click", async function () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlPattern = /^https:\/\/(?:[^\/]+\.)?pearson\.com\//;

  if (!urlPattern.test(tab.url)) {
    chrome.runtime.sendMessage({
      action: "updatePopup",
      data: "Final Answer: This extension only works on Pearson MyLab. Please go to https://mylab.pearson.com/ to use.",
    });
    return; // Exit if the URL doesn't match
  }
  solveAllSelected = true;
  chrome.storage.local.set({
    processingQuestion: true,
    solveAllSelected: true,
  });
  updateButtonsVisibility(true);
  const output = document.querySelector(".text");
  output.innerText = "";

  const load = document.querySelector(".spinner");
  load.style.display = "block";

  const fullLink = document.querySelector(".fullResponse");

  const full = document.querySelector(".gptResponse");

  fullLink.removeEventListener("click", () => {
    full.style.display = "flex";
  });
  fullLink.style.display = "none";
  full.style.display = "none";
});

solveSelected.addEventListener("click", async function () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlPattern = /^https:\/\/(?:[^\/]+\.)?pearson\.com\//;

  if (!urlPattern.test(tab.url)) {
    chrome.runtime.sendMessage({
      action: "updatePopup",
      data: "Final Answer: This extension only works on Pearson MyLab. Please go to https://mylab.pearson.com/ to use.",
    });
    return; // Exit if the URL doesn't match
  }
  solveAllSelected = false;
  chrome.storage.local.set({ processingQuestion: true });
  updateButtonsVisibility(true);
  const output = document.querySelector(".text");
  output.innerText = "";

  const load = document.querySelector(".spinner");
  load.style.display = "block";

  const fullLink = document.querySelector(".fullResponse");

  const full = document.querySelector(".gptResponse");

  fullLink.removeEventListener("click", () => {
    full.style.display = "flex";
  });
  fullLink.style.display = "none";
  full.style.display = "none";
});

// Grab elements
const logInButton = document.querySelector(".log-in");
const logOutButton = document.querySelector(".log-out");
const popupOverlay = document.querySelector(".popup-overlay");
const closeButton = document.querySelector(".close-popup");
const loginForm = document.getElementById("loginForm");
const signUpButton = document.querySelector(".sign-up-button");
// popup.js
logInButton.addEventListener("click", () => {
  popupOverlay.style.display = "flex"; // or "block", depending on your styling
});
logOutButton.addEventListener("click", () => {
  chrome.storage.local.clear(() => {
    if (chrome.runtime.lastError) {
      console.error("Error clearing local storage:", chrome.runtime.lastError);
    } else {
      console.log("chrome.storage.local cleared successfully!");
    }
  });
  window.location.reload();
  alert("Logged out succesfully");
});

chrome.storage.local.get(["token"], (result) => {
  if (result.token) {
    // If a token exists, hide the Login button
    logInButton.style.display = "none";
    logOutButton.style.display = "block";
    signUpButton.style.display = "none";
  } else {
    // No token found => show the Login button
    logInButton.style.display = "block";
    logOutButton.style.display = "none";
    signUpButton.style.display = "block";
  }
});
// When user clicks "Log In" => Show the pop-up

// When user clicks the "Close" button => Hide the pop-up
closeButton.addEventListener("click", () => {
  popupOverlay.style.display = "none";
});

// On form submission => handle the data, then hide pop-up
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;

  try {
    // Example in popup.js (after login is successful)
    fetch("https://gptbackend-production-7f4a.up.railway.app/log-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        if (!res.ok) {
          // maybe handle 401 or 500
          const errorData = await res.json();
          alert("Incorect username or password");
          throw new Error(errorData.message || "Request failed");
        }
        return res.json();
      })
      .then((data) => {
        chrome.storage.local.set({ token: data.token }, () => {
          console.log("Token stored in chrome.storage.local");
          alert("You are now logged in!");
          window.location.reload();
        });
      })
      .catch(console.error);
  } catch (error) {
    const successMessage = document.querySelector("#successMessage");
    successMessage.textContent = error;
    successMessage.style.display = "block";
  }
  popupOverlay.style.display = "none";
});

// Deep Think button functionality

document.getElementById("deepThink").addEventListener("click", function () {
  this.classList.toggle("selected");
  const isSelected = this.classList.contains("selected");

  // Store the selection state and update Solve All button state
  chrome.storage.local.set({ deepThinkEnabled: isSelected }, () => {
    const solveAllButton = document.getElementById("solveAll");
    if (solveAllButton) {
      solveAllButton.classList.toggle("disabled-button", isSelected);
      solveAllButton.setAttribute(
        "data-tooltip",
        isSelected
          ? "Disabled while Deep Think is enabled"
          : "Solve all questions sequentially"
      );
    }
  });
});

// Check stored state on popup open
document.addEventListener("DOMContentLoaded", function () {
  const deepThinkButton = document.getElementById("deepThink");
  const solveAllButton = document.getElementById("solveAll");
  const output = document.querySelector(".text");
  const spinner = document.querySelector(".spinner");
  const fullLink = document.querySelector(".fullResponse");
  const fullResponse = document.querySelector(".gptResponse");

  // Check for processing state and last response
  chrome.storage.local.get(
    [
      "processingQuestion",
      "deepThinkEnabled",
      "lastResponse",
      "solveAllSelected",
    ],
    function (result) {
      // Handle Deep Think button state
      if (result.deepThinkEnabled) {
        deepThinkButton.classList.add("selected");
        if (solveAllButton) {
          solveAllButton.classList.add("disabled-button");
          solveAllButton.setAttribute(
            "data-tooltip",
            "Disabled while Deep Think is enabled"
          );
        }
      }

      // Restore solveAllSelected state from storage
      solveAllSelected = result.solveAllSelected || false;

      // If we have a stored response, display it
      if (result.lastResponse) {
        updatePopupUI(result.lastResponse);

        // Only clear the response if it's a final answer and not in solve all mode
        if (
          result.lastResponse.includes("Final Answer:") &&
          !result.solveAllSelected
        ) {
          chrome.storage.local.remove("lastResponse");
          chrome.storage.local.set({ processingQuestion: false });
        }
      }
      // If we're still processing with no response, show spinner
      else if (result.processingQuestion) {
        updateButtonsVisibility(true);
        output.innerText = "";
        spinner.style.display = "block";
        fullLink.style.display = "none";
        fullResponse.style.display = "none";

        // Make sure the stop button is visible
        const stopSolvingButton = document.getElementById("stopSolving");
        stopSolvingButton.style.display = "block";
      }
    }
  );

  // Add event listener for Stop Solving button
  const stopSolvingButton = document.getElementById("stopSolving");
  if (stopSolvingButton) {
    stopSolvingButton.addEventListener("click", function () {
      console.log("Stop solving button clicked");

      // Reset the local flag immediately
      solveAllSelected = false;

      // First, get the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs[0] && tabs[0].id) {
          // Send message to content script to stop solving
          chrome.tabs.sendMessage(tabs[0].id, { action: "stopSolving" });
        }
      });

      // Notify background script
      chrome.runtime.sendMessage({
        action: "solvingStopped",
      });

      // Reset UI state locally
      chrome.storage.local.set({
        processingQuestion: false,
        solveAllSelected: false,
      });

      // Update UI immediately
      const spinner = document.querySelector(".spinner");
      if (spinner) spinner.style.display = "none";

      const output = document.querySelector(".text");
      if (output) output.innerText = "Solving stopped";

      const fullLink = document.querySelector(".fullResponse");
      if (fullLink) fullLink.style.display = "none";

      // Directly set the button visibility rather than using updateButtonsVisibility
      const solveButton = document.querySelector("button#solve");
      const solveAllButton = document.querySelector("#solveAll");
      const solveSelectedButton = document.querySelector("#solveSelected");
      const deepThinkButton = document.querySelector("#deepThink");

      if (solveButton) solveButton.style.display = "block";
      if (solveAllButton) solveAllButton.style.display = "block";
      if (solveSelectedButton) solveSelectedButton.style.display = "block";
      if (deepThinkButton) deepThinkButton.style.display = "block";
      if (stopSolvingButton) stopSolvingButton.style.display = "none";

      console.log("Solving process stopped");
    });
  }
});
