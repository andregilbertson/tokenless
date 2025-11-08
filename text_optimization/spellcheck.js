import nspell from "nspell";
import dictionary from "dictionary-en";

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

export async function initSpellChecker() {
    if (spell) return spell;
    const dict = dictionary;
    spell = nspell(dict);

    return spell;
}

export async function getSpellingSuggestions(word) {
    // Make sure spellchecker is ready
    if (!spell) {
      await initSpellchecker();
    }

    const lower = String(word || "").toLowerCase();

    if(spell.correct(lower)) {
        return {
            correct: true,
            suggestions: []
        };
    }

    return {
        correct: false,
        suggestions: spell.suggest(lower)
    };
}

// #2: DELETING UNECESSARY WORDS


