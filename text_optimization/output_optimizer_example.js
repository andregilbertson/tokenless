/**
 * Example usage of the output optimizer functions
 */

// Example 1: Simple concise instruction
const prompt1 = "Explain how machine learning works";
const optimized1 = optimizePromptForConciseOutput(prompt1, { strategy: 'simple' });
console.log('Example 1 - Simple:');
console.log('Original:', prompt1);
console.log('Optimized:', optimized1);
console.log('Stats:', getOptimizationStats(prompt1, optimized1));

// Example 2: Detailed with word limits
const prompt2 = "Describe the process of photosynthesis in detail";
const optimized2 = optimizePromptForConciseOutput(prompt2, { 
  strategy: 'detailed',
  strategyOptions: { maxWords: 50, maxSentences: 2 }
});
console.log('\n\nExample 2 - Detailed:');
console.log('Original:', prompt2);
console.log('Optimized:', optimized2);

// Example 3: Format-specific (bullet points)
const prompt3 = "List the benefits of exercise";
const optimized3 = optimizePromptForConciseOutput(prompt3, { 
  strategy: 'format',
  strategyOptions: { format: 'bullets' }
});
console.log('\n\nExample 3 - Format (bullets):');
console.log('Original:', prompt3);
console.log('Optimized:', optimized3);

// Example 4: Context-aware (aggressive)
const prompt4 = "What are the main causes of climate change?";
const optimized4 = optimizePromptForConciseOutput(prompt4, { 
  strategy: 'context',
  strategyOptions: { level: 'aggressive' }
});
console.log('\n\nExample 4 - Context-aware (aggressive):');
console.log('Original:', prompt4);
console.log('Optimized:', optimized4);

// Example 5: Token-saving (no examples, direct answer)
const prompt5 = "How do I learn Python programming?";
const optimized5 = optimizePromptForConciseOutput(prompt5, { 
  strategy: 'token',
  strategyOptions: { noExamples: true, directAnswer: true }
});
console.log('\n\nExample 5 - Token-saving:');
console.log('Original:', prompt5);
console.log('Optimized:', optimized5);

// Example 6: TL;DR style
const prompt6 = "Summarize the history of the internet";
const optimized6 = optimizePromptForConciseOutput(prompt6, { strategy: 'tldr' });
console.log('\n\nExample 6 - TL;DR:');
console.log('Original:', prompt6);
console.log('Optimized:', optimized6);

// Example 7: Auto-detect (intelligent)
const prompt7 = "What is artificial intelligence?";
const optimized7 = optimizePromptForConciseOutput(prompt7, { strategy: 'auto' });
console.log('\n\nExample 7 - Auto-detect:');
console.log('Original:', prompt7);
console.log('Optimized:', optimized7);

// Example 8: Batch processing
const prompts = [
  "Explain quantum computing",
  "What is blockchain?",
  "Describe the water cycle"
];
const optimizedBatch = optimizePromptsBatch(prompts, { strategy: 'simple' });
console.log('\n\nExample 8 - Batch:');
console.log('Original prompts:', prompts);
console.log('Optimized prompts:', optimizedBatch);

