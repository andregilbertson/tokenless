/**
 * Text Replacement Function - Makes text more concise
 * Removes redundancy, shortens verbose phrases, and simplifies language
 */

// Common verbose phrases and their concise replacements
const verboseReplacements = {
  // Time-based phrases
  'at this point in time': 'now',
  'at the present time': 'now',
  'in the near future': 'soon',
  'in the event that': 'if',
  'in order to': 'to',
  'in the process of': '',
  'for the purpose of': 'for',
  'with regard to': 'about',
  'with respect to': 'about',
  'in relation to': 'about',
  'in connection with': 'about',
  
  // Redundant phrases
  'each and every': 'each',
  'first and foremost': 'first',
  'various different': 'various',
  'free gift': 'gift',
  'past history': 'history',
  'future plans': 'plans',
  'end result': 'result',
  'final outcome': 'outcome',
  'basic fundamentals': 'fundamentals',
  'true facts': 'facts',
  'completely finished': 'finished',
  'absolutely essential': 'essential',
  'very unique': 'unique',
  'exactly identical': 'identical',
  
  // Wordy constructions
  'due to the fact that': 'because',
  'owing to the fact that': 'because',
  'the reason why is that': 'because',
  'it is important to note that': '',
  'it should be pointed out that': '',
  'it is worth mentioning that': '',
  'it is necessary to': 'must',
  'there is a need to': 'must',
  'has the ability to': 'can',
  'has the capacity to': 'can',
  'is able to': 'can',
  'is in a position to': 'can',
  'make use of': 'use',
  'give consideration to': 'consider',
  'take into account': 'consider',
  'come to a conclusion': 'conclude',
  'reach a decision': 'decide',
  'put forward': 'propose',
  'carry out': 'do',
  'carry on': 'continue',
  
  // Filler phrases
  'as a matter of fact': 'actually',
  'in actual fact': 'actually',
  'the fact of the matter is': '',
  'it goes without saying': '',
  'needless to say': '',
  'for all intents and purposes': 'essentially',
  'more often than not': 'usually',
  
  // Prepositional phrases
  'in the case of': 'for',
  'in terms of': 'for',
  'on the part of': 'by',
  'on behalf of': 'for',
  'in the absence of': 'without',
  'in the presence of': 'with',
  
  // Adverb intensifiers (often redundant)
  'very very': 'very',
  'really really': 'really',
  'quite quite': 'quite',
};

// Redundant word patterns (words that can often be removed)
const redundantWords = [
  /\bvery\s+(unique|perfect|complete|entire|full|empty|dead|alive|free|sure|certain|true|false|equal|identical|different|similar|same)\b/gi,
  /\bquite\s+(unique|perfect|complete|entire|full|empty|dead|alive|free|sure|certain|true|false|equal|identical|different|similar|same)\b/gi,
  /\breally\s+(unique|perfect|complete|entire|full|empty|dead|alive|free|sure|certain|true|false|equal|identical|different|similar|same)\b/gi,
  /\babsolutely\s+(unique|perfect|complete|entire|full|empty|dead|alive|free|sure|certain|true|false|equal|identical|different|similar|same)\b/gi,
  /\bcompletely\s+(finished|done|empty|full|unique|perfect|complete|entire|dead|alive|free|sure|certain|true|false|equal|identical|different|similar|same)\b/gi,
  /\btotally\s+(unique|perfect|complete|entire|full|empty|dead|alive|free|sure|certain|true|false|equal|identical|different|similar|same)\b/gi,
];

// Common wordy phrases that can be shortened
const wordyPhrases = [
  { pattern: /\bin the event that\b/gi, replacement: 'if' },
  { pattern: /\bin order to\b/gi, replacement: 'to' },
  { pattern: /\bfor the purpose of\b/gi, replacement: 'for' },
  { pattern: /\bwith regard to\b/gi, replacement: 'about' },
  { pattern: /\bwith respect to\b/gi, replacement: 'about' },
  { pattern: /\bin relation to\b/gi, replacement: 'about' },
  { pattern: /\bdue to the fact that\b/gi, replacement: 'because' },
  { pattern: /\bowing to the fact that\b/gi, replacement: 'because' },
  { pattern: /\bit is important to note that\b/gi, replacement: '' },
  { pattern: /\bit should be pointed out that\b/gi, replacement: '' },
  { pattern: /\bit is worth mentioning that\b/gi, replacement: '' },
  { pattern: /\bhas the ability to\b/gi, replacement: 'can' },
  { pattern: /\bis able to\b/gi, replacement: 'can' },
  { pattern: /\bmake use of\b/gi, replacement: 'use' },
  { pattern: /\bgive consideration to\b/gi, replacement: 'consider' },
  { pattern: /\btake into account\b/gi, replacement: 'consider' },
];

/**
 * Removes redundant words and phrases
 */
function removeRedundancy(text) {
  let result = text;
  
  // Apply verbose phrase replacements
  for (const [verbose, concise] of Object.entries(verboseReplacements)) {
    const regex = new RegExp(verbose.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, concise);
  }
  
  // Remove redundant word patterns
  redundantWords.forEach(pattern => {
    result = result.replace(pattern, (match) => {
      // Extract the word after the intensifier
      const words = match.trim().split(/\s+/);
      return words[words.length - 1];
    });
  });
  
  // Apply wordy phrase replacements
  wordyPhrases.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });
  
  return result;
}

/**
 * Removes unnecessary filler words and phrases
 */
function removeFillers(text) {
  const fillerPhrases = [
    /\bas a matter of fact\b/gi,
    /\bin actual fact\b/gi,
    /\bthe fact of the matter is\b/gi,
    /\bit goes without saying\b/gi,
    /\bneedless to say\b/gi,
    /\bfor all intents and purposes\b/gi,
    /\bmore often than not\b/gi,
    /\bit is important to note that\b/gi,
    /\bit should be pointed out that\b/gi,
    /\bit is worth mentioning that\b/gi,
  ];
  
  let result = text;
  fillerPhrases.forEach(pattern => {
    result = result.replace(pattern, '');
  });
  
  return result;
}

/**
 * Simplifies complex sentence structures
 */
function simplifySentences(text) {
  let result = text;
  
  // Remove unnecessary "that"
  result = result.replace(/\bthat\s+that\b/gi, 'that');
  result = result.replace(/\b(think|believe|know|say|see|feel|hope|wish|expect|assume|suppose|imagine|realize|understand|remember|forget|notice|hear|watch|observe|discover|find|show|prove|demonstrate|indicate|suggest|imply|mean|signify|imply|reveal|indicate|point out|make clear|make sure|make certain)\s+that\b/gi, '$1');
  
  // Simplify "there is/are" constructions
  result = result.replace(/\bthere is\s+(a|an|the)\s+/gi, 'a ');
  result = result.replace(/\bthere are\s+/gi, '');
  
  // Remove unnecessary "of" in certain contexts
  result = result.replace(/\ba number of\b/gi, 'many');
  result = result.replace(/\ba lot of\b/gi, 'many');
  result = result.replace(/\ba great deal of\b/gi, 'much');
  result = result.replace(/\ba large amount of\b/gi, 'much');
  
  return result;
}

/**
 * Removes extra whitespace and cleans up formatting
 */
function cleanWhitespace(text) {
  return text
    .replace(/\s+/g, ' ')           // Multiple spaces to single space
    .replace(/\s+([.,!?;:])/g, '$1') // Remove space before punctuation
    .replace(/([.,!?;:])\s+/g, '$1 ') // Ensure space after punctuation
    .replace(/\s+$/gm, '')          // Remove trailing spaces
    .replace(/^\s+/gm, '')           // Remove leading spaces
    .replace(/\n{3,}/g, '\n\n')      // Multiple newlines to double
    .trim();
}

/**
 * Main function to make text more concise
 * @param {string} text - The text to make concise
 * @param {object} options - Configuration options
 * @param {boolean} options.removeFillers - Remove filler phrases (default: true)
 * @param {boolean} options.simplifySentences - Simplify sentence structures (default: true)
 * @param {boolean} options.aggressive - More aggressive replacements (default: false)
 * @returns {string} - The concise version of the text
 */
function makeConcise(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  const {
    removeFillers: shouldRemoveFillers = true,
    simplifySentences: shouldSimplify = true,
    aggressive = false
  } = options;
  
  let result = text;
  
  // Step 1: Remove redundancy
  result = removeRedundancy(result);
  
  // Step 2: Remove fillers (if enabled)
  if (shouldRemoveFillers) {
    result = removeFillers(result);
  }
  
  // Step 3: Simplify sentences (if enabled)
  if (shouldSimplify) {
    result = simplifySentences(result);
  }
  
  // Step 4: Aggressive mode - additional replacements
  if (aggressive) {
    // Remove more filler words
    result = result.replace(/\b(actually|basically|essentially|literally|really|very|quite|rather|somewhat|pretty|fairly|quite|rather|somewhat)\s+/gi, '');
    
    // Remove unnecessary qualifiers
    result = result.replace(/\b(kind of|sort of|type of)\s+/gi, '');
    
    // Simplify "is/are" + adjective constructions where possible
    result = result.replace(/\bis\s+the\s+case\s+that\b/gi, '');
  }
  
  // Step 5: Clean up whitespace
  result = cleanWhitespace(result);
  
  return result;
}

/**
 * Get statistics about text reduction
 * @param {string} original - Original text
 * @param {string} concise - Concise text
 * @returns {object} - Statistics object
 */
function getReductionStats(original, concise) {
  const originalLength = original.length;
  const conciseLength = concise.length;
  const reduction = originalLength - conciseLength;
  const reductionPercent = originalLength > 0 
    ? ((reduction / originalLength) * 100).toFixed(1) 
    : 0;
  
  const originalWords = original.split(/\s+/).filter(w => w.length > 0).length;
  const conciseWords = concise.split(/\s+/).filter(w => w.length > 0).length;
  const wordReduction = originalWords - conciseWords;
  const wordReductionPercent = originalWords > 0
    ? ((wordReduction / originalWords) * 100).toFixed(1)
    : 0;
  
  return {
    originalLength,
    conciseLength,
    reduction,
    reductionPercent: parseFloat(reductionPercent),
    originalWords,
    conciseWords,
    wordReduction,
    wordReductionPercent: parseFloat(wordReductionPercent)
  };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    makeConcise,
    getReductionStats,
    removeRedundancy,
    removeFillers,
    simplifySentences,
    cleanWhitespace
  };
}

// Example usage (for testing)
if (typeof window !== 'undefined') {
  window.textReplacement = {
    makeConcise,
    getReductionStats,
    removeRedundancy,
    removeFillers,
    simplifySentences,
    cleanWhitespace
  };
}

