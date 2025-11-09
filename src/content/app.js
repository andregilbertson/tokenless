const {makeConcise} = require('../../text_optimization/replacement.js');
function processPromptText(text) {
    console.log("Processing:", text);
    console.log(makeConcise(text));

    //run through tokenizer or somethign
}

module.exports = processPromptText;
