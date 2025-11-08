(function () {
  const containerSelector = ".ms-auto.flex.items-center.gap-1\\.5";

  function addIcon() {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.log('failed container');
      return;
    }

    // Don't add multiple icons
    if (container.querySelector(".custom-icon")) return;

    const icon = document.createElement("div");
    icon.className = "custom-icon";
    icon.textContent = "✨"; // or use an <img> or <svg> inside
    icon.title = "Magic Icon";

    // Click event (currently blank)
    icon.addEventListener("click", () => {
      // TODO: fill in functionality
      console.log("Icon clicked!");
    });

    container.insertBefore(icon, container.firstChild);
    console.log("✅ Circular icon added");
  }

  // Run initially
  addIcon();

  // Re-add if container is rebuilt dynamically
  const observer = new MutationObserver(() => addIcon());
  observer.observe(document.body, { childList: true, subtree: true });
})();
