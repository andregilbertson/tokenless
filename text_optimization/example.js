/**
 * Example usage of the text replacement function
 */

// Import the function (adjust path as needed)
// const { makeConcise, getReductionStats } = require('./replacement.js');

// Example 1: Basic usage
const example1 = `
It is important to note that in the event that you are in the process of 
making use of this function, you should give consideration to the fact that 
it has the ability to make your text more concise. Due to the fact that 
this is the case, you will be able to save a great deal of time.
`;

const concise1 = makeConcise(example1);
console.log('Example 1 - Original:');
console.log(example1);
console.log('\nExample 1 - Concise:');
console.log(concise1);
console.log('\nStats:', getReductionStats(example1, concise1));

// Example 2: With options
const example2 = `
The reason why is that it goes without saying that this function is 
absolutely essential for the purpose of creating very concise text. 
It is worth mentioning that you can make use of various different options 
to customize the behavior.
`;

const concise2 = makeConcise(example2, {
  removeFillers: true,
  simplifySentences: true,
  aggressive: false
});

console.log('\n\nExample 2 - Original:');
console.log(example2);
console.log('\nExample 2 - Concise:');
console.log(concise2);
console.log('\nStats:', getReductionStats(example2, concise2));

// Example 3: Aggressive mode
const example3 = `
Actually, it is basically the case that this is essentially a really 
very useful function. For all intents and purposes, it is kind of 
amazing how it can sort of make your text pretty much more concise.
`;

const concise3 = makeConcise(example3, {
  aggressive: true
});

console.log('\n\nExample 3 - Original:');
console.log(example3);
console.log('\nExample 3 - Concise (Aggressive):');
console.log(concise3);
console.log('\nStats:', getReductionStats(example3, concise3));

// Example 4: Real-world example
const example4 = `
In order to complete this task, it is necessary to take into account 
the fact that there are a number of different approaches that can be 
utilized. It should be pointed out that each and every approach has 
the ability to produce various different results. Due to the fact that 
this is the case, it is important to note that careful consideration 
should be given to the selection of the most appropriate approach.
`;

const concise4 = makeConcise(example4);
console.log('\n\nExample 4 - Original:');
console.log(example4);
console.log('\nExample 4 - Concise:');
console.log(concise4);
console.log('\nStats:', getReductionStats(example4, concise4));

