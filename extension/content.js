// import { processPromptText } from "./app.js";

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
      const ps = document.querySelectorAll("#prompt-textarea p");
      const promptText = Array.from(ps).map(p => p.textContent.trim()).join("\n");
      console.log("Prompt Text:", promptText);

      // processPromptText(promptText); // <- call your logic
      // Tags you want to extract text from
    const TAGS = ["div", "p", "strong", "code"];

    const articles = document.querySelectorAll("article");

    const chatText = Array.from(articles).map(article => {
      const role = article.getAttribute("data-role") || "unknown";

      // Collect text from all desired tags inside the article
      const text = Array.from(article.querySelectorAll(TAGS.join(",")))
        .map(el => el.innerText.trim())
        .filter(Boolean) // remove empty strings
        .join("\n");

      return { role, text };
    })
    .filter((chat)=> chat.text != "");

    console.log(chatText);

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
