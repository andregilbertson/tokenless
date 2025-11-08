var processPromptText = require("./app.js");
var spellCheckUI = require("./spellcheck-ui.js").spellCheckUI;

(function () {
    var containerSelector = ".ms-auto.flex.items-center.gap-1\\.5";

    function addIcon() {
        var container = document.querySelector(containerSelector);
        if (!container) {
            console.log("failed container");
            return;
        }

        // Don't add multiple icons
        if (container.querySelector(".custom-icon")) return;

        var icon = document.createElement("div");
        icon.className = "custom-icon";
        icon.textContent = "✨"; // or use an <img> or <svg> inside
        icon.title = "Magic Icon";

        // Click event (currently blank)
        icon.addEventListener("click", function() {
            // TODO: fill in functionality
            console.log("Icon clicked!");
            var ps = document.querySelectorAll("#prompt-textarea p");
            var promptText = Array.from(ps)
                .map(function(p) { return p.textContent.trim(); })
                .join("\n");
            console.log("Prompt Text:", promptText);

            processPromptText(promptText); // <- call your logic
            // Tags you want to extract text from
            var TAGS = ["div", "p", "strong", "code"];

            var articles = document.querySelectorAll("article");

            var chatText = Array.from(articles)
                .map(function(article) {
                    var role = article.getAttribute("data-role") || "unknown";

                    // Collect text from all desired tags inside the article
                    var text = Array.from(
                        article.querySelectorAll(TAGS.join(","))
                    )
                        .map(function(el) { return el.innerText.trim(); })
                        .filter(Boolean) // remove empty strings
                        .join("\n");

                    return { role: role, text: text };
                })
                .filter(function(chat) { return chat.text != ""; });

            console.log(chatText);
        });

        container.insertBefore(icon, container.firstChild);
        console.log("✅ Circular icon added");
    }

    // Initialize spellcheck UI
    var initSpellCheckAttempted = false;
    var initSpellCheckTimer = null;
    
    function initSpellCheck() {
        // Don't try if already initialized or attempt in progress
        if (spellCheckUI.initialized || initSpellCheckAttempted) {
            return;
        }
        
        // Try multiple selectors for ChatGPT's textarea
        // Prioritize contenteditable divs (ChatGPT's actual input) over textareas
        var selectors = [
            '#prompt-textarea',
            '[contenteditable="true"][data-id="root"]',
            'div[contenteditable="true"][role="textbox"]',
            'div[contenteditable="true"]',
            'textarea[placeholder*="Message"]:not(._fallbackTextarea_)',
            'textarea:not(._fallbackTextarea_):not([class*="fallback"])'
        ];

        // Try to find the textarea and initialize spellcheck
        for (var i = 0; i < selectors.length; i++) {
            var selector = selectors[i];
            var textarea = document.querySelector(selector);
            if (textarea) {
                // Skip fallback/hidden textareas
                var className = textarea.className || '';
                var isFallback = className.indexOf('fallback') !== -1 || 
                                className.indexOf('_fallbackTextarea_') !== -1;
                
                // Skip hidden elements
                var isHidden = textarea.offsetParent === null || 
                              textarea.style.display === 'none' ||
                              textarea.style.visibility === 'hidden';
                
                // For contenteditable, check if it's actually visible and usable
                var isContentEditable = textarea.contentEditable === 'true' || textarea.isContentEditable;
                if (isContentEditable) {
                    var rect = textarea.getBoundingClientRect();
                    if (rect.width < 10 || rect.height < 10) {
                        continue; // Skip tiny/hidden elements
                    }
                }
                
                if (!isFallback && !isHidden) {
                    console.log('✅ Found textarea with selector: ' + selector, 'tagName:', textarea.tagName, 'contentEditable:', textarea.contentEditable);
                    initSpellCheckAttempted = true;
                    spellCheckUI.init(selector).then(function() {
                        initSpellCheckAttempted = false;
                    }).catch(function(err) {
                        console.error('Failed to initialize spellcheck:', err);
                        initSpellCheckAttempted = false;
                    });
                    return;
                }
            }
        }

        // If not found, wait and try again (but only if not already attempting)
        if (!initSpellCheckAttempted) {
            if (initSpellCheckTimer) {
                clearTimeout(initSpellCheckTimer);
            }
            initSpellCheckTimer = setTimeout(initSpellCheck, 1000);
        }
    }

    // Run initially
    addIcon();
    initSpellCheck();

    // Re-add if container is rebuilt dynamically
    var observer = new MutationObserver(function() {
        addIcon();
        // Re-initialize spellcheck if textarea appears (debounced)
        if (!spellCheckUI.initialized && !initSpellCheckAttempted) {
            if (initSpellCheckTimer) {
                clearTimeout(initSpellCheckTimer);
            }
            initSpellCheckTimer = setTimeout(initSpellCheck, 500);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
