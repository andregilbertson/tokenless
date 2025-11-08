/**
 * Grammarly-style spell check UI
 * Underlines misspelled words and shows popup with suggestions
 */

const { initSpellChecker, getSpellingSuggestions } = require("../../text_optimization/spellcheck.js");

class SpellCheckUI {
  constructor() {
    this.textarea = null;
    this.popup = null;
    this.currentWordElement = null;
    this.initialized = false;
    this.spellCheckerReady = false;
    this.debounceTimer = null;
    this.checkDelay = 500; // Wait 500ms after typing stops before checking
    this.mutationObserver = null;
    this.isChecking = false; // Flag to prevent concurrent checks
    this.isModifyingDOM = false; // Flag to prevent observer from triggering during our modifications
  }

  /**
   * Initialize spell checker for a textarea
   */
  init(textareaSelector) {
    var self = this;
    if (!textareaSelector) {
      textareaSelector = '#prompt-textarea';
    }
    
    if (self.initialized) {
      return Promise.resolve();
    }
    
    // Initialize the spell checker backend
    return initSpellChecker().then(function() {
      self.spellCheckerReady = true;
      console.log('✅ Spell checker initialized');
      
    // Wait for textarea to be available
    var checkInterval = setInterval(function() {
      self.textarea = document.querySelector(textareaSelector);
      if (self.textarea) {
        clearInterval(checkInterval);
        console.log('Spellcheck: Found element:', self.textarea.tagName, 'contentEditable:', self.textarea.contentEditable, 'id:', self.textarea.id, 'class:', self.textarea.className);
        self.setupSpellCheck();
        self.initialized = true;
        console.log('✅ Spell check UI initialized for textarea');
      }
    }, 500);
      
      // Stop checking after 10 seconds
      setTimeout(function() {
        clearInterval(checkInterval);
      }, 10000);
    }).catch(function(error) {
      console.error('❌ Failed to initialize spell checker:', error);
      throw error;
    });
  }

  /**
   * Setup spell checking on the textarea
   */
  setupSpellCheck() {
    if (!this.textarea) return;
    
    // Create popup element
    this.createPopup();
    
    // Determine if it's a contenteditable div or regular textarea
    var isContentEditable = this.textarea.contentEditable === 'true' || 
                              this.textarea.isContentEditable ||
                              this.textarea.tagName !== 'TEXTAREA';
    
    console.log('Spellcheck: Element type detection - tagName:', this.textarea.tagName, 'contentEditable:', this.textarea.contentEditable, 'isContentEditable:', isContentEditable);
    
    if (isContentEditable) {
      this.setupContentEditable();
    } else {
      this.setupTextarea();
    }
    
    // Initial check after a short delay
    var self = this;
    setTimeout(function() {
      console.log('Spellcheck: Running initial check');
      self.checkSpelling();
    }, 1000);
  }

