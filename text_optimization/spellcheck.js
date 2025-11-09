var nspell = require("nspell");
var loadDictionary = require("./dictionary-loader.js");
var getTokenCount = require("../src/content/token-counter.js");

// function splitIntoWords(text) {
//     //splits text into words
//     return text.match(/(\s+ | [A-Za-z]+ |[^\sA-Za-z])/g || [text]);
// }

// function isWordToken(token) {
//     return /^[A-Za-z]+$/.test(token);
// }

// #1: CORRECT SPELLING

//create spellchecker instance
let spell = null;
let dictionary = null;

function initSpellChecker() {
    return new Promise(function(resolve, reject) {
        if (spell) {
            resolve(spell);
            return;
        }
        
        if (dictionary) {
            spell = nspell(dictionary);
            resolve(spell);
            return;
        }
        
        loadDictionary().then(function(dict) {
            dictionary = dict;
            spell = nspell(dict);
            
            // Test the spell checker with a known word
            if (spell && spell.correct) {
                var testResult = spell.correct('hello');
                console.log('Spellcheck: Dictionary loaded, test word "hello" is correct:', testResult);
                if (!testResult) {
                    console.error('Spellcheck: Dictionary may not be working correctly!');
                }
            }
            
            resolve(spell);
        }).catch(function(error) {
            console.error('Spellcheck: Failed to load dictionary:', error);
            reject(error);
        });
    });
}

function getSpellingSuggestions(word) {
    return new Promise(function(resolve, reject) {
        // Make sure spellchecker is ready
        if (!spell) {
            initSpellChecker().then(function() {
                checkWord(word, resolve, reject);
            }).catch(reject);
        } else {
            checkWord(word, resolve, reject);
        }
    });
}

function checkWord(word, resolve, reject) {
    try {
        var lower = String(word || "").toLowerCase();
        
        // Skip very short words (they're often false positives)
        if (lower.length < 2) {
            resolve({
                correct: true,
                suggestions: []
            });
            return;
        }

        var isCorrect = spell.correct(lower);
        
        if (isCorrect) {
            resolve({
                correct: true,
                suggestions: []
            });
        } else {
            var suggestions = spell.suggest(lower);
            // Debug: log if common words are being flagged
            var commonWords = ['to', 'of', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with', 'should', 'many', 'produce', 'approach', 'pointed', 'careful'];
            if (commonWords.indexOf(lower) !== -1) {
                console.warn('Spellcheck: Common word flagged as misspelling:', lower, 'suggestions:', suggestions.length);
            }
            resolve({
                correct: false,
                suggestions: suggestions
            });
        }
    } catch (error) {
        console.error('Spellcheck error checking word:', word, error);
        reject(error);
    }
}

function analyzeParagraphForCorrections(text) {
    return new Promise(function(resolve, reject) {
        // Initialize spellchecker if needed
        if (!spell) {
            initSpellChecker().then(function() {
                processParagraph(text, resolve, reject);
            }).catch(reject);
        } else {
            processParagraph(text, resolve, reject);
        }
    });
}

function processParagraph(text, resolve, reject) {
    try {
        // Split text into words (extract words while preserving structure)
        var words = text.match(/\b[A-Za-z]+\b/g) || [];
        var corrections = [];
        
        // Process each word synchronously
        words.forEach(function(word) {
            var wordLower = word.toLowerCase();
            
            // Skip very short words
            if (wordLower.length < 2) {
                return;
            }
            
            // Check if word is misspelled
            var isCorrect = spell.correct(wordLower);
            
            if (!isCorrect) {
                var suggestions = spell.suggest(wordLower);
                
                if (suggestions && suggestions.length > 0) {
                    // Find the suggestion that saves the most tokens (synchronous)
                    var bestSuggestion = findBestSuggestion(word, suggestions);
                    if (bestSuggestion) {
                        corrections.push(bestSuggestion);
                    }
                }
            }
        });
        
        resolve(corrections);
    } catch (error) {
        console.error('Error analyzing paragraph:', error);
        reject(error);
    }
}

function findBestSuggestion(before, suggestions) {
    try {
        // Preserve capitalization of original word
        var isCapitalized = before[0] === before[0].toUpperCase();
        
        // Get token count for the original word (synchronous)
        var beforeTokens = getTokenCount(before);
        var bestSuggestion = null;
        var maxTokensSaved = -Infinity;
        
        // Process each suggestion synchronously
        suggestions.forEach(function(suggestion) {
            // Capitalize suggestion to match original word's capitalization
            var capitalizedSuggestion = isCapitalized 
                ? suggestion.charAt(0).toUpperCase() + suggestion.slice(1)
                : suggestion;
            
            // Get token count for this suggestion (synchronous)
            var afterTokens = getTokenCount(capitalizedSuggestion);
            var tokensSaved = beforeTokens - afterTokens;
            
            // Find the suggestion that saves the most tokens (or uses the least if all use more)
            if (tokensSaved > maxTokensSaved) {
                maxTokensSaved = tokensSaved;
                bestSuggestion = {
                    before: before,
                    after: capitalizedSuggestion,
                    tokensSaved: tokensSaved
                };
            }
        });
        
        // If no suggestion saves tokens, still return the first one
        if (bestSuggestion === null && suggestions.length > 0) {
            var capitalizedFirst = isCapitalized 
                ? suggestions[0].charAt(0).toUpperCase() + suggestions[0].slice(1)
                : suggestions[0];
            
            var firstAfterTokens = getTokenCount(capitalizedFirst);
            bestSuggestion = {
                before: before,
                after: capitalizedFirst,
                tokensSaved: beforeTokens - firstAfterTokens
            };
        }
        
        return bestSuggestion;
    } catch (error) {
        console.error('Error in findBestSuggestion:', error);
        return null;
    }
}

module.exports = {
    initSpellChecker: initSpellChecker,
    getSpellingSuggestions: getSpellingSuggestions,
    analyzeParagraphForCorrections: analyzeParagraphForCorrections
};



