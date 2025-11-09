const processPromptText = require("./app.js");

(function () {
    const containerSelector = ".ms-auto.flex.items-center.gap-1\\.5";

    function addIcon() {
        var ignoreList;
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
                const getURL = chrome?.runtime?.getURL
                    ? chrome.runtime.getURL
                    : browser?.runtime?.getURL
                    ? browser.runtime.getURL
                    : (p) => p;

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
            <div class="header-buttons">
              <button id="acceptAllBtn" class="accept-all-btn">Accept All</button>
              <button id="closePopup">
                <svg class="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z"/></svg>
              </button>
            </div>
          </div>
          <div id="suggestionsList" class="suggestions-list"></div>
        `;
        document.body.appendChild(popup);

        // Example suggestions (replace with your analysis logic)
        const sampleSuggestions = [
            {
                type: "Spellcheck",
                before: "recieve",
                after: "receive",
                tokensSaved: 1,
            },
            {
                type: "Replacement",
                before: "utilize",
                after: "use",
                tokensSaved: 1,
            },
            {
                type: "Spellcheck",
                before: "definately",
                after: "definitely",
                tokensSaved: 1,
            },
        ];

        // Store current suggestions array for accept/reject handlers
        let currentSuggestions = [];
        // Store current prompt text for applying changes
        let currentPromptText = "";

        // Get storage API (Chrome or Firefox)
        function getStorage() {
            return chrome?.storage?.sync || browser?.storage?.sync;
        }

        // Function to add tokens saved to Chrome extension storage
        function addTokensSaved(tokens) {
            const storage = getStorage();
            if (!storage) {
                console.warn("Storage API not available");
                return;
            }

            // Get current total tokens saved
            storage.get(["tokensSaved"], (result) => {
                const currentTotal = result.tokensSaved || 0;
                const newTotal = currentTotal + tokens;

                // Update storage with new total
                storage.set({ tokensSaved: newTotal }, () => {
                    if (chrome?.runtime?.lastError) {
                        console.error(
                            "Error saving tokens:",
                            chrome.runtime.lastError
                        );
                    } else {
                        console.log(
                            `Added ${tokens} tokens. Total saved: ${newTotal}`
                        );
                    }
                });
            });
        }

        // Function to get current prompt text from textarea
        function getPromptText() {
            const ps = document.querySelectorAll("#prompt-textarea p");
            return Array.from(ps)
                .map((p) => p.textContent.trim())
                .join("\n");
        }

        // Function to update prompt textarea with new text
        function updatePromptText(newText) {
            const textarea = document.querySelector("#prompt-textarea");
            if (!textarea) return;

            // Split text by newlines and create <p> elements
            const lines = newText.split("\n");
            textarea.innerHTML = "";
            lines.forEach((line) => {
                const p = document.createElement("p");
                p.textContent = line;
                textarea.appendChild(p);
            });

            // Trigger input event to notify any listeners
            const inputEvent = new Event("input", { bubbles: true });
            textarea.dispatchEvent(inputEvent);
        }

        // Function to accept all suggestions at once
        function acceptAllSuggestions() {
            if (currentSuggestions.length === 0) {
                console.log("No suggestions to accept");
                return;
            }

            // Create a copy of suggestions to apply (since currentSuggestions gets regenerated)
            const suggestionsToApply = [...currentSuggestions];
            let totalTokensSaved = 0;

            // Apply all suggestions in order without refreshing between each
            suggestionsToApply.forEach((suggestion) => {
                // Apply the suggestion without refreshing (pass false)
                applySuggestion(suggestion, false);

                // Accumulate tokens saved
                if (suggestion.tokensSaved && suggestion.tokensSaved > 0) {
                    totalTokensSaved += suggestion.tokensSaved;
                }
            });

            // Add all tokens saved to Chrome extension storage at once
            if (totalTokensSaved > 0) {
                addTokensSaved(totalTokensSaved);
            }

            // Clear the suggestions list UI
            const list = popup.querySelector("#suggestionsList");
            list.innerHTML = "";

            // Refresh suggestions list once at the end with all changes applied
            initSuggestionList();
        }

        // Function to apply a suggestion change to the prompt
        function applySuggestion(suggestion, shouldRefresh = true) {
            const currentText = getPromptText();

            // Escape special regex characters in the before text
            const escapedBefore = suggestion.before.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            // Create a regex that matches the before text as a whole word/phrase
            // Use word boundaries for single words, or exact match for phrases
            // Note: No 'g' flag - only replace the first occurrence
            let regex;
            if (/\s/.test(suggestion.before)) {
                // For phrases (containing spaces), match exactly
                regex = new RegExp(escapedBefore.replace(/\s+/g, "\\s+"), "i");
            } else {
                // For single words, use word boundaries
                regex = new RegExp("\\b" + escapedBefore + "\\b", "i");
            }

            // Replace only the first occurrence
            const newText = currentText.replace(regex, (match) => {
                // Preserve the original case pattern if possible
                if (match === match.toUpperCase()) {
                    return suggestion.after.toUpperCase();
                } else if (match[0] === match[0].toUpperCase()) {
                    return (
                        suggestion.after.charAt(0).toUpperCase() +
                        suggestion.after.slice(1)
                    );
                }
                return suggestion.after;
            });

            // Refresh suggestions list only if requested (skip when accepting all)
            if (shouldRefresh) {
                initSuggestionList();
            }
        }

        // Populate popup with suggestions
        function populateSuggestions(suggestions) {
            //Store suggestions for use in accept/reject handlers
            // console.log("suggs", suggestions);
            // console.log("ignorelist", ignoreList);
            currentSuggestions = suggestions.filter((s) => {
                return !ignoreList.some(
                    (ignored) =>
                        ignored.before == s.before && ignored.after == s.after
                );
            });

            // Show/hide Accept All button based on suggestions
            const acceptAllBtn = popup.querySelector("#acceptAllBtn");
            if (acceptAllBtn) {
                acceptAllBtn.style.display =
                    currentSuggestions.length > 0 ? "block" : "none";
            }

            if (currentSuggestions.length == 0) {
                const list = popup.querySelector("#suggestionsList");
                const messageDiv = document.createElement("div");
                messageDiv.className = "no-suggestions-message";
                messageDiv.textContent = "Your prompt looks great!";
                list.appendChild(messageDiv);
            } else {
                //currentSuggestions = suggestions;
                // Store current prompt text
                currentPromptText = getPromptText();
                const list = popup.querySelector("#suggestionsList");
                list.innerHTML = "";
                currentSuggestions.forEach((s, i) => {
                    const div = document.createElement("div");
                    div.className = "suggestion";
                    div.innerHTML = `
                <div class="suggestion-type">${s.type}</div>
                <div class="suggestion-body">
                  <div class="suggestion-text suggestion-before">${s.before}</div>
                  <div class="suggestion-arrow">→</div>
                  <div class="suggestion-text suggestion-after">${s.after}</div>
                </div>
                <div class="suggestion-savings">Tokens Saved: ${s.tokensSaved}</div>
                <div class="suggestion-buttons">
                  <button class="accept-btn" data-i="${i}">
                    <svg class="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z"/></svg>
                  </button>
                  <button class="reject-btn" data-i="${i}">
                    <svg class="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z"/></svg>
                  </button>
                </div>
              `;
                    list.appendChild(div);
                });
            }
        }
        const initSuggestionList = () => {
          const list = popup.querySelector("#suggestionsList");
            while (list.firstChild) {
              list.removeChild(list.firstChild);
            }

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
            ignoreList = [];
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
            var target = e.target;
            if (target.matches("#closePopup")) {
                popup.classList.add("hidden");
                console.log("Suggestions popup closed");
                const list = popup.querySelector("#suggestionsList");
                while (list.firstChild) {
                    list.removeChild(list.firstChild);
                }
                return;
            } else if (target.classList.contains("accept-btn")) {
                const idx = target.dataset.i;
                const suggestion = currentSuggestions[idx];
                console.log("Accepted:", suggestion);

                // Apply the suggestion to the prompt text
                applySuggestion(suggestion);

                // Add tokens saved to Chrome extension storage
                if (suggestion.tokensSaved && suggestion.tokensSaved > 0) {
                    addTokensSaved(suggestion.tokensSaved);
                }

                // Remove the suggestion from the UI
                target.closest(".suggestion").remove();

                // Remove from currentSuggestions array
                currentSuggestions.splice(idx, 1);

                // Update indices in remaining suggestions
                const list = popup.querySelector("#suggestionsList");
                const remainingSuggestions =
                    list.querySelectorAll(".suggestion");
                remainingSuggestions.forEach((suggestionEl, newIdx) => {
                    const acceptBtn = suggestionEl.querySelector(".accept-btn");
                    const rejectBtn = suggestionEl.querySelector(".reject-btn");
                    if (acceptBtn) acceptBtn.dataset.i = newIdx;
                    if (rejectBtn) rejectBtn.dataset.i = newIdx;
                });
            } else if (target.classList.contains("reject-btn")) {
                const idx = target.dataset.i;
                const suggestion = currentSuggestions[idx];
                console.log("Rejected:", suggestion);
                target.closest(".suggestion").remove();
                // Remove the suggestion from the UI
                target.closest(".suggestion").remove();

                // Remove from currentSuggestions array
                currentSuggestions.splice(idx, 1);

                // Update indices in remaining suggestions
                const list = popup.querySelector("#suggestionsList");
                const remainingSuggestions =
                    list.querySelectorAll(".suggestion");
                remainingSuggestions.forEach((suggestionEl, newIdx) => {
                    const acceptBtn = suggestionEl.querySelector(".accept-btn");
                    const rejectBtn = suggestionEl.querySelector(".reject-btn");
                    if (acceptBtn) acceptBtn.dataset.i = newIdx;
                    if (rejectBtn) rejectBtn.dataset.i = newIdx;
                });

                ignoreList.push(suggestion);
                console.log("ignoreList:", ignoreList);

                //if currentSuggestions is now empty, display "thats all of our suggestions"
                if (currentSuggestions.length === 0) {
                    const list = popup.querySelector("#suggestionsList");
                    const messageDiv = document.createElement("div");
                    messageDiv.className = "no-suggestions-message";
                    messageDiv.textContent = "That is all of our suggestions.";
                    list.appendChild(messageDiv);
                }

                return;
            } else if (target.matches("#acceptAllBtn")) {
                console.log("Accept All clicked");
                acceptAllSuggestions();
                return;
            } else if (target.classList.contains("accept-btn")) {
                e.stopPropagation();
                return;
            }
        });

        //listen for clicks outside of popup, close popup
        // document.addEventListener("click", (e) => {
        //   const clickedInsidePopup = popup.contains(e.target);
        //   const clickedButton = e.target === icon;

        //   if (!clickedInsidePopup && !clickedButton) {
        //     popup.classList.add("hidden");
        //   }
        // });

        container.insertBefore(icon, container.firstChild);
        console.log("✅ Circular icon added");

        const waitForTextBox = setInterval(() => {
          const textBox = document.querySelector("#prompt-textarea");
          let typingTimeout;

          function handleTextChange() {
            const ps = textBox.querySelectorAll("p");
            const combinedText = Array.from(ps).map(p => p.innerText).join("\n");

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
              initSuggestionList();
            }, 1000);
          }


          if (textBox) {
            clearInterval(waitForTextBox);

            
            textBox.addEventListener("input", handleTextChange);
            textBox.addEventListener("keydown", (e) => {
              if (e.key === "Backspace" || e.key === "Delete") {
                handleTextChange();
              }
            });

          }
        }, 200);

    }

    // Run initially
    addIcon();

    // Re-add if container is rebuilt dynamically
    const observer = new MutationObserver(() => addIcon());
    observer.observe(document.body, { childList: true, subtree: true });
})();
