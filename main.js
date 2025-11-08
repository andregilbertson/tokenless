import { initSpellChecker, getSpellingSuggestions } from "./spellcheck.js";
import { removePlease, removeThanks, removeAdverbs, removeFiller } from "./delete.js";

async function runSpellCheck() {
    await initSpellChecker();

    console.log(await getSpellingSuggestions("enviornment")); //incorrect letter switch
    console.log(await getSpellingSuggestions("hello")); //correct
    console.log(await getSpellingSuggestions("beleev")); //multiple suggestions test
    console.log(await getSpellingSuggestions("oaieaohaofhaoi"));
    console.log(await getSpellingSuggestions("wrld")); //one letter lost
    console.log(await getSpellingSuggestions("h")); //unclear word
}

runSpellCheck();

function runDelete(name, input) {
    const output = removeFiller(input);
    
}