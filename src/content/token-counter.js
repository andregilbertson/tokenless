const { Tiktoken } = require("tiktoken/lite");
const o200k_base = require("tiktoken/encoders/o200k_base.json");

// Create a single shared encoder instance
const encoding = new Tiktoken(
  o200k_base.bpe_ranks,
  o200k_base.special_tokens,
  o200k_base.pat_str
);

function getTokenCount(str) {
  // Reuse the same encoder — much faster
  return encoding.encode(str).length;
}

module.exports = getTokenCount;
