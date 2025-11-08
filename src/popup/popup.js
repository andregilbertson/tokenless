document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  // Example settings inputs
  const colorInput = document.getElementById("color");
  const enabledCheckbox = document.getElementById("enabled");

  // Load saved settings
  chrome.storage.sync.get(["buttonColor", "isEnabled"], (data) => {
    colorInput.value = data.buttonColor || "#4a90e2";
    enabledCheckbox.checked = data.isEnabled ?? true;
  });

  // Save settings when button clicked
  saveBtn.addEventListener("click", () => {
    const settings = {
      buttonColor: colorInput.value,
      isEnabled: enabledCheckbox.checked,
    };

    chrome.storage.sync.set(settings, () => {
      updateStatus("✅ Settings saved!");
      setTimeout(() => updateStatus(""), 1500);
    });
  });

  function updateStatus(message) {
    status.textContent = message;
  }
});
