// popup.js
let solveAllSelected = false;
document.getElementById("solve").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "rerunContentScript" });
  }
});
document.getElementById("solveAll").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "solveAllContentScript" });
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
  button.style.display = "block";
  solveAll.style.display = "block";

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
button.addEventListener("click", function () {
  solveAllSelected = false;
  const output = document.querySelector(".text");
  output.innerText = "";

  const load = document.querySelector(".spinner");
  load.style.display = "block";

  button.style.display = "none";
  solveAll.style.display = "none";

  const fullLink = document.querySelector(".fullResponse");

  const full = document.querySelector(".gptResponse");

  fullLink.removeEventListener("click", () => {
    full.style.display = "flex";
  });
  fullLink.style.display = "none";
  full.style.display = "none";
});
solveAll.addEventListener("click", function () {
  solveAllSelected = true;
  const output = document.querySelector(".text");
  output.innerText = "";

  const load = document.querySelector(".spinner");
  load.style.display = "block";

  button.style.display = "none";
  solveAll.style.display = "none";

  const fullLink = document.querySelector(".fullResponse");

  const full = document.querySelector(".gptResponse");

  fullLink.removeEventListener("click", () => {
    full.style.display = "flex";
  });
  fullLink.style.display = "none";
  full.style.display = "none";
});
