/**
 * Output Optimizer - Adds instructions to prompts to reduce AI output tokens
 * These functions modify prompts to encourage more concise responses
 */

/**
 * Adds a simple "be concise" instruction to the prompt
 * @param {string} prompt - The original prompt
 * @param {object} options - Configuration options
 * @param {string} options.position - Where to add instruction: 'start', 'end', or 'both' (default: 'end')
 * @returns {string} - Prompt with concise instruction added
 */
function addConciseInstruction(prompt, options = {}) {
  const { position = 'end' } = options;
  
  const concisePhrases = [
    'Be concise.',
    'Keep it brief.',
    'Provide a concise response.',
    'Be brief and to the point.',
    'Keep your response concise.'
  ];
  
  const instruction = concisePhrases[0]; // Default to first one
  
  if (position === 'start') {
    return `${instruction} ${prompt}`;
  } else if (position === 'both') {
    return `${instruction} ${prompt} ${instruction}`;
  } else {
    return `${prompt} ${instruction}`;
  }
}

/**
 * Adds a detailed concise instruction with token/word limits
 * @param {string} prompt - The original prompt
 * @param {object} options - Configuration options
 * @param {number} options.maxWords - Maximum words in response
 * @param {number} options.maxSentences - Maximum sentences in response
 * @param {string} options.position - Where to add instruction (default: 'end')
 * @returns {string} - Prompt with detailed concise instruction
 */
function addDetailedConciseInstruction(prompt, options = {}) {
  const { 
    maxWords = 100, 
    maxSentences = 3,
    position = 'end' 
  } = options;
  
  const instruction = `Please provide a concise response. Limit your answer to ${maxWords} words or ${maxSentences} sentences maximum. Be direct and avoid unnecessary elaboration.`;
  
  if (position === 'start') {
    return `${instruction}\n\n${prompt}`;
  } else if (position === 'both') {
    return `${instruction}\n\n${prompt}\n\n${instruction}`;
  } else {
    return `${prompt}\n\n${instruction}`;
  }
}

/**
 * Adds a format-specific concise instruction (bullet points, list, etc.)
 * @param {string} prompt - The original prompt
 * @param {object} options - Configuration options
 * @param {string} options.format - Response format: 'bullets', 'list', 'summary', 'brief' (default: 'brief')
 * @param {string} options.position - Where to add instruction (default: 'end')
 * @returns {string} - Prompt with format-specific instruction
 */
function addFormatConciseInstruction(prompt, options = {}) {
  const { format = 'brief', position = 'end' } = options;
  
  const formatInstructions = {
    bullets: 'Respond with concise bullet points only. No paragraphs.',
    list: 'Provide a brief numbered or bulleted list. Keep each item short.',
    summary: 'Provide a brief summary in 2-3 sentences maximum.',
    brief: 'Keep your response brief and focused. Avoid lengthy explanations.',
    outline: 'Provide a concise outline format. Use headings and brief points only.',
    table: 'If possible, format your response as a concise table or structured list.'
  };
  
  const instruction = formatInstructions[format] || formatInstructions.brief;
  
  if (position === 'start') {
    return `${instruction}\n\n${prompt}`;
  } else if (position === 'both') {
    return `${instruction}\n\n${prompt}\n\n${instruction}`;
  } else {
    return `${prompt}\n\n${instruction}`;
  }
}

/**
 * Adds a context-aware concise instruction based on prompt type
 * @param {string} prompt - The original prompt
 * @param {object} options - Configuration options
 * @param {string} options.level - Conciseness level: 'mild', 'moderate', 'aggressive' (default: 'moderate')
 * @param {string} options.position - Where to add instruction (default: 'end')
 * @returns {string} - Prompt with context-aware concise instruction
 */
function addContextAwareConciseInstruction(prompt, options = {}) {
  const { level = 'moderate', position = 'end' } = options;
  
  const levelInstructions = {
    mild: 'Please be somewhat concise in your response.',
    moderate: 'Please provide a concise response. Focus on the key points and avoid unnecessary details.',
    aggressive: 'Be extremely concise. Provide only essential information. Use the minimum words necessary to answer the question. Avoid examples, explanations, or elaboration unless absolutely necessary.'
  };
  
  const instruction = levelInstructions[level] || levelInstructions.moderate;
  
  if (position === 'start') {
    return `${instruction}\n\n${prompt}`;
  } else if (position === 'both') {
    return `${instruction}\n\n${prompt}\n\n${instruction}`;
  } else {
    return `${prompt}\n\n${instruction}`;
  }
}

/**
 * Adds a token-saving instruction with specific guidelines
 * @param {string} prompt - The original prompt
 * @param {object} options - Configuration options
 * @param {boolean} options.noExamples - Request no examples (default: true)
 * @param {boolean} options.noExplanations - Request minimal explanations (default: false)
 * @param {boolean} options.directAnswer - Request direct answer only (default: true)
 * @param {string} options.position - Where to add instruction (default: 'end')
 * @returns {string} - Prompt with token-saving instructions
 */
