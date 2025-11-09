const {makeConcise} = require('../../text_optimization/replacement.js');
const {analyzeParagraphForCorrections} = require('../../text_optimization/spellcheck.js')
function processPromptText(text) {
    console.log("Processing:", text);
    console.log(makeConcise(text));

    console.log("Spell Checking...");
    console.log(analyzeParagraphForCorrections(text));
    //run through tokenizer or somethign
}


module.exports = processPromptText;
