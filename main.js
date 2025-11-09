const { initSpellChecker, getSpellingSuggestions, analyzeParagraphForCorrections } = require("./text_optimization/spellcheck.js");
// const { removePlease, removeThanks, removeAdverbs, removeFiller } = require("./text_optimization/delete.js");

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

testTokenCounts();

async function testTokenCounts() {
    const getTokenCount = require("./src/content/token-counter.js");
    
    const testWords = [
        { before: "burch", after: "birch" },
        { before: "youthe", after: "youth" },
        { before: "enviornment", after: "environment" },
        { before: "lanst", after: "canst" },
        { before: "paragrpah", after: "paragraph" },
        { before: "beleev", after: "believe" },
        { before: "wrld", after: "wild" },
        { before: "beleev", after: "belie" }
    ];
    
    console.log("\n=== Testing Token Counts (Node.js with real tiktoken) ===");
    for (const pair of testWords) {
        const beforeTokens = await getTokenCount(pair.before);
        const afterTokens = await getTokenCount(pair.after);
        const saved = beforeTokens - afterTokens;
        console.log(`"${pair.before}" (${beforeTokens} tokens) -> "${pair.after}" (${afterTokens} tokens) = ${saved} tokens saved`);
    }
    
    // Test individual words to understand the pattern
    console.log("\n=== Individual Word Token Counts ===");
    const individualWords = ["paragrpah", "paragraph", "enviornment", "environment", "beleev", "believe", "belief", "belie", "wrld", "wild", "weld"];
    for (const word of individualWords) {
        const tokens = await getTokenCount(word);
        console.log(`"${word}" (${word.length} chars) = ${tokens} tokens`);
    }
}

async function testAnalyzeParagraph() {
    await initSpellChecker();
    
    const testParagraph = "This is a paragrpah with some misspellings. I beleev that enviornment is important. The wrld needs our help.";
    
    console.log("\n=== Testing analyzeParagraphForCorrections ===");
    console.log("Input paragraph:", testParagraph);
    
    const corrections = await analyzeParagraphForCorrections(testParagraph);
    
    console.log("\nFound corrections:");
    corrections.forEach((correction, index) => {
        console.log(`${index + 1}. "${correction.before}" -> "${correction.after}" (tokens saved: ${correction.tokensSaved})`);
    });
    
    console.log(`\nTotal corrections found: ${corrections.length}`);
}

testAnalyzeParagraph();

function runDelete(name, input) {
    const output = removeFiller(input);
    
}