document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  // Inputs
  const colorInput = document.getElementById("color");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const aggressivenessInput = document.getElementById("aggressiveness");
  const removeFillerCheckbox = document.getElementById("removeFiller");
  const simplifySentencesCheckbox = document.getElementById("simplifySentences");

  // Load saved settings
  chrome.storage.sync.get(
    ["buttonColor", "darkMode", "aggressiveness", "removeFiller", "simplifySentences"],
    (data) => {
      const color = data.buttonColor || "#4a90e2";
      const isDark = data.darkMode ?? false;

      // Set input values
      colorInput.value = color;
      darkModeToggle.checked = isDark;
      aggressivenessInput.value = data.aggressiveness ?? 2;

      // Apply styles
      document.documentElement.style.setProperty("--button-color", color);
      applyTheme(isDark);
    }
  );

  // Save settings
  saveBtn.addEventListener("click", () => {
    const settings = {
      buttonColor: colorInput.value,
      darkMode: darkModeToggle.checked,
      aggressiveness: parseInt(aggressivenessInput.value)
    };

    chrome.storage.sync.set(settings, () => {
      document.documentElement.style.setProperty("--button-color", settings.buttonColor);
      applyTheme(settings.darkMode);
      updateStatus("✅ Settings saved!");
      setTimeout(() => updateStatus(""), 1500);
    });
  });

  // Live updates (optional)
  colorInput.addEventListener("input", (e) => {
    document.documentElement.style.setProperty("--button-color", e.target.value);
  });

  darkModeToggle.addEventListener("change", (e) => {
    applyTheme(e.target.checked);
  });

  function applyTheme(isDark) {
    if (isDark) {
      document.documentElement.style.setProperty("--bg-color", "#1e1e1e");
      document.documentElement.style.setProperty("--text-color", "#f1f1f1");
    } else {
      document.documentElement.style.setProperty("--bg-color", "#ffffff");
      document.documentElement.style.setProperty("--text-color", "#111111");
    }
  }

  function updateStatus(message) {
    status.textContent = message;
  }
});
