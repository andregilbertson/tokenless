// Popup script
document.addEventListener("DOMContentLoaded", () => {
    const actionBtn = document.getElementById("actionBtn");
    const getPromptBtn = document.getElementById("getPromptBtn");
    const getResponseBtn = document.getElementById("getResponseBtn");
    const status = document.getElementById("status");
    const textOutput = document.getElementById("textOutput");

    // Selectors
    const PROMPT_SELECTOR = "#prompt-textarea";

    // Load saved state
    chrome.storage.sync.get(["clickCount"], (result) => {
        const count = result.clickCount || 0;
        updateStatus(`Button clicked ${count} times`);
    });

    // Handle button click
    actionBtn.addEventListener("click", async () => {
        // Get current tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        // Increment click count
        chrome.storage.sync.get(["clickCount"], (result) => {
            const newCount = (result.clickCount || 0) + 1;
            chrome.storage.sync.set({ clickCount: newCount }, () => {
                updateStatus(`Button clicked ${newCount} times`);
            });
        });

        // Send message to content script
        chrome.tabs.sendMessage(
            tab.id,
            { action: "buttonClicked" },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.log("Content script not ready");
                }
            }
        );
    });

    // Handle get prompt button click (extract from #prompt-textarea)
    getPromptBtn.addEventListener("click", async () => {
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            // Check if we're on a valid web page
            if (
                !tab.url ||
                tab.url.startsWith("chrome://") ||
                tab.url.startsWith("chrome-extension://") ||
                tab.url.startsWith("edge://")
            ) {
                updateStatus(
                    "Error: Content scripts cannot run on this page. Please navigate to a regular web page."
                );
                textOutput.textContent = "";
                return;
            }

            // Try direct function injection first (most reliable)
            try {
                await injectPromptText(tab.id, PROMPT_SELECTOR);
            } catch (directError) {
                // If direct injection fails, try the content script approach
                console.log(
                    "Direct injection failed, trying content script approach:",
                    directError
                );

                // Try to send message to content script
                chrome.tabs.sendMessage(
                    tab.id,
                    {
                        action: "getPageText",
                        textType: "element",
                        selector: PROMPT_SELECTOR,
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            // Content script not loaded, try to inject it programmatically
                            console.log(
                                "Content script not found, injecting..."
                            );

                            // Inject and retry
                            injectAndRetryPrompt(tab.id, PROMPT_SELECTOR);
                            return;
                        }

                        handleTextResponse(response);
                    }
                );
            }
        } catch (error) {
            updateStatus("Error getting prompt text: " + error.message);
            console.error(error);
        }
    });

    // Handle get response button click (extract latest ChatGPT response)
    getResponseBtn.addEventListener("click", async () => {
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            // Check if we're on a valid web page
            if (
                !tab.url ||
                tab.url.startsWith("chrome://") ||
                tab.url.startsWith("chrome-extension://") ||
                tab.url.startsWith("edge://")
            ) {
                updateStatus(
                    "Error: Content scripts cannot run on this page. Please navigate to a regular web page."
                );
                textOutput.textContent = "";
                return;
            }

            // Try direct function injection first (most reliable)
            try {
                await injectChatGPTResponse(tab.id);
            } catch (directError) {
                // If direct injection fails, try the content script approach
                console.log(
                    "Direct injection failed, trying content script approach:",
                    directError
                );

                // Try to send message to content script
                chrome.tabs.sendMessage(
                    tab.id,
                    {
                        action: "getLatestChatGPTResponse",
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            // Content script not loaded, try to inject it programmatically
                            console.log(
                                "Content script not found, injecting..."
                            );

                            // Inject and retry
                            injectAndRetryResponse(tab.id);
                            return;
                        }

                        handleTextResponse(response);
                    }
                );
            }
        } catch (error) {
            updateStatus("Error getting response: " + error.message);
            console.error(error);
        }
    });

    // Function to inject and extract prompt text
    async function injectPromptText(tabId, selector) {
        // Check if scripting API is available
        if (!chrome.scripting || !chrome.scripting.executeScript) {
            throw new Error(
                "chrome.scripting API is not available. Please reload the extension after the manifest update."
            );
        }

        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (selectorParam) => {
                    try {
                        const element = document.querySelector(selectorParam);
                        if (!element) {
                            return {
                                text: "",
                                title: document.title || "",
                                url: window.location.href || "",
                                error: `Element not found: ${selectorParam}`,
                                elementInfo: `No element found matching: ${selectorParam}`,
                            };
                        }

                        // For input and textarea elements, get the value
                        let text = "";
                        if (
                            element.tagName === "INPUT" ||
                            element.tagName === "TEXTAREA"
                        ) {
                            text = element.value || "";
                        } else {
                            text =
                                element.innerText || element.textContent || "";
                        }

                        return {
                            text: text.trim(),
                            title: document.title || "",
                            url: window.location.href || "",
                            elementInfo: `Found element: ${selectorParam}`,
                        };
                    } catch (e) {
                        return {
                            text: "",
                            title: "",
                            url: window.location.href || "",
                            error: e.message,
                            elementInfo: "",
                        };
                    }
                },
                args: [selector],
            });

            if (results && results[0]) {
                if (results[0].result && results[0].result.error) {
                    throw new Error(results[0].result.error);
                }

                if (results[0].result) {
                    const data = results[0].result;

                    if (data.error) {
                        throw new Error(data.error);
                    }

                    handleTextResponse({
                        success: true,
                        text: data.text || "",
                        title: data.title || "",
                        url: data.url || "",
                        elementInfo: data.elementInfo || "",
                    });
                    return;
                }
            }

            throw new Error("No result from script execution");
        } catch (directError) {
            console.error("Direct injection error:", directError);
            await showErrorDetails(directError);
        }
    }

    // Function to inject and extract ChatGPT response
    async function injectChatGPTResponse(tabId) {
        // Check if scripting API is available
        if (!chrome.scripting || !chrome.scripting.executeScript) {
            throw new Error(
                "chrome.scripting API is not available. Please reload the extension after the manifest update."
            );
        }

        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    try {
                        // Find all assistant messages (ChatGPT responses)
                        let assistantMessages = Array.from(
                            document.querySelectorAll(
                                '[data-message-author-role="assistant"]'
                            )
                        );

                        if (assistantMessages.length === 0) {
                            assistantMessages = Array.from(
                                document.querySelectorAll(
                                    '.markdown.prose, .markdown-prose, [class*="markdown"]'
                                )
                            ).filter((el) => {
                                return (
                                    !el.closest("textarea") &&
                                    !el.closest("input")
                                );
                            });
                        }

                        if (assistantMessages.length === 0) {
                            assistantMessages = Array.from(
                                document.querySelectorAll(
                                    '.text-message, [class*="message"]'
                                )
                            ).filter((el) => {
                                const role =
                                    el.getAttribute(
                                        "data-message-author-role"
                                    ) ||
                                    el
                                        .closest("[data-message-author-role]")
                                        ?.getAttribute(
                                            "data-message-author-role"
                                        );
                                return role === "assistant";
                            });
                        }

                        if (assistantMessages.length === 0) {
                            return {
                                text: "",
                                title: document.title || "",
                                url: window.location.href || "",
                                error: "No ChatGPT assistant messages found on this page",
                                elementInfo:
                                    "Could not find assistant response messages",
                            };
                        }

                        const latestMessage =
                            assistantMessages[assistantMessages.length - 1];
                        const markdownContent = latestMessage.querySelector(
                            '.markdown, [class*="markdown"], .prose'
                        );
                        const textElement = markdownContent || latestMessage;

                        let text =
                            textElement.innerText ||
                            textElement.textContent ||
                            "";
                        text = text.trim().replace(/\n{3,}/g, "\n\n");

                        return {
                            text: text,
                            title: document.title || "",
                            url: window.location.href || "",
                            elementInfo: `Found latest assistant response (${assistantMessages.length} total messages)`,
                        };
                    } catch (e) {
                        return {
                            text: "",
                            title: "",
                            url: window.location.href || "",
                            error: e.message,
                            elementInfo: "",
                        };
                    }
                },
            });

            if (results && results[0]) {
                if (results[0].result && results[0].result.error) {
                    throw new Error(results[0].result.error);
                }

                if (results[0].result) {
                    const data = results[0].result;

                    if (data.error) {
                        throw new Error(data.error);
                    }

                    handleTextResponse({
                        success: true,
                        text: data.text || "",
                        title: data.title || "",
                        url: data.url || "",
                        elementInfo: data.elementInfo || "",
                    });
                    return;
                }
            }

            throw new Error("No result from script execution");
        } catch (directError) {
            console.error("Direct injection error:", directError);
            await showErrorDetails(directError);
        }
    }

    async function injectAndRetryPrompt(tabId, selector) {
        try {
            // First try: Inject the content script file
            try {
                // Check if scripting API is available
                if (!chrome.scripting || !chrome.scripting.executeScript) {
                    throw new Error(
                        "chrome.scripting API is not available. Please reload the extension."
                    );
                }

                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ["content.js"],
                });

                // Wait a bit for the script to initialize
                await new Promise((resolve) => setTimeout(resolve, 300));

                // Try to send message with timeout
                const messageResponse = await new Promise((resolve) => {
                    chrome.tabs.sendMessage(
                        tabId,
                        {
                            action: "getPageText",
                            textType: "element",
                            selector: selector,
                        },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                resolve({
                                    error: chrome.runtime.lastError.message,
                                });
                            } else {
                                resolve(response);
                            }
                        }
                    );
                });

                if (
                    messageResponse &&
                    !messageResponse.error &&
                    messageResponse.success
                ) {
                    handleTextResponse(messageResponse);
                    return;
                }

                // If message didn't work, try direct injection
                console.log("Message failed, trying direct injection");
                await injectPromptText(tabId, selector);
            } catch (fileError) {
                // File injection failed, try direct function injection
                console.log(
                    "File injection failed, trying direct function injection:",
                    fileError
                );
                await injectPromptText(tabId, selector);
            }
        } catch (injectError) {
            await showErrorDetails(injectError);
        }
    }

    async function injectAndRetryResponse(tabId) {
        try {
            // First try: Inject the content script file
            try {
                // Check if scripting API is available
                if (!chrome.scripting || !chrome.scripting.executeScript) {
                    throw new Error(
                        "chrome.scripting API is not available. Please reload the extension."
                    );
                }

                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ["content.js"],
                });

                // Wait a bit for the script to initialize
                await new Promise((resolve) => setTimeout(resolve, 300));

                // Try to send message with timeout
                const messageResponse = await new Promise((resolve) => {
                    chrome.tabs.sendMessage(
                        tabId,
                        {
                            action: "getLatestChatGPTResponse",
                        },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                resolve({
                                    error: chrome.runtime.lastError.message,
                                });
                            } else {
                                resolve(response);
                            }
                        }
                    );
                });

                if (
                    messageResponse &&
                    !messageResponse.error &&
                    messageResponse.success
                ) {
                    handleTextResponse(messageResponse);
                    return;
                }

                // If message didn't work, try direct injection
                console.log("Message failed, trying direct injection");
                await injectChatGPTResponse(tabId);
            } catch (fileError) {
                // File injection failed, try direct function injection
                console.log(
                    "File injection failed, trying direct function injection:",
                    fileError
                );
                await injectChatGPTResponse(tabId);
            }
        } catch (injectError) {
            await showErrorDetails(injectError);
        }
    }

    async function showErrorDetails(error) {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const url = tab?.url || "unknown";
        const errorMessage = error?.message || "Unknown error";

        // Check if the error is about scripting API
        const isScriptingError =
            errorMessage.includes("scripting") ||
            errorMessage.includes("executeScript");

        updateStatus(`Error: Cannot extract text from this page.`);

        let errorHtml = `
      <div class="text-info">
        <strong>Error Details:</strong><br>
        ${escapeHtml(errorMessage)}<br><br>
        <strong>Current URL:</strong> ${escapeHtml(url)}<br><br>
    `;

        if (isScriptingError) {
            errorHtml += `
        <strong style="color: #d93025;">⚠️ IMPORTANT: Extension needs to be reloaded!</strong><br><br>
        <strong>Steps to fix:</strong><br>
        1. Go to <code>chrome://extensions/</code><br>
        2. Find "Chrome Extension Boilerplate"<br>
        3. Click the <strong>reload icon</strong> (circular arrow) 🔄<br>
        4. Come back to this page and try again<br><br>
        <strong>Why this happened:</strong><br>
        The manifest.json was updated to add the "scripting" permission,<br>
        but the extension needs to be reloaded for the change to take effect.<br><br>
      `;
        } else {
            errorHtml += `
        <strong>Debug Info:</strong><br>
        • Error: ${escapeHtml(String(error))}<br>
        • Make sure the extension has been reloaded after manifest changes<br>
        • Try refreshing the page and clicking the button again<br><br>
        <strong>If this persists:</strong><br>
        • Check the browser console (F12) for more details<br>
        • Make sure you're on a regular website (not chrome:// pages)<br>
        • Try reloading the extension in chrome://extensions/<br><br>
      `;
        }

        errorHtml += `</div>`;
        textOutput.innerHTML = errorHtml;
    }

    function handleTextResponse(response) {
        if (response && response.success) {
            const preview = response.text.substring(0, 500);
            const fullText = response.text;
            const charCount = fullText.length;

            textOutput.innerHTML = `
        <div class="text-info">
          <strong>Page:</strong> ${escapeHtml(response.title || "N/A")}<br>
          <strong>URL:</strong> ${escapeHtml(response.url || "N/A")}<br>
          ${
              response.elementInfo
                  ? `<strong>Source:</strong> ${escapeHtml(
                        response.elementInfo
                    )}<br>`
                  : ""
          }
          <strong>Characters:</strong> ${charCount.toLocaleString()}
        </div>
        <div class="text-preview">
          <strong>Text Preview (first 500 chars):</strong>
          <pre>${escapeHtml(preview)}${charCount > 500 ? "..." : ""}</pre>
        </div>
        <div class="text-actions">
          <button id="copyTextBtn" class="btn-small">Copy All Text</button>
        </div>
      `;

            // Handle copy button
            const copyBtn = document.getElementById("copyTextBtn");
            if (copyBtn) {
                copyBtn.addEventListener("click", () => {
                    navigator.clipboard
                        .writeText(fullText)
                        .then(() => {
                            updateStatus("Text copied to clipboard!");
                        })
                        .catch((err) => {
                            updateStatus("Failed to copy text");
                            console.error(err);
                        });
                });
            }

            updateStatus(
                `Retrieved ${charCount.toLocaleString()} characters from page`
            );
        } else {
            updateStatus("Error: Failed to retrieve text from page");
            textOutput.textContent = "";
        }
    }

    function updateStatus(message) {
        status.textContent = message;
        status.style.display = "block";
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
});
