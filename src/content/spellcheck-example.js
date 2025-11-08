/**
 * Example of how to use spellcheck from text_optimization/spellcheck.js
 * This file demonstrates importing and using the spellcheck functionality
 */

import { initSpellChecker, getSpellingSuggestions } from "../../text_optimization/spellcheck.js";

// Example: Initialize and use spellcheck
async function exampleSpellCheck() {
    try {
        // Initialize the spell checker
        await initSpellChecker();
        
        // Test some words
        const result1 = await getSpellingSuggestions("hello");
        console.log("hello:", result1); // Should be correct
        
        const result2 = await getSpellingSuggestions("enviornment");
        console.log("enviornment:", result2); // Should show suggestions
        
        const result3 = await getSpellingSuggestions("beleev");
        console.log("beleev:", result3); // Should show suggestions
    } catch (error) {
        console.error("Spellcheck error:", error);
    }
}

// Export for use in content.js
export { exampleSpellCheck, initSpellChecker, getSpellingSuggestions };

