const {makeConcise} = require('../../text_optimization/replacement.js');
const {analyzeParagraphForCorrections} = require('../../text_optimization/spellcheck.js')
function processPromptText(text) {

    console.log("Spell Checking...");
    analyzeParagraphForCorrections(text).then((spellcheckSuggestions) => {
        console.log(spellcheckSuggestions);

        console.log("Replacing...");
        const replacementSuggestions = makeConcise(text);
        console.log(replacementSuggestions);

        console.log("Combining lists...");
        const allSuggestions = spellcheckSuggestions.concat(replacementSuggestions);
        console.log(allSuggestions);


    });
    //run through tokenizer or somethign
}


module.exports = processPromptText;
