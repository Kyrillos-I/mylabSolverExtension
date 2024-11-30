// popup.js
document.getElementById("solve").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "rerunContentScript" });
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
  button.style.display = "block";
}

const button = document.querySelector("button");
button.addEventListener("click", function () {
  const output = document.querySelector(".text");
  output.innerText = "";

  const load = document.querySelector(".spinner");
  load.style.display = "block";

  button.style.display = "none";
});