function addTokenSavingInstruction(prompt, options = {}) {
  const { 
    noExamples = true, 
    noExplanations = false,
    directAnswer = true,
    position = 'end' 
  } = options;
  
  let instructionParts = [];
  
  if (directAnswer) {
    instructionParts.push('Provide a direct answer');
  }
  
  if (noExamples) {
    instructionParts.push('no examples');
  }
  
  if (noExplanations) {
    instructionParts.push('minimal explanation');
  }
  
  instructionParts.push('be concise');
  
  const instruction = `Please ${instructionParts.join(', ')}.`;
  
  if (position === 'start') {
    return `${instruction}\n\n${prompt}`;
  } else if (position === 'both') {
    return `${instruction}\n\n${prompt}\n\n${instruction}`;
  } else {
    return `${prompt}\n\n${instruction}`;
  }
}

/**
 * Adds a TL;DR style instruction for very brief responses
 * @param {string} prompt - The original prompt
 * @param {object} options - Configuration options
 * @param {string} options.position - Where to add instruction (default: 'end')
 * @returns {string} - Prompt with TL;DR instruction
 */
function addTLDRInstruction(prompt, options = {}) {
  const { position = 'end' } = options;
  
  const instruction = 'TL;DR: Provide a very brief summary or answer.';
  
  if (position === 'start') {
    return `${instruction}\n\n${prompt}`;
  } else if (position === 'both') {
    return `${instruction}\n\n${prompt}\n\n${instruction}`;
  } else {
    return `${prompt}\n\n${instruction}`;
  }
}

/**
 * Main function - intelligently adds concise instructions based on prompt analysis
 * @param {string} prompt - The original prompt
 * @param {object} options - Configuration options
 * @param {string} options.strategy - Strategy to use: 'simple', 'detailed', 'format', 'context', 'token', 'tldr', 'auto' (default: 'auto')
 * @param {object} options.strategyOptions - Options to pass to the selected strategy
 * @returns {string} - Optimized prompt with concise instructions
 */
function optimizePromptForConciseOutput(prompt, options = {}) {
  if (!prompt || typeof prompt !== 'string') {
    return prompt;
  }
  
  const { 
    strategy = 'auto',
    strategyOptions = {}
  } = options;
  
  // Auto-detect strategy based on prompt characteristics
  if (strategy === 'auto') {
    const promptLower = prompt.toLowerCase();
    const promptLength = prompt.length;
    
    // Very short prompts might need more guidance
    if (promptLength < 50) {
      return addContextAwareConciseInstruction(prompt, { level: 'moderate', ...strategyOptions });
    }
    
    // Questions might benefit from direct answer format
    if (prompt.includes('?') || promptLower.includes('what') || promptLower.includes('how') || promptLower.includes('why')) {
      return addTokenSavingInstruction(prompt, { directAnswer: true, ...strategyOptions });
    }
    
    // Long prompts might need format instructions
    if (promptLength > 500) {
      return addFormatConciseInstruction(prompt, { format: 'summary', ...strategyOptions });
    }
    
    // Default to moderate concise instruction
    return addContextAwareConciseInstruction(prompt, { level: 'moderate', ...strategyOptions });
  }
  
  // Use specified strategy
  const strategies = {
    simple: addConciseInstruction,
    detailed: addDetailedConciseInstruction,
    format: addFormatConciseInstruction,
    context: addContextAwareConciseInstruction,
    token: addTokenSavingInstruction,
    tldr: addTLDRInstruction
  };
  
  const strategyFunction = strategies[strategy];
  if (strategyFunction) {
    return strategyFunction(prompt, strategyOptions);
  }
  
  // Fallback to simple
  return addConciseInstruction(prompt, strategyOptions);
}

/**
 * Batch optimize multiple prompts
 * @param {string[]} prompts - Array of prompts to optimize
 * @param {object} options - Configuration options (same as optimizePromptForConciseOutput)
 * @returns {string[]} - Array of optimized prompts
 */
function optimizePromptsBatch(prompts, options = {}) {
  if (!Array.isArray(prompts)) {
    return [];
  }
  
  return prompts.map(prompt => optimizePromptForConciseOutput(prompt, options));
}

/**
 * Get statistics about the optimization
 * @param {string} originalPrompt - Original prompt
 * @param {string} optimizedPrompt - Optimized prompt
 * @returns {object} - Statistics object
 */
function getOptimizationStats(originalPrompt, optimizedPrompt) {
  const originalLength = originalPrompt.length;
  const optimizedLength = optimizedPrompt.length;
  const addedLength = optimizedLength - originalLength;
  const addedPercent = originalLength > 0 
    ? ((addedLength / originalLength) * 100).toFixed(1) 
    : 0;
  
  return {
    originalLength,
    optimizedLength,
    addedLength,
    addedPercent: parseFloat(addedPercent),
    instructionAdded: addedLength > 0
  };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    optimizePromptForConciseOutput,
    addConciseInstruction,
    addDetailedConciseInstruction,
    addFormatConciseInstruction,
    addContextAwareConciseInstruction,
    addTokenSavingInstruction,
    addTLDRInstruction,
    optimizePromptsBatch,
    getOptimizationStats
  };
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
  window.outputOptimizer = {
    optimizePromptForConciseOutput,
    addConciseInstruction,
    addDetailedConciseInstruction,
    addFormatConciseInstruction,
    addContextAwareConciseInstruction,
    addTokenSavingInstruction,
    addTLDRInstruction,
    optimizePromptsBatch,
    getOptimizationStats
  };
}

