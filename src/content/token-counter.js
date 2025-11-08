const { Tiktoken } = require("tiktoken/lite");
const o200k_base = require("tiktoken/encoders/o200k_base.json");

function getTokenCount(str) {
    const encoding = new Tiktoken(
        o200k_base.bpe_ranks,
        o200k_base.special_tokens,
        o200k_base.pat_str
    );
    const tokens = encoding.encode(str);
    return tokens.length;
}

module.exports = getTokenCount;
