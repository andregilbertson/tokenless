var nspell = require("nspell");
var loadDictionary = require("./dictionary-loader.js");

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

module.exports = {
    initSpellChecker: initSpellChecker,
    getSpellingSuggestions: getSpellingSuggestions
};

// #2: DELETING UNECESSARY WORDS


