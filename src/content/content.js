const processPromptText = require("./app.js");

(function () {
    const containerSelector = ".ms-auto.flex.items-center.gap-1\\.5";

    function addIcon() {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.log("failed container");
            return;
        }

        // Don't add multiple icons
        if (container.querySelector(".custom-icon")) return;

        const icon = document.createElement("div");
        icon.className = "custom-icon unselectable";
        icon.title = "Magic Icon";
        // Inline the leaf SVG so it inherits color and hover effects
        (function loadLeafSvg() {
            try {
                const getURL =
                    (chrome?.runtime?.getURL
                        ? chrome.runtime.getURL
                        : browser?.runtime?.getURL
                        ? browser.runtime.getURL
                        : (p) => p);

                
                const svgUrl = getURL("../../icons/leaf-logo.svg");
        
                fetch(svgUrl)
                    .then((res) => res.text())
                    .then((svgText) => {
                        // Place SVG inside button
                        icon.innerHTML = svgText;
        
                        const svg = icon.querySelector("svg");
                        if (svg) {
                            // Remove massive width/height from SVGRepo
                            svg.removeAttribute("height");
                            svg.removeAttribute("width");
        
                            // Make the icon scale inside the circle
                            svg.style.width = "60%";
                            svg.style.height = "60%";
                        }
                    })
                    .catch(() => {
                        icon.textContent = "✨";
                    });
            } catch (err) {
                icon.textContent = "✨";
            }
        })();

        const popup = document.createElement("div");
        popup.id = "suggestionsPopup";
        popup.className = "popup hidden";
        popup.innerHTML = `
          <div class="popup-header">
            <h2>Suggestions</h2>
            <button id="closePopup">✖</button>
          </div>
          <div id="suggestionsList" class="suggestions-list"></div>
        `;
        document.body.appendChild(popup);

        // Example suggestions (replace with your analysis logic)
        const sampleSuggestions = [
          { type: "Spellcheck", before: "recieve", after: "receive", tokensSaved: 1},
          { type: "Replacement", before: "utilize", after: "use", tokensSaved: 1 },
          { type: "Spellcheck", before: "definately", after: "definitely", tokensSaved: 1 },
        ];

        // Populate popup with suggestions
        function populateSuggestions(suggestions) {
          const list = popup.querySelector("#suggestionsList");
          list.innerHTML = "";
          suggestions.forEach((s, i) => {
            const div = document.createElement("div");
            div.className = "suggestion";
            div.innerHTML = `
              <div class="suggestion-type">${s.type}</div>
              <div class="suggestion-text"><b>Before:</b> ${s.before}</div>
              <div class="suggestion-text"><b>After:</b> ${s.after}</div>
              <div class="suggestion-savings"><b>Tokens Saved:</b>${s.tokensSaved}</div>
              <div class="suggestion-buttons">
                <button class="accept-btn" data-i="${i}">✔</button>
                <button class="reject-btn" data-i="${i}">✖</button>
              </div>
            `;
            list.appendChild(div);
          });
        }
        const initSuggestionList = () => {
          const ps = document.querySelectorAll("#prompt-textarea p");
            const promptText = Array.from(ps)
                .map((p) => p.textContent.trim())
                .join("\n");
            console.log("Prompt Text:", promptText);

           processPromptText(promptText).then((suggs) => {
            console.log("got suggests", suggs);
            populateSuggestions(suggs);
            popup.classList.remove("hidden");
           });
        };

        
        // Click event (currently blank)
        icon.addEventListener("click", (e) => {
          e.stopPropagation();
            // TODO: fill in functionality
            console.log("Icon clicked!");
            initSuggestionList();
            
            // <- call your logic
            // Tags you want to extract text from
            // const TAGS = ["div", "p", "strong", "code"];

            // const articles = document.querySelectorAll("article");

            // const chatText = Array.from(articles)
            //     .map((article) => {
            //         const role = article.getAttribute("data-role") || "unknown";

            //         // Collect text from all desired tags inside the article
            //         const text = Array.from(
            //             article.querySelectorAll(TAGS.join(","))
            //         )
            //             .map((el) => el.innerText.trim())
            //             .filter(Boolean) // remove empty strings
            //             .join("\n");

            //         return { role, text };
            //     })
            //     .filter((chat) => chat.text != "");

            // console.log(chatText);
        });

        // popup.querySelector("#closePopup").addEventListener("click", () => {
        //   popup.classList.add("hidden");
        // });

        popup.addEventListener("click", (e) => {
          var target = e.target
          if (target.matches("#closePopup")) {
            popup.classList.add("hidden");
            console.log("Suggestions popup closed");
            return;
          }
          else if (target.classList.contains("accept-btn")) {
            const idx = target.dataset.i;
            console.log("Accepted:", sampleSuggestions[idx]);
            target.closest(".suggestion").remove();
          } else if (target.classList.contains("reject-btn")) {
            const idx = e.target.dataset.i;
            console.log("Rejected:", sampleSuggestions[idx]);
            target.closest(".suggestion").remove();
          }

          e.stopPropagation();
        });

        //listen for clicks outside of popup, close popup
        document.addEventListener("click", (e) => {
          const clickedInsidePopup = popup.contains(e.target);
          const clickedButton = e.target === icon;

          if (!clickedInsidePopup && !clickedButton) {
            popup.classList.add("hidden");
          }
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
