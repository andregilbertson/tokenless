const { Tiktoken } = require("js-tiktoken/lite");
const o200k_base = require("js-tiktoken/ranks/o200k_base");

// Create a single shared encoder instance
const encoding = new Tiktoken(o200k_base);

function getTokenCount(str) {
  // Reuse the same encoder — much faster
  return encoding.encode(str).length;
}

module.exports = getTokenCount;
