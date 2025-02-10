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
  }
});

function updatePopupUI(data) {
  // Implement UI update logic here
  const output = document.querySelector(".text");
  const keyword = "Final Answer: ";
  const answer = data.substring(data.indexOf(keyword) + keyword.length);

  const load = document.querySelector(".spinner");
  load.style.display = "none";

  output.innerText = answer;

  const button = document.querySelector("button");
  const solveAll = document.querySelector("#solveAll");
  const solveSelected = document.querySelector("#solveSelected");
  button.style.display = "block";
  solveAll.style.display = "block";
  solveSelected.style.display = "block";

  const fullLink = document.querySelector(".fullResponse");
  fullLink.style.display = "block";

  const full = document.querySelector(".gptResponse");
  full.innerText = data;

  fullLink.addEventListener("click", () => {
    if (full.style.display == "none") {
      full.style.display = "flex";
    } else {
      full.style.display = "none";
    }
  });

  if (solveAllSelected == true) {
    const output = document.querySelector(".text");
    output.innerText = "";

    const load = document.querySelector(".spinner");
    load.style.display = "block";

    button.style.display = "none";
    solveAll.style.display = "none";
    solveSelected.style.display = "none";

    const fullLink = document.querySelector(".fullResponse");

    const full = document.querySelector(".gptResponse");

    fullLink.removeEventListener("click", () => {
      full.style.display = "flex";
    });
    fullLink.style.display = "none";
    full.style.display = "none";
  }
}

const button = document.querySelector("button#solve");
const solveAll = document.querySelector("button#solveAll");
const solveSelected = document.querySelector("button#solveSelected");
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
  const output = document.querySelector(".text");
  output.innerText = "";

  const load = document.querySelector(".spinner");
  load.style.display = "block";

  button.style.display = "none";
  solveAll.style.display = "none";
  solveSelected.style.display = "none";

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
  const output = document.querySelector(".text");
  output.innerText = "";

  const load = document.querySelector(".spinner");
  load.style.display = "block";

  button.style.display = "none";
  solveAll.style.display = "none";
  solveSelected.style.display = "none";

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
  const output = document.querySelector(".text");
  output.innerText = "";

  const load = document.querySelector(".spinner");
  load.style.display = "block";

  button.style.display = "none";
  solveAll.style.display = "none";
  solveSelected.style.display = "none";

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
          throw new Error(errorData.message || "Request failed");
        }
        return res.json();
      })
      .then((data) => {
        chrome.storage.local.set({ token: data.token }, () => {
          console.log("Token stored in chrome.storage.local");

          const successMessage = document.querySelector("#successMessage");
          successMessage.textContent = "You are now logged in!";
          successMessage.style.display = "block";
          window.location.reload();
        });
      })
      .catch(console.error);
  } catch (error) {
    console.error(error);
  }
  popupOverlay.style.display = "none";
});
