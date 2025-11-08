import nlp from "compromise";

//remove please at beginning or end 
function removePlease(text) {
    let output = text;

    //remove please from start
    output = output.replace(/^\s*please[, ]+/i, "");
    //remove please from end
    output = output.replace(/[, ]*please[.!?]?\s*$/i, "");

    return output.trim();
}

//removes thanks or thank you from end
function removeThanks(text) {
    return text
        .replace(/[, ]*(thank you|thanks)[.!?]?\s*$/i, "")
        .trim();
}

//removes all adverbs
function removeAdverbs(text) {
    const doc = nlp(text);
    doc.delete("#Adverb");
    return doc.text();
}

export function removeFiller(text) {
    let output = text;

    output = removeAdverbs(output);
    output = removePlease(output);
    output = removeThanks(output);

    output = output.replace(/\s{2,}/g, " ").trim();
    return output;
}