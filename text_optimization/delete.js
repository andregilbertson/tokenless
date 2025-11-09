const getTokenCount = require('../src/content/token-counter');

/**
 * Finds "please" at the beginning or end of text
 * Returns array of suggestions: { before, after, tokensSaved, type }
 */
function findPleaseDeletions(text) {
    const suggestions = [];
    const seen = new Set();
    
    // Check for "please" at the start
    const startMatch = text.match(/^\s*(please[, ]+)/i);
    if (startMatch) {
        const before = startMatch[1];
        const after = '';
        const key = `${before}→${after}`;
        if (!seen.has(key)) {
            seen.add(key);
            const tokensSaved = getTokenCount(before);
            suggestions.push({
                before: before,
                after: after,
                tokensSaved: tokensSaved,
                type: 'deletion'
            });
        }
    }
    
    // Check for "please" at the end
    const endMatch = text.match(/([, ]*please[.!?]?\s*)$/i);
    if (endMatch) {
        const before = endMatch[1];
        const after = '';
        const key = `${before}→${after}`;
        if (!seen.has(key)) {
            seen.add(key);
            const tokensSaved = getTokenCount(before);
            suggestions.push({
                before: before,
                after: after,
                tokensSaved: tokensSaved,
                type: 'deletion'
            });
        }
    }
    
    return suggestions;
}

/**
 * Finds "thanks" or "thank you" at the end of text
 * Returns array of suggestions: { before, after, tokensSaved, type }
 */
function findThanksDeletions(text) {
    const suggestions = [];
    const seen = new Set();
    
    const match = text.match(/([, ]*(?:thank you|thanks)[.!?]?\s*)$/i);
    if (match) {
        const before = match[1];
        const after = '';
        const key = `${before}→${after}`;
        if (!seen.has(key)) {
            seen.add(key);
            const tokensSaved = getTokenCount(before);
            suggestions.push({
                before: before,
                after: after,
                tokensSaved: tokensSaved,
                type: 'deletion'
            });
        }
    }
    
    return suggestions;
}

/**
 * Finds adverbs in text using compromise NLP library
 * Returns array of suggestions: { before, after, tokensSaved, type }
 * Note: Requires 'compromise' package. Returns empty array if not available.
 */
function findAdverbDeletions(text) {
    const suggestions = [];
    const seen = new Set();
    
    // Check if compromise is available
    let nlp;
    try {
        nlp = require('compromise');
    } catch (error) {
        // compromise not available, return empty array
        return suggestions;
    }
    
    try {
        const doc = nlp(text);
        const adverbs = doc.match('#Adverb');
        
        adverbs.forEach(function(adverb) {
            const before = adverb.text();
            const after = '';
            const key = `${before}→${after}`;
            
            if (!seen.has(key) && before.trim().length > 0) {
                seen.add(key);
                const tokensSaved = getTokenCount(before);
                suggestions.push({
                    before: before,
                    after: after,
                    tokensSaved: tokensSaved,
                    type: 'deletion'
                });
            }
        });
    } catch (error) {
        console.error('Error finding adverbs:', error);
    }
    
    return suggestions;
}

/**
 * Main function to find all deletion suggestions in text
 * @param {string} text - The original text
 * @param {object} options - Configuration options
 * @param {boolean} options.removePlease - Find "please" deletions (default: true)
 * @param {boolean} options.removeThanks - Find "thanks" deletions (default: true)
 * @param {boolean} options.removeAdverbs - Find adverb deletions (default: true)
 * @returns {Array} - Array of suggestion objects: { before, after, tokensSaved, type }
 */
function findDeletions(text, options = {}) {
    if (!text || typeof text !== 'string') return [];
    
    const {
        removePlease: shouldRemovePlease = true,
        removeThanks: shouldRemoveThanks = true,
        removeAdverbs: shouldRemoveAdverbs = true
    } = options;
    
    const suggestions = [];
    
    // Find "please" deletions
    if (shouldRemovePlease) {
        suggestions.push(...findPleaseDeletions(text));
    }
    
    // Find "thanks" deletions
    if (shouldRemoveThanks) {
        suggestions.push(...findThanksDeletions(text));
    }
    
    // Find adverb deletions
    if (shouldRemoveAdverbs) {
        suggestions.push(...findAdverbDeletions(text));
    }
    
    return suggestions;
}

// Legacy functions for backward compatibility (return modified text)
function removePlease(text) {
    let output = text;
    output = output.replace(/^\s*please[, ]+/i, "");
    output = output.replace(/[, ]*please[.!?]?\s*$/i, "");
    return output.trim();
}

function removeThanks(text) {
    return text
        .replace(/[, ]*(thank you|thanks)[.!?]?\s*$/i, "")
        .trim();
}

function removeAdverbs(text) {
    try {
        const nlp = require('compromise');
        const doc = nlp(text);
        doc.delete("#Adverb");
        return doc.text();
    } catch (error) {
        // If compromise not available, return original text
        return text;
    }
}

function removeFiller(text) {
    let output = text;
    output = removeAdverbs(output);
    output = removePlease(output);
    output = removeThanks(output);
    output = output.replace(/\s{2,}/g, " ").trim();
    return output;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        findDeletions,
        findPleaseDeletions,
        findThanksDeletions,
        findAdverbDeletions,
        // Legacy functions
        removePlease,
        removeThanks,
        removeAdverbs,
        removeFiller
    };
}

// Browser export (if needed)
if (typeof window !== 'undefined') {
    window.textDeletion = {
        findDeletions,
        findPleaseDeletions,
        findThanksDeletions,
        findAdverbDeletions,
        removePlease,
        removeThanks,
        removeAdverbs,
        removeFiller
    };
}