  /**
   * Setup spell check for contenteditable divs (ChatGPT uses these)
   */
  setupContentEditable() {
    var self = this;
    console.log('Spellcheck: Setting up contenteditable listeners');
    
    // Listen for input events with debouncing
    this.textarea.addEventListener('input', function() {
      clearTimeout(self.debounceTimer);
      self.debounceTimer = setTimeout(function() {
        console.log('Spellcheck: Input event triggered');
        self.checkSpelling();
      }, self.checkDelay);
    });
    
    // Also listen for paste events
    this.textarea.addEventListener('paste', function() {
      clearTimeout(self.debounceTimer);
      self.debounceTimer = setTimeout(function() {
        console.log('Spellcheck: Paste event triggered');
        self.checkSpelling();
      }, self.checkDelay);
    });
    
    // Watch for DOM changes (ChatGPT dynamically updates content)
    // Store observer reference so we can disconnect it temporarily
    this.mutationObserver = new MutationObserver(function(mutations) {
      // Ignore mutations we made ourselves
      if (self.isModifyingDOM) {
        return;
      }
      
      // Check if any mutation is from user input (not from our spellcheck spans)
      var isUserInput = false;
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        // Skip if the added/removed nodes are our spellcheck elements
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (var j = 0; j < mutation.addedNodes.length; j++) {
            var node = mutation.addedNodes[j];
            if (node.nodeType === 1 && (node.classList.contains('spellcheck-error') || node.querySelector('.spellcheck-error'))) {
              return; // This is our modification, ignore it
            }
          }
        }
        if (mutation.removedNodes && mutation.removedNodes.length > 0) {
          for (var j = 0; j < mutation.removedNodes.length; j++) {
            var node = mutation.removedNodes[j];
            if (node.nodeType === 1 && (node.classList.contains('spellcheck-error') || node.querySelector('.spellcheck-error'))) {
              return; // This is our modification, ignore it
            }
          }
        }
        isUserInput = true;
      }
      
      if (isUserInput && !self.isChecking) {
        clearTimeout(self.debounceTimer);
        self.debounceTimer = setTimeout(function() {
          console.log('Spellcheck: MutationObserver triggered (user input)');
          self.checkSpelling();
        }, self.checkDelay);
      }
    });
    
    this.mutationObserver.observe(this.textarea, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Add global click listener as fallback to catch clicks on spellcheck elements
    // This ensures we catch clicks even if ChatGPT's UI intercepts them
    if (!this.globalClickHandler) {
      this.globalClickHandler = function(e) {
        // Check if click is on a spellcheck-error element
        var target = e.target;
        var spellcheckElement = null;
        
        // Check if target or its parent is a spellcheck-error
        if (target && target.classList && target.classList.contains('spellcheck-error')) {
          spellcheckElement = target;
        } else if (target && target.closest) {
          spellcheckElement = target.closest('.spellcheck-error');
        }
        
        if (spellcheckElement) {
          console.log('Spellcheck: Global click handler triggered!', spellcheckElement);
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          var word = spellcheckElement.textContent || spellcheckElement.dataset.word || '';
          var suggestions = [];
          
          if (spellcheckElement.dataset.suggestions) {
            try {
              suggestions = JSON.parse(spellcheckElement.dataset.suggestions);
              console.log('Spellcheck: Parsed suggestions from dataset:', suggestions);
            } catch (err) {
              console.error('Spellcheck: Failed to parse suggestions:', err);
            }
          } else {
            console.warn('Spellcheck: No suggestions in dataset for element:', spellcheckElement);
          }
          
          console.log('Spellcheck: Global click handler caught click on:', word, 'suggestions:', suggestions);
          self.showPopup(spellcheckElement, suggestions, word);
          return false;
        }
      };
      
      // Use capture phase to catch before other handlers
      document.addEventListener('click', this.globalClickHandler, true);
      document.addEventListener('mousedown', this.globalClickHandler, true);
      console.log('Spellcheck: Global click handlers registered');
    }
  }

  /**
   * Setup spell check for regular textareas
   */
  setupTextarea() {
    var self = this;
    console.log('Spellcheck: Setting up textarea listeners');
    
    // For textareas, we'll use an overlay approach since we can't style text directly
    this.createOverlay();
    
    this.textarea.addEventListener('input', function() {
      clearTimeout(self.debounceTimer);
      self.debounceTimer = setTimeout(function() {
        console.log('Spellcheck: Textarea input event triggered');
        self.checkSpelling();
      }, self.checkDelay);
    });
    
    this.textarea.addEventListener('scroll', function() {
      self.updateOverlayPosition();
    });
  }

  /**
   * Check spelling of text in the textarea
   */
  checkSpelling() {
    var self = this;
    if (!self.textarea || !self.spellCheckerReady) {
      console.log('Spellcheck skipped: textarea=' + !!self.textarea + ', ready=' + self.spellCheckerReady);
      return Promise.resolve();
    }
    
    // Prevent concurrent checks
    if (self.isChecking) {
      console.log('Spellcheck: Already checking, skipping');
      return Promise.resolve();
    }
    
    self.isChecking = true;
    
    return new Promise(function(resolve) {
      var text = '';
      var isContentEditable = false;
      
      // Get text based on element type
      if (self.textarea.tagName === 'TEXTAREA' || self.textarea.tagName === 'INPUT') {
        text = self.textarea.value || '';
        console.log('Spellcheck: Textarea value length:', text.length);
      } else if (self.textarea.contentEditable === 'true' || self.textarea.isContentEditable) {
        // For contenteditable, get plain text without HTML
        text = self.textarea.innerText || self.textarea.textContent || '';
        isContentEditable = true;
        console.log('Spellcheck: Contenteditable text length:', text.length);
      } else {
        console.log('Spellcheck: Unknown element type:', self.textarea.tagName, 'contentEditable:', self.textarea.contentEditable);
        resolve();
        return;
      }
      
      if (!text || text.trim().length === 0) {
        console.log('Spellcheck: No text to check');
        self.removeUnderlines();
        resolve();
        return;
      }
      
      console.log('Spellcheck: Checking text, length=' + text.length + ', isContentEditable=' + isContentEditable, 'preview:', text.substring(0, 50));
      
      // Remove existing underlines
      self.removeUnderlines();
      
      // Extract words with their positions
      var words = self.extractWords(text);
      console.log('Spellcheck: Extracted ' + words.length + ' words');
      
      // Check each word (limit to prevent performance issues)
      var wordsToCheck = words.slice(0, 100); // Limit to first 100 words
      
      // Process words in batches to avoid blocking
      var batchSize = 10;
      var batchIndex = 0;
      
      function processBatch() {
        if (batchIndex >= wordsToCheck.length) {
          console.log('Spellcheck: Finished checking all words');
          self.isChecking = false;
          resolve();
          return;
        }
        
        var batch = wordsToCheck.slice(batchIndex, batchIndex + batchSize);
        var promises = [];
        
        for (var j = 0; j < batch.length; j++) {
          var wordInfo = batch[j];
          
          // Skip very short words
          if (wordInfo.word.length < 3) continue;
          
          // Skip words that are already underlined or ignored
          if (isContentEditable) {
            var existingError = self.textarea.querySelector('.spellcheck-error[data-word="' + self.escapeHtml(wordInfo.word) + '"]');
            if (existingError) continue;
            var ignoredWord = self.textarea.querySelector('[data-ignored="true"][data-word="' + self.escapeHtml(wordInfo.word) + '"]');
            if (ignoredWord) continue;
          }
          
          promises.push(
            getSpellingSuggestions(wordInfo.word).then(function(result) {
              if (!result.correct) {
                if (result.suggestions && result.suggestions.length > 0) {
                  console.log('Spellcheck: Found misspelling:', wordInfo.word, 'suggestions:', result.suggestions.length, result.suggestions.slice(0, 3));
                  self.underlineWord(wordInfo, result.suggestions, isContentEditable);
                } else {
                  console.log('Spellcheck: Misspelling with no suggestions:', wordInfo.word);
                }
              }
            }).catch(function(error) {
              console.error('Error checking word:', wordInfo.word, error);
            })
          );
        }
        
        Promise.all(promises).then(function() {
          batchIndex += batchSize;
          
          // Small delay between batches to keep UI responsive
          if (batchIndex < wordsToCheck.length) {
            setTimeout(processBatch, 10);
          } else {
            console.log('Spellcheck: Finished checking all words');
            self.isChecking = false;
            resolve();
          }
        });
      }
      
      processBatch();
    });
  }

  /**
   * Extract words with their positions from text
   */
  extractWords(text) {
    const words = [];
    // Match words that are at least 2 characters, handling apostrophes and hyphens
    const wordRegex = /\b[a-zA-Z]{2,}(?:['-][a-zA-Z]+)*\b/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      // Skip if this word is already marked as a spellcheck error
      // (we'll check this when underlining)
      words.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
        original: match[0]
      });
    }
    
    return words;
  }

  /**
   * Underline a misspelled word
   */
  underlineWord(wordInfo, suggestions, isContentEditable) {
    if (isContentEditable) {
      this.underlineInContentEditable(wordInfo, suggestions);
    } else {
      this.underlineInTextarea(wordInfo, suggestions);
    }
  }

  /**
   * Underline word in contenteditable div
   * Uses overlay approach to avoid ProseMirror removing our spans
   */
  underlineInContentEditable(wordInfo, suggestions) {
    var self = this;
    try {
      // Create overlay if it doesn't exist
      if (!this.contentEditableOverlay) {
        this.createContentEditableOverlay();
      }
      
      if (!this.contentEditableOverlay) {
        console.error('Spellcheck: Failed to create overlay');
        return;
      }
      
      // Find the position of the word in the DOM
      var range = this.getTextRange(wordInfo.start, wordInfo.end);
      if (!range) {
        console.warn('Spellcheck: Could not find range for word:', wordInfo.word);
        return;
      }
      
      // Get bounding rect of the word
      var rects = range.getClientRects();
      if (!rects || rects.length === 0) {
        console.warn('Spellcheck: Could not get rect for word:', wordInfo.word);
        return;
      }
      
      // Create underline for each rect (word might be split across lines)
      for (var i = 0; i < rects.length; i++) {
        var rect = rects[i];
        var underline = document.createElement('div');
        underline.className = 'spellcheck-underline-contenteditable';
        underline.dataset.word = wordInfo.word;
        underline.dataset.suggestions = JSON.stringify(suggestions);
        underline.dataset.start = wordInfo.start;
        underline.dataset.end = wordInfo.end;
        underline.style.cssText = `
          position: fixed;
          left: ${rect.left}px;
          top: ${rect.top + rect.height - 2}px;
          width: ${rect.width}px;
          height: 2px;
          background: linear-gradient(to right, #dc3545 0%, #dc3545 25%, transparent 25%, transparent 50%, #dc3545 50%, #dc3545 75%, transparent 75%, transparent 100%);
          background-size: 8px 2px;
          background-repeat: repeat-x;
          pointer-events: auto;
          cursor: pointer;
          z-index: 999998;
        `;
        
        // Add click handler
        underline.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('Spellcheck: Clicked on overlay underline for:', wordInfo.word);
          var suggestionsToUse = suggestions;
          if (underline.dataset.suggestions) {
            try {
              suggestionsToUse = JSON.parse(underline.dataset.suggestions);
            } catch (err) {
              console.error('Spellcheck: Failed to parse suggestions:', err);
              suggestionsToUse = [];
            }
          }
          self.showPopupForContentEditable(underline, suggestionsToUse, wordInfo);
          return false;
        }, true);
        
        // Add hover effect
        underline.addEventListener('mouseenter', function() {
          underline.style.opacity = '0.8';
        });
        underline.addEventListener('mouseleave', function() {
          underline.style.opacity = '1';
        });
        
        this.contentEditableOverlay.appendChild(underline);
      }
      
      console.log('Spellcheck: Created overlay underline for word:', wordInfo.word, 'at position', wordInfo.start, '-', wordInfo.end);
    } catch (error) {
      console.error('Error underlining word in contenteditable:', error);
    }
  }
  
  /**
   * Get text range for given start/end positions in contenteditable
   */
  getTextRange(start, end) {
    try {
      var walker = document.createTreeWalker(
        this.textarea,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      var textNode;
      var currentOffset = 0;
      var startNode = null;
      var startOffset = 0;
      var endNode = null;
      var endOffset = 0;
      
      while (textNode = walker.nextNode()) {
        var nodeLength = textNode.textContent.length;
        
        if (!startNode && currentOffset + nodeLength >= start) {
          startNode = textNode;
          startOffset = start - currentOffset;
        }
        
        if (currentOffset + nodeLength >= end) {
          endNode = textNode;
          endOffset = end - currentOffset;
          break;
        }
        
        currentOffset += nodeLength;
      }
      
      if (!startNode || !endNode) {
        return null;
      }
      
      var range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      return range;
    } catch (error) {
      console.error('Error creating range:', error);
      return null;
    }
  }
  
  /**
   * Create overlay for contenteditable div
   */
  createContentEditableOverlay() {
    if (this.contentEditableOverlay) return;
    
    this.contentEditableOverlay = document.createElement('div');
    this.contentEditableOverlay.className = 'spellcheck-contenteditable-overlay';
    this.contentEditableOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999997;
    `;
    
    document.body.appendChild(this.contentEditableOverlay);
    console.log('Spellcheck: Created contenteditable overlay');
    
    // Update overlay position when scrolling (throttled for performance)
    var self = this;
    var scrollTimeout = null;
    var updatePosition = function() {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(function() {
        if (self.contentEditableOverlay && self.textarea) {
          // Recalculate all underline positions
          var underlines = self.contentEditableOverlay.querySelectorAll('.spellcheck-underline-contenteditable');
          underlines.forEach(function(underline) {
            var start = parseInt(underline.dataset.start);
            var end = parseInt(underline.dataset.end);
            var range = self.getTextRange(start, end);
            if (range) {
              var rects = range.getClientRects();
              if (rects && rects.length > 0) {
                var rect = rects[0];
                underline.style.left = rect.left + 'px';
                underline.style.top = (rect.top + rect.height - 2) + 'px';
                underline.style.width = rect.width + 'px';
              }
            }
          });
        }
      }, 50); // Throttle to max once per 50ms
    };
    
    window.addEventListener('scroll', updatePosition, { passive: true });
    if (this.textarea) {
      this.textarea.addEventListener('scroll', updatePosition, { passive: true });
    }
  }

  /**
   * Underline word in textarea (using overlay approach)
   */
  underlineInTextarea(wordInfo, suggestions) {
    if (!this.overlay) return;
    
    // Calculate position of word in textarea
    const text = this.textarea.value;
    const beforeText = text.substring(0, wordInfo.start);
    
    // Create a temporary span to measure text width
    const measureSpan = document.createElement('span');
    measureSpan.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      font: ${getComputedStyle(this.textarea).font};
      padding: ${getComputedStyle(this.textarea).padding};
    `;
    measureSpan.textContent = beforeText;
    document.body.appendChild(measureSpan);
    
    const beforeWidth = measureSpan.offsetWidth;
    measureSpan.textContent = text.substring(0, wordInfo.end);
    const wordEndWidth = measureSpan.offsetWidth;
    document.body.removeChild(measureSpan);
    
    // Create underline element
    const underline = document.createElement('div');
    underline.className = 'spellcheck-underline';
    underline.dataset.word = wordInfo.word;
    underline.dataset.suggestions = JSON.stringify(suggestions);
    underline.style.cssText = `
      position: absolute;
      left: ${beforeWidth}px;
      width: ${wordEndWidth - beforeWidth}px;
      border-bottom: 2px wavy #dc3545;
      pointer-events: none;
      top: 0;
      height: 100%;
    `;
    
    underline.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showPopupForTextarea(underline, suggestions, wordInfo);
    });
    
    this.overlay.appendChild(underline);
  }

  /**
   * Create overlay for textarea
   */
  createOverlay() {
    if (this.overlay) return;
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'spellcheck-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    `;
    
    // Position overlay over textarea
    const textareaRect = this.textarea.getBoundingClientRect();
    const textareaStyle = getComputedStyle(this.textarea);
    
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = `${textareaRect.top + parseInt(textareaStyle.paddingTop)}px`;
    this.overlay.style.left = `${textareaRect.left + parseInt(textareaStyle.paddingLeft)}px`;
    this.overlay.style.width = `${textareaRect.width - parseInt(textareaStyle.paddingLeft) - parseInt(textareaStyle.paddingRight)}px`;
    this.overlay.style.height = `${textareaRect.height - parseInt(textareaStyle.paddingTop) - parseInt(textareaStyle.paddingBottom)}px`;
    
    document.body.appendChild(this.overlay);
  }

  /**
   * Update overlay position when textarea scrolls
   */
  updateOverlayPosition() {
    if (!this.overlay || !this.textarea) return;
    
    const textareaRect = this.textarea.getBoundingClientRect();
    const textareaStyle = getComputedStyle(this.textarea);
    
    this.overlay.style.top = `${textareaRect.top + parseInt(textareaStyle.paddingTop)}px`;
    this.overlay.style.left = `${textareaRect.left + parseInt(textareaStyle.paddingLeft)}px`;
  }

  /**
   * Remove all underlines
   */
  removeUnderlines() {
    // Set flag to prevent MutationObserver from triggering
    this.isModifyingDOM = true;
    
    // Clear contenteditable overlay
    if (this.contentEditableOverlay) {
      this.contentEditableOverlay.innerHTML = '';
    }
    
    // Clear textarea overlay
    if (this.overlay) {
      this.overlay.innerHTML = '';
    }
    
    // Reset flag after a short delay
    var self = this;
    setTimeout(function() {
      self.isModifyingDOM = false;
    }, 100);
  }

  /**
   * Create popup element
   */
  createPopup() {
    if (this.popup) return;
    
    this.popup = document.createElement('div');
    this.popup.id = 'spellcheck-popup';
    this.popup.className = 'spellcheck-popup';
    this.popup.style.cssText = `
      position: fixed !important;
      background: white !important;
      border: 1px solid #ddd !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      padding: 12px !important;
      z-index: 999999 !important;
      display: none;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      min-width: 200px !important;
      max-width: 300px !important;
      max-height: 300px !important;
      overflow-y: auto !important;
    `;
    
    document.body.appendChild(this.popup);
  }

  /**
   * Show popup with suggestions
   */
  showPopup(element, suggestions, word) {
    console.log('Spellcheck: showPopup called with word:', word, 'suggestions:', suggestions);
    
    if (!this.popup) this.createPopup();
    
    // Ensure suggestions is an array
    if (!Array.isArray(suggestions)) {
      console.warn('Spellcheck: suggestions is not an array:', suggestions);
      suggestions = [];
    }
    
    const rect = element.getBoundingClientRect();
    console.log('Spellcheck: Element rect:', rect);
    
    // Build popup content
    let html = `<div style="font-weight: 600; margin-bottom: 8px; color: #dc3545; font-size: 16px;">${this.escapeHtml(word)}</div>`;
    
    if (suggestions && suggestions.length > 0) {
      html += '<div style="font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Suggestions:</div>';
      html += '<div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">';
      
      suggestions.slice(0, 5).forEach(suggestion => {
        html += `
          <button class="spellcheck-suggestion" 
                  data-word="${this.escapeHtml(word)}" 
                  data-suggestion="${this.escapeHtml(suggestion)}"
                  style="
                    text-align: left;
                    padding: 8px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                    background: white;
                    color: #333 !important;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                  "
                  onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#dc3545'"
                  onmouseout="this.style.background='white'; this.style.borderColor='#e0e0e0'">
            ${this.escapeHtml(suggestion)}
          </button>
        `;
      });
      
      html += '</div>';
    } else {
      html += '<div style="font-size: 12px; color: #999; font-style: italic; margin-bottom: 8px;">No suggestions available</div>';
    }
    
    // Add Ignore button
    html += `
      <button class="spellcheck-ignore" 
              data-word="${this.escapeHtml(word)}"
              style="
                width: 100%;
                padding: 6px 12px;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: #f8f9fa;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 13px;
                color: #666;
                margin-top: 4px;
              "
              onmouseover="this.style.background='#e9ecef'"
              onmouseout="this.style.background='#f8f9fa'">
        Ignore
      </button>
    `;
    
    this.popup.innerHTML = html;
    
    // Position popup above or below the word
    const popupHeight = 200; // Approximate
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    if (spaceBelow > popupHeight || spaceBelow > spaceAbove) {
      // Show below
      this.popup.style.top = `${rect.bottom + 5}px`;
      this.popup.style.bottom = 'auto';
    } else {
      // Show above
      this.popup.style.top = 'auto';
      this.popup.style.bottom = `${window.innerHeight - rect.top + 5}px`;
    }
    
    this.popup.style.left = `${Math.max(10, Math.min(rect.left, window.innerWidth - 310))}px`;
    this.popup.style.display = 'block';
    this.popup.style.visibility = 'visible';
    this.popup.style.opacity = '1';
    this.popup.style.zIndex = '999999'; // Very high z-index to ensure it's on top
    this.popup.style.pointerEvents = 'auto';
    
    // Force a reflow to ensure the popup is rendered
    this.popup.offsetHeight;
    
    const popupRect = this.popup.getBoundingClientRect();
    console.log('Spellcheck: Popup shown at', this.popup.style.top, this.popup.style.left);
    console.log('Spellcheck: Popup rect:', popupRect);
    console.log('Spellcheck: Popup computed style display:', window.getComputedStyle(this.popup).display);
    console.log('Spellcheck: Popup computed style visibility:', window.getComputedStyle(this.popup).visibility);
    console.log('Spellcheck: Popup computed style z-index:', window.getComputedStyle(this.popup).zIndex);
    
    // Verify popup is actually visible
    if (popupRect.width === 0 || popupRect.height === 0) {
      console.error('Spellcheck: Popup has zero dimensions!');
    }
    
    // Add click handlers for suggestions
    this.popup.querySelectorAll('.spellcheck-suggestion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const originalWord = btn.dataset.word;
        const suggestion = btn.dataset.suggestion;
        this.replaceWord(element, originalWord, suggestion);
        this.hidePopup();
      });
    });
    
    // Add click handler for Ignore button
    const ignoreBtn = this.popup.querySelector('.spellcheck-ignore');
    if (ignoreBtn) {
      ignoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.ignoreWord(element);
        this.hidePopup();
      });
    }
    
    // Close on outside click (with delay to avoid immediate closing)
    var self = this;
    setTimeout(function() {
      // Only add listener once
      if (!self.outsideClickHandler) {
        self.outsideClickHandler = function(e) {
          self.handleOutsideClick(e);
        };
        document.addEventListener('click', self.outsideClickHandler, true);
      }
    }, 100); // Small delay to ensure popup is fully rendered
    
    this.currentWordElement = element;
  }

  /**
   * Show popup for contenteditable (uses wordInfo for positioning)
   */
  showPopupForContentEditable(underlineElement, suggestions, wordInfo) {
    if (!this.popup) this.createPopup();
    
    var rect = underlineElement.getBoundingClientRect();
    
    // Build popup content
    var html = '<div style="font-weight: 600; margin-bottom: 8px; color: #dc3545; font-size: 16px;">' + this.escapeHtml(wordInfo.word) + '</div>';
    
    if (suggestions && suggestions.length > 0) {
      html += '<div style="font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Suggestions:</div>';
      html += '<div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">';
      
      var self = this;
      suggestions.slice(0, 5).forEach(function(suggestion) {
        html += '<button class="spellcheck-suggestion" data-word="' + self.escapeHtml(wordInfo.word) + '" data-suggestion="' + self.escapeHtml(suggestion) + '" style="text-align: left; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px; background: white; color: #333 !important; cursor: pointer; transition: all 0.2s; font-size: 14px;">' + self.escapeHtml(suggestion) + '</button>';
      });
      
      html += '</div>';
    } else {
      html += '<div style="font-size: 12px; color: #999; font-style: italic; margin-bottom: 8px;">No suggestions available</div>';
    }
    
    // Add Ignore button
    html += '<button class="spellcheck-ignore" data-word="' + this.escapeHtml(wordInfo.word) + '" style="width: 100%; padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #f8f9fa; cursor: pointer; transition: all 0.2s; font-size: 13px; color: #666; margin-top: 4px;">Ignore</button>';
    
    this.popup.innerHTML = html;
    
    // Position popup
    this.popup.style.top = (rect.top + rect.height + 5) + 'px';
    this.popup.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - 310)) + 'px';
    this.popup.style.display = 'block';
    this.popup.style.visibility = 'visible';
    this.popup.style.opacity = '1';
    this.popup.style.zIndex = '999999';
    this.popup.style.pointerEvents = 'auto';
    
    console.log('Spellcheck: Popup shown for contenteditable word:', wordInfo.word);
    
    // Add click handlers
    var self = this;
    this.popup.querySelectorAll('.spellcheck-suggestion').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var originalWord = btn.dataset.word;
        var suggestion = btn.dataset.suggestion;
        self.replaceWordInContentEditable(wordInfo, suggestion);
        self.hidePopup();
      });
    });
    
    var ignoreBtn = this.popup.querySelector('.spellcheck-ignore');
    if (ignoreBtn) {
      ignoreBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.ignoreWordInContentEditable(underlineElement);
        self.hidePopup();
      });
    }
    
    // Close on outside click
    setTimeout(function() {
      if (!self.outsideClickHandler) {
        self.outsideClickHandler = function(e) {
          self.handleOutsideClick(e);
        };
        document.addEventListener('click', self.outsideClickHandler, true);
      }
    }, 100);
    
    this.currentWordElement = underlineElement;
    this.currentWordInfo = wordInfo;
  }
  
  /**
   * Show popup for textarea (different positioning)
   */
  showPopupForTextarea(underlineElement, suggestions, wordInfo) {
    if (!this.popup) this.createPopup();
    
    const textareaRect = this.textarea.getBoundingClientRect();
    const underlineRect = underlineElement.getBoundingClientRect();
    
    // Build popup content (same as showPopup)
    let html = `<div style="font-weight: 600; margin-bottom: 8px; color: #dc3545; font-size: 16px;">${this.escapeHtml(wordInfo.word)}</div>`;
    
    if (suggestions && suggestions.length > 0) {
      html += '<div style="font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Suggestions:</div>';
      html += '<div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">';
      
      suggestions.slice(0, 5).forEach(suggestion => {
        html += `
          <button class="spellcheck-suggestion" 
                  data-word="${this.escapeHtml(wordInfo.word)}" 
                  data-suggestion="${this.escapeHtml(suggestion)}"
                  style="
                    text-align: left;
                    padding: 8px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                    background: white;
                    color: #333 !important;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                  "
                  onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#dc3545'"
                  onmouseout="this.style.background='white'; this.style.borderColor='#e0e0e0'">
            ${this.escapeHtml(suggestion)}
          </button>
        `;
      });
      
      html += '</div>';
    } else {
      html += '<div style="font-size: 12px; color: #999; font-style: italic; margin-bottom: 8px;">No suggestions available</div>';
    }
    
    // Add Ignore button
    html += `
      <button class="spellcheck-ignore" 
              data-word="${this.escapeHtml(wordInfo.word)}"
              style="
                width: 100%;
                padding: 6px 12px;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: #f8f9fa;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 13px;
                color: #666;
                margin-top: 4px;
              "
              onmouseover="this.style.background='#e9ecef'"
              onmouseout="this.style.background='#f8f9fa'">
        Ignore
      </button>
    `;
    
    this.popup.innerHTML = html;
    
    // Position relative to textarea
    this.popup.style.top = `${underlineRect.bottom + 5}px`;
    this.popup.style.left = `${Math.max(10, Math.min(underlineRect.left, window.innerWidth - 310))}px`;
    this.popup.style.display = 'block';
    
    // Add click handlers
    this.popup.querySelectorAll('.spellcheck-suggestion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const originalWord = btn.dataset.word;
        const suggestion = btn.dataset.suggestion;
        this.replaceWordInTextarea(wordInfo, suggestion);
        this.hidePopup();
      });
    });
    
    // Add click handler for Ignore button
    const ignoreBtn = this.popup.querySelector('.spellcheck-ignore');
    if (ignoreBtn) {
      ignoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.ignoreWordInTextarea(underlineElement);
        this.hidePopup();
      });
    }
    
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick.bind(this), true);
    }, 0);
    
    this.currentWordElement = underlineElement;
  }

  /**
   * Handle clicks outside popup
   */
  handleOutsideClick(e) {
    if (!this.popup || this.popup.style.display === 'none') {
      return;
    }
    
    // Don't close if clicking on popup or its children
    if (this.popup.contains(e.target)) {
      return;
    }
    
    // Don't close if clicking on the word element
    if (e.target === this.currentWordElement || 
        (e.target && e.target.closest && e.target.closest('.spellcheck-error') === this.currentWordElement)) {
      return;
    }
    
    // Close popup
    console.log('Spellcheck: Closing popup due to outside click');
    this.hidePopup();
    
    // Remove listener
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler, true);
      this.outsideClickHandler = null;
    }
  }

  /**
   * Hide popup
   */
  hidePopup() {
    if (this.popup) {
      this.popup.style.display = 'none';
      console.log('Spellcheck: Popup hidden');
    }
    this.currentWordElement = null;
    
    // Remove outside click listener
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler, true);
      this.outsideClickHandler = null;
    }
  }

  /**
   * Replace word in contenteditable
   */
  replaceWordInContentEditable(wordInfo, suggestion) {
    try {
      var range = this.getTextRange(wordInfo.start, wordInfo.end);
      if (!range) {
        console.error('Spellcheck: Could not find range for replacement');
        return;
      }
      
      // Delete the old word
      range.deleteContents();
      
      // Insert the new word
      var textNode = document.createTextNode(suggestion);
      range.insertNode(textNode);
      
      // Remove underline from overlay
      if (this.contentEditableOverlay) {
        var underlines = this.contentEditableOverlay.querySelectorAll('.spellcheck-underline-contenteditable');
        underlines.forEach(function(underline) {
          if (parseInt(underline.dataset.start) === wordInfo.start && 
              parseInt(underline.dataset.end) === wordInfo.end) {
            underline.remove();
          }
        });
      }
      
      // Trigger input event
      var inputEvent = new Event('input', { bubbles: true });
      this.textarea.dispatchEvent(inputEvent);
      
      // Re-check spelling after a delay
      var self = this;
      setTimeout(function() {
        self.checkSpelling();
      }, 300);
    } catch (error) {
      console.error('Error replacing word in contenteditable:', error);
    }
  }
  
  /**
   * Ignore word in contenteditable
   */
  ignoreWordInContentEditable(underlineElement) {
    if (underlineElement && this.contentEditableOverlay) {
      underlineElement.remove();
    }
  }
  
  /**
   * Replace word with suggestion (contenteditable) - legacy method
   */
  replaceWord(element, originalWord, suggestion) {
    // This method is kept for backwards compatibility but shouldn't be used for contenteditable
    // Use replaceWordInContentEditable instead
    if (this.currentWordInfo) {
      this.replaceWordInContentEditable(this.currentWordInfo, suggestion);
    }
  }

  /**
   * Replace word in textarea
   */
  replaceWordInTextarea(wordInfo, suggestion) {
    if (this.textarea.tagName === 'TEXTAREA' || this.textarea.tagName === 'INPUT') {
      const text = this.textarea.value;
      const beforeText = text.substring(0, wordInfo.start);
      const afterText = text.substring(wordInfo.end);
      const newText = beforeText + suggestion + afterText;
      
      this.textarea.value = newText;
      
      // Set cursor position after the replaced word
      const newCursorPos = wordInfo.start + suggestion.length;
      this.textarea.setSelectionRange(newCursorPos, newCursorPos);
      
      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true });
      this.textarea.dispatchEvent(inputEvent);
      
      // Re-check spelling
      setTimeout(() => this.checkSpelling(), 300);
    }
  }

  /**
   * Ignore word (remove underline, don't check again in this session)
   */
  ignoreWord(element) {
    if (element && element.classList.contains('spellcheck-error')) {
      // Preserve the word data if not already set
      if (!element.dataset.word && element.textContent) {
        element.dataset.word = element.textContent;
      }
      // Remove the underline styling but keep the text
      element.classList.remove('spellcheck-error');
      element.style.textDecoration = 'none';
      element.style.cursor = 'default';
      element.style.backgroundColor = 'transparent';
      element.dataset.ignored = 'true';
    }
  }

  /**
   * Ignore word in textarea
   */
  ignoreWordInTextarea(underlineElement) {
    if (underlineElement && this.overlay) {
      underlineElement.remove();
    }
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export singleton instance
const spellCheckUI = new SpellCheckUI();
module.exports = { spellCheckUI: spellCheckUI };

