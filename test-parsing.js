// Test file to validate the parsing improvements
// Run with: node test-parsing.js

const testMessages = [
  // Basic expense patterns
  "spent 250 on lunch",
  "paid 100 for coffee", 
  "bought groceries for 800",
  "purchased textbooks for 1500",
  "250 on lunch",
  "lunch cost 200",
  "coffee 50 rupees",
  
  // Basic income patterns
  "received 5000 from salary",
  "earned 2000 from tutoring", 
  "got 3000 from freelance work",
  "made 1500 from part time job",
  "salary 25000",
  "5000 salary",
  
  // Edge cases that were failing
  "dinner 300",
  "movie tickets 400",
  "bus fare 20",
  "books 600",
  "freelance 2500",
  "pocket money 1000",
  
  // Complex patterns
  "spent ₹450 on groceries at the supermarket",
  "paid Rs. 200 for uber ride",
  "bought coffee and snacks for 150",
  "received monthly salary of ₹30000",
  
  // Potential problem cases
  "lunch", // no amount
  "spent on lunch", // no amount  
  "received from dad", // no amount
  "250", // just amount, no context
  "had a great day", // no financial info
];

console.log("Testing parsing patterns...\n");

testMessages.forEach((message, index) => {
  console.log(`${index + 1}. Testing: "${message}"`);
  
  // Test the patterns manually (simulating the parsing logic)
  const lowerMessage = message.toLowerCase();
  
  // Expense patterns
  const expensePatterns = [
    /spent\s+(\d+(?:\.\d+)?)\s+(?:on|for)\s+(.+)/i,
    /paid\s+(\d+(?:\.\d+)?)\s+(?:for|on)\s+(.+)/i,
    /bought\s+(.+?)\s+(?:for|at)\s+(\d+(?:\.\d+)?)/i,
    /purchased\s+(.+?)\s+(?:for|at)\s+(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s+(?:on|for|spent on)\s+(.+)/i,
    /(.+?)\s+(?:cost|costs)\s+(\d+(?:\.\d+)?)/i,
    /(.+?)\s+(\d+(?:\.\d+)?)\s*(?:rupees?|rs?\.?|₹)?$/i
  ];
  
  // Income patterns
  const incomePatterns = [
    /received\s+(\d+(?:\.\d+)?)\s+(?:as|from)\s+(.+)/i,
    /earned\s+(\d+(?:\.\d+)?)\s+(?:from|as)\s+(.+)/i,
    /got\s+(\d+(?:\.\d+)?)\s+(?:from|as)\s+(.+)/i,
    /made\s+(\d+(?:\.\d+)?)\s+(?:from|through)\s+(.+)/i,
    /(salary|income|wage)\s+(?:of\s+)?(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s+(?:salary|income|received)/i
  ];
  
  let matched = false;
  let result = null;
  
  // Try expense patterns
  for (const pattern of expensePatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      let amount, description;
      
      if (pattern.toString().includes('bought|purchased') || pattern.toString().includes('cost|costs')) {
        amount = parseFloat(match[2]);
        description = match[1].trim();
      } else {
        amount = parseFloat(match[1]);
        description = match[2]?.trim() || 'expense';
      }
      
      if (!isNaN(amount) && amount > 0) {
        result = { type: 'expense', amount, description };
        matched = true;
        break;
      }
    }
  }
  
  // Try income patterns if expense didn't match
  if (!matched) {
    for (const pattern of incomePatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        let amount, description;
        
        if (pattern.toString().includes('salary|income|wage')) {
          amount = parseFloat(match[2] || match[1]);
          description = match[1] === match[0].match(/\d+/)?.[0] ? 'income' : match[1];
        } else {
          amount = parseFloat(match[1]);
          description = match[2]?.trim() || 'income';
        }
        
        if (!isNaN(amount) && amount > 0) {
          result = { type: 'income', amount, description };
          matched = true;
          break;
        }
      }
    }
  }
  
  // Last resort: try to extract just numbers
  if (!matched) {
    const numberMatch = message.match(/(\d+(?:\.\d+)?)/);  
    if (numberMatch) {
      const amount = parseFloat(numberMatch[1]);
      if (amount > 0) {
        const isIncome = lowerMessage.match(/(salary|income|earned|received|got|made)/);
        const type = isIncome ? 'income' : 'expense';
        result = { type, amount, description: message };
        matched = true;
      }
    }
  }
  
  if (matched && result) {
    console.log(`   ✅ PARSED: ${result.type} ₹${result.amount} - ${result.description}`);
  } else {
    console.log(`   ❌ FAILED to parse`);
  }
  
  console.log("");
});

console.log("Test completed! The enhanced parsing should handle most of these cases better.");
