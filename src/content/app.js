const {makeConcise} = require('../../text_optimization/replacement.js');
const {analyzeParagraphForCorrections} = require('../../text_optimization/spellcheck.js');
const {findDeletions} = require('../../text_optimization/delete.js');

function processPromptText(text) {
    console.log("Spell Checking...");
    return analyzeParagraphForCorrections(text).then((spellcheckSuggestions) => {
        console.log(spellcheckSuggestions);

        console.log("Replacing...");
        const replacementSuggestions = makeConcise(text);
        console.log(replacementSuggestions);

        console.log("Finding deletions...");
        const deletionSuggestions = findDeletions(text);
        console.log(deletionSuggestions);

        console.log("Combining lists...");
        var allSuggestions = spellcheckSuggestions.concat(replacementSuggestions).concat(deletionSuggestions);
        console.log(allSuggestions);
        return allSuggestions;

    });
}


module.exports = processPromptText;
