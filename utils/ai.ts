// Using Google Gemini API for AI-powered financial parsing and tips

export interface ParsedFinanceData {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  created_at: string;
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Query Google Gemini API for AI-powered responses
async function queryGeminiModel(prompt: string): Promise<string> {
  // If no API key is provided, throw an error to trigger fallback
  if (!GEMINI_API_KEY) {
    throw new Error('No Gemini API key provided - falling back to rule-based parsing');
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-goog-api-key': GEMINI_API_KEY,
  };
  
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Gemini API key - falling back to rule-based parsing');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.candidates && result.candidates.length > 0 && 
        result.candidates[0].content && result.candidates[0].content.parts && 
        result.candidates[0].content.parts.length > 0) {
      return result.candidates[0].content.parts[0].text || '';
    } else {
      throw new Error('Unexpected response format from Gemini API');
    }
  } catch (error) {
    console.warn('Gemini API failed, falling back to rule-based parsing:', error);
    throw error;
  }
}

// Smart rule-based parsing for common patterns
function tryRuleBasedParsing(message: string): ParsedFinanceData | null {
  const cleanMessage = message.toLowerCase().trim();
  
  // Enhanced patterns for different ways people express transactions
  const patterns = [
    // Spending patterns
    { regex: /(?:spent|paid|bought|purchased?)\s+(₹?[\d,]+(?:\.\d{2})?)\s+(?:on|for|at)\s+(.+)/i, type: 'expense' },
    { regex: /(?:bought|got)\s+(.+?)\s+(?:for|at|costs?)\s+(₹?[\d,]+(?:\.\d{2})?)/i, type: 'expense', flip: true },
    { regex: /(₹?[\d,]+(?:\.\d{2})?)\s+(?:on|for)\s+(.+)/i, type: 'expense' },
    
    // Income patterns
    { regex: /(?:received|earned|got|made)\s+(₹?[\d,]+(?:\.\d{2})?)\s+(?:from|as|for)\s+(.+)/i, type: 'income' },
    { regex: /(?:salary|wage|income|freelance|job)\s+(?:of\s+)?(₹?[\d,]+(?:\.\d{2})?)/i, type: 'income', desc: 'salary' },
  ];
  
  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern.regex);
    if (match) {
      let amount: number;
      let description: string;
      
      if (pattern.flip) {
        amount = parseFloat(match[2].replace(/[₹$,]/g, ''));
        description = match[1].trim();
      } else {
        amount = parseFloat(match[1].replace(/[₹$,]/g, ''));
        description = pattern.desc || match[2]?.trim() || 'transaction';
      }
      
      if (!isNaN(amount) && amount > 0) {
        return {
          id: `rule-${Date.now()}`,
          user_id: '',
          type: pattern.type as 'income' | 'expense',
          amount: amount,
          category: guessCategory(description),
          description: description,
          created_at: new Date().toISOString(),
        };
      }
    }
  }
  
  return null;
}

// New function to handle general financial advice and app questions
export async function generateFinancialAdvice(message: string, transactions: ParsedFinanceData[]): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  // Calculate user's financial summary for context
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const balance = totalIncome - totalExpenses;
  
  // Category spending analysis
  const categorySpending: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + parseFloat(t.amount.toString());
  });
  const topCategories = Object.entries(categorySpending).sort(([,a], [,b]) => b - a).slice(0, 3);
  
  if (GEMINI_API_KEY) {
    try {
      const contextPrompt = `You are a friendly financial advisor integrated into ClearBudget, a personal finance tracking app. The user is asking: "${message}"

User's Current Financial Status:
- Total Income: ₹${totalIncome.toLocaleString()}
- Total Expenses: ₹${totalExpenses.toLocaleString()}
- Balance: ₹${balance.toLocaleString()}
- Top spending categories: ${topCategories.map(([cat, amt]) => `${cat} (₹${amt.toLocaleString()})`).join(', ')}
- Total transactions tracked: ${transactions.length}

ClearBudget App Features:
- AI-powered expense tracking through natural language chat
- Automatic categorization of expenses
- Visual charts and analytics
- Smart financial tips
- Income and expense tracking
- Balance monitoring

Provide a helpful, conversational response as their financial buddy. Be supportive, practical, and reference their actual data when relevant. Keep it friendly and in simple language. No quotes or formal language - talk like a helpful friend.

If they're asking about the app, explain ClearBudget features. If it's financial advice, make it personalized to their situation.`;
      
      const response = await queryGeminiModel(contextPrompt);
      
      // Clean up the response
      return response.replace(/^["']|["']$/g, '').trim();
    } catch (error) {
      console.warn('AI advice generation failed, using rule-based response:', error);
    }
  }
  
  // Rule-based responses for common questions
  if (lowerMessage.includes('budget') || lowerMessage.includes('how much should i spend')) {
    const spendingAdvice = balance > 0 
      ? `Hey! Based on your ₹${totalIncome.toLocaleString()} income and current spending, you're doing okay! Try the 50/30/20 rule: ₹${(totalIncome * 0.5).toLocaleString()} for needs, ₹${(totalIncome * 0.3).toLocaleString()} for wants, and ₹${(totalIncome * 0.2).toLocaleString()} for savings.`
      : `Your current expenses are ₹${totalExpenses.toLocaleString()} vs income of ₹${totalIncome.toLocaleString()}. Let's work on reducing expenses by ₹${Math.abs(balance).toLocaleString()} to get back on track!`;
    return spendingAdvice;
  }
  
  if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
    if (balance > totalIncome * 0.2) {
      return `🎉 You're already saving well with ₹${balance.toLocaleString()} leftover! Consider investing in SIPs or FDs for better growth. Even ₹1000/month in SIP can grow to lakhs over time!`;
    } else if (balance > 0) {
      return `You have ₹${balance.toLocaleString()} left after expenses. Try to increase this to at least 20% of income (₹${(totalIncome * 0.2).toLocaleString()}). Start by reducing your top expense category!`;
    } else {
      return `First, let's balance your spending! You're ₹${Math.abs(balance).toLocaleString()} in the red. Use ClearBudget's charts to see where most money goes and cut back there.`;
    }
  }
  
  if (lowerMessage.includes('invest') || lowerMessage.includes('where to invest')) {
    return `💡 Great question! For beginners, start with SIPs in diversified mutual funds. Once you have 6-month emergency fund, consider: 1) ELSS for tax saving 2) Index funds for steady growth 3) FD for safe returns. Start small with ₹500-1000 monthly!`;
  }
  
  if (lowerMessage.includes('app') || lowerMessage.includes('clearbudget') || lowerMessage.includes('how to use')) {
    return `🚀 ClearBudget makes money tracking super easy! Just chat with me like: 'spent 250 on lunch', 'got 5000 salary', 'bought coffee for 50'. I'll automatically categorize everything! Check the Analytics tab for spending charts and Smart Tips for personalized advice. Everything updates in real-time!`;
  }
  
  if (lowerMessage.includes('emergency fund') || lowerMessage.includes('emergency')) {
    const recommendedEmergency = totalExpenses * 6;
    return `💪 Emergency funds are crucial! Aim for 6 months of expenses = ₹${recommendedEmergency.toLocaleString()}. Seems big? Start with ₹500-1000 monthly in a separate savings account. Use ClearBudget to track this as 'emergency fund' income!`;
  }
  
  // Default helpful response
  return `🤔 I'm here to help with all your money questions! You can ask me about budgeting, saving, investing, or how to use ClearBudget better. Your current balance is ₹${balance.toLocaleString()} - want specific advice about improving it?`;
}

export async function parseFinanceMessage(message: string): Promise<ParsedFinanceData> {
  // First try the smart rule-based parsing for common patterns
  const ruleBasedResult = tryRuleBasedParsing(message);
  if (ruleBasedResult) {
    return ruleBasedResult;
  }

  // If rule-based parsing fails, try AI parsing
  const prompt = `You are a financial assistant that parses user messages about money transactions in Indian Rupees (₹). Extract transaction details and respond ONLY with valid JSON in this exact format:
{"type": "income" or "expense", "amount": number, "category": string, "description": string}

Common categories: food, rent, transport, entertainment, shopping, salary, freelance, others
Note: Amount should be in Indian Rupees without currency symbol.

Parse this transaction: "${message}"

Respond with only the JSON object, no additional text.`;
  
  try {
    console.log("Trying AI parsing for:", message);
    const text = await queryGeminiModel(prompt);
    console.log("Received response from AI:", text);
    
    // Clean the text to ensure it's valid JSON
    let cleanedText = text.replace(/```json\n?|```\n?|```/g, '').trim();
    
    // Extract JSON from the response if it contains additional text
    const jsonMatch = cleanedText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    // Additional cleanup for common AI response issues
    cleanedText = cleanedText.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    // Handle cases where AI returns explanatory text with JSON
    if (!cleanedText.startsWith('{')) {
      const fallbackMatch = text.match(/\{[\s\S]*?\}/);
      if (fallbackMatch) {
        cleanedText = fallbackMatch[0];
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }
    
    console.log("Cleaned text for parsing:", cleanedText);
    const parsedData = JSON.parse(cleanedText);

    // Validate and enhance the parsed data with better fallbacks
    console.log("Raw parsed data:", parsedData);
    
    // Auto-fix missing or invalid type
    if (!parsedData.type || (parsedData.type !== 'income' && parsedData.type !== 'expense')) {
      // Try to guess type from message content
      if (message.toLowerCase().match(/(spent|paid|bought|purchased|cost|expense)/)) {
        parsedData.type = 'expense';
      } else if (message.toLowerCase().match(/(received|earned|got|made|income|salary)/)) {
        parsedData.type = 'income';
      } else {
        parsedData.type = 'expense'; // Default to expense
      }
    }
    
    // Auto-fix missing or invalid amount
    let amount = 0;
    if (parsedData.amount) {
      amount = typeof parsedData.amount === 'string' ? parseFloat(parsedData.amount) : parsedData.amount;
    }
    
    // If amount is still invalid, try to extract from original message
    if (!amount || isNaN(amount) || amount <= 0) {
      const amountMatch = message.match(/(\d+(?:\.\d{1,2})?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1]);
      }
    }
    
    // If still no valid amount, throw error
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error("Could not extract valid amount from message");
    }
    
    // Auto-fix missing category
    if (!parsedData.category || typeof parsedData.category !== 'string' || parsedData.category.trim() === '') {
      parsedData.category = guessCategory(parsedData.description || message);
    }
    
    // Auto-fix missing description
    if (!parsedData.description || typeof parsedData.description !== 'string' || parsedData.description.trim() === '') {
      parsedData.description = message;
    }

    // Return the properly formatted data
    return {
      id: `ai-${Date.now()}`,
      user_id: '', // Will be filled by the calling function
      type: parsedData.type as 'income' | 'expense',
      amount: amount,
      category: parsedData.category.toLowerCase(),
      description: parsedData.description,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error parsing Gemini response or invalid JSON:", error);
    // Fallback to rule-based parsing if AI response is problematic
    return fallbackParseFinanceMessage(message);
  }
}

// Enhanced fallback parsing with comprehensive pattern matching
function fallbackParseFinanceMessage(message: string): ParsedFinanceData {
  const lowerMessage = message.toLowerCase();
  
  // More comprehensive expense patterns
  const expensePatterns = [
    /spent\s+(\d+(?:\.\d+)?)\s+(?:on|for)\s+(.+)/i,
    /paid\s+(\d+(?:\.\d+)?)\s+(?:for|on)\s+(.+)/i,
    /bought\s+(.+?)\s+(?:for|at)\s+(\d+(?:\.\d+)?)/i,
    /purchased\s+(.+?)\s+(?:for|at)\s+(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s+(?:on|for|spent on)\s+(.+)/i,
    /(.+?)\s+(?:cost|costs)\s+(\d+(?:\.\d+)?)/i,
    /(.+?)\s+(\d+(?:\.\d+)?)\s*(?:rupees?|rs?\.?|₹)?$/i
  ];
  
  // Try expense patterns
  for (const pattern of expensePatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      let amount, description;
      
      // Handle different pattern formats
      if (pattern.toString().includes('bought|purchased') || pattern.toString().includes('cost|costs')) {
        amount = parseFloat(match[2]);
        description = match[1].trim();
      } else {
        amount = parseFloat(match[1]);
        description = match[2]?.trim() || 'expense';
      }
      
      if (!isNaN(amount) && amount > 0) {
        return {
          id: `fallback-${Date.now()}`,
          user_id: '',
          type: 'expense',
          amount: amount,
          category: guessCategory(description),
          description: description,
          created_at: new Date().toISOString(),
        };
      }
    }
  }
  
  // More comprehensive income patterns
  const incomePatterns = [
    /received\s+(\d+(?:\.\d+)?)\s+(?:as|from)\s+(.+)/i,
    /earned\s+(\d+(?:\.\d+)?)\s+(?:from|as)\s+(.+)/i,
    /got\s+(\d+(?:\.\d+)?)\s+(?:from|as)\s+(.+)/i,
    /made\s+(\d+(?:\.\d+)?)\s+(?:from|through)\s+(.+)/i,
    /(salary|income|wage)\s+(?:of\s+)?(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s+(?:salary|income|received)/i
  ];
  
  // Try income patterns
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
        return {
          id: `fallback-${Date.now()}`,
          user_id: '',
          type: 'income',
          amount: amount,
          category: 'salary',
          description: description,
          created_at: new Date().toISOString(),
        };
      }
    }
  }
  
  // Last resort: try to extract just numbers and guess context
  const numberMatch = message.match(/(\d+(?:\.\d+)?)/);  
  if (numberMatch) {
    const amount = parseFloat(numberMatch[1]);
    if (amount > 0) {
      // Guess type based on keywords
      const isIncome = lowerMessage.match(/(salary|income|earned|received|got|made)/);
      const type = isIncome ? 'income' : 'expense';
      
      return {
        id: `fallback-${Date.now()}`,
        user_id: '',
        type: type,
        amount: amount,
        category: isIncome ? 'salary' : guessCategory(message),
        description: message,
        created_at: new Date().toISOString(),
      };
    }
  }
  
  throw new Error('Could not parse the finance message. Please include an amount and describe the transaction clearly.');
}

function guessCategory(description: string): string {
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes('food') || lowerDesc.includes('lunch') || lowerDesc.includes('dinner')) return 'food';
  if (lowerDesc.includes('rent') || lowerDesc.includes('housing')) return 'rent';
  if (lowerDesc.includes('bus') || lowerDesc.includes('train') || lowerDesc.includes('uber')) return 'transport';
  if (lowerDesc.includes('movie') || lowerDesc.includes('game') || lowerDesc.includes('concert')) return 'entertainment';
  if (lowerDesc.includes('clothes') || lowerDesc.includes('shopping')) return 'shopping';
  return 'others';
}

export async function generateFinancialTips(transactions: ParsedFinanceData[]): Promise<string[]> {
  if (!transactions || transactions.length === 0) {
    return [
      "Hey buddy! 👋 Start tracking your expenses here in ClearBudget to unlock personalized financial insights!",
      "💡 Pro tip: Once you log some transactions, I'll analyze your spending patterns and give you smart money advice!",
      "🎯 ClearBudget makes it super easy - just chat with me like 'spent 250 on lunch' and I'll handle the rest!"
    ];
  }

  // First try to use AI for personalized tips
  if (GEMINI_API_KEY) {
    try {
      // Calculate key metrics for context
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const balance = totalIncome - totalExpenses;
      
      // Category breakdown
      const categorySpending: Record<string, number> = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + parseFloat(t.amount.toString());
      });
      
      const recentTransactions = transactions.slice(-15)
        .map(t => `${t.type} ₹${t.amount} on ${t.category} - ${t.description || 'no description'}`)
        .join('\n');
        
      const prompt = `You are a friendly financial buddy helping an Indian user with their money management through the ClearBudget app. Be conversational, supportive, and use simple language like talking to a close friend.

User's Financial Summary:
- Total Income: ₹${totalIncome.toLocaleString()}
- Total Expenses: ₹${totalExpenses.toLocaleString()}
- Current Balance: ₹${balance.toLocaleString()}
- Top spending categories: ${Object.entries(categorySpending).sort(([,a], [,b]) => b - a).slice(0, 3).map(([cat, amt]) => `${cat} (₹${amt.toLocaleString()})`).join(', ')}

Recent Transactions:
${recentTransactions}

Provide 4-5 personalized financial tips as a supportive friend. Each tip should:
- Start with a relevant emoji
- Be conversational and encouraging
- Reference their actual spending patterns
- Mention ClearBudget features when helpful
- Be practical for Indian context
- No double quotes, keep it natural

Format: Just the tips, one per line, no numbering or bullet points.`;
      
      console.log("Generating personalized tips...");
      const text = await queryGeminiModel(prompt);
      console.log("Received tips from AI:", text);
      
      // Clean and format the tips
      const tips = text
        .split('\n')
        .map(tip => tip.trim())
        .filter(tip => tip.length > 20 && tip.length < 300)
        .map(tip => {
          // Remove any numbering or bullet points
          tip = tip.replace(/^[\d\-\*\.\)\s]+/, '');
          // Remove quotes if present
          tip = tip.replace(/^["']|["']$/g, '');
          // Ensure it starts with emoji or add one
          if (!/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(tip)) {
            tip = '💡 ' + tip;
          }
          return tip;
        })
        .slice(0, 5);
      
      if (tips.length > 0) {
        return tips;
      }
    } catch (error) {
      console.warn('AI tips generation failed, using personalized rule-based tips:', error);
    }
  }
  
  // Enhanced rule-based personalized tips
  return generatePersonalizedRuleBasedTips(transactions);
}

// Generate personalized buddy-style tips based on spending patterns
function generatePersonalizedRuleBasedTips(transactions: ParsedFinanceData[]): string[] {
  const tips: string[] = [];
  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');
  
  const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const balance = totalIncome - totalExpenses;
  
  // Analyze spending by category
  const categorySpending: Record<string, number> = {};
  expenses.forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + parseFloat(t.amount.toString());
  });
  
  const topCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  // Welcome message for new users
  if (transactions.length < 5) {
    tips.push("👋 Hey there! Great start tracking your money in ClearBudget! Keep logging transactions to get more personalized insights.");
  }
  
  // Balance-based tips
  if (balance < 0) {
    tips.push("🚨 Buddy, you're spending more than you're earning! Let's work together to create a budget and find areas to cut back.");
  } else if (balance > 0 && balance < totalIncome * 0.1) {
    tips.push("🔥 You're living paycheck to paycheck! Try to save at least 10-20% of your income. Even ₹500/month is a great start!");
  } else if (balance > totalIncome * 0.3) {
    tips.push("🎆 Awesome! You're saving well! Consider investing some of that surplus in SIPs or fixed deposits for better returns.");
  }
  
  // Category-specific personalized tips
  if (topCategories.length > 0) {
    const [topCategory, topAmount] = topCategories[0];
    const percentage = (topAmount / totalExpenses) * 100;
    
    if (topCategory === 'food' && percentage > 30) {
      tips.push(`🍴 I see you're spending ₹${topAmount.toFixed(0)} on food (${percentage.toFixed(0)}% of expenses). Try cooking at home more often - you could save ₹5000+ monthly!`);
    } else if (topCategory === 'transport' && percentage > 20) {
      tips.push(`🚌 Transport is eating up ₹${topAmount.toFixed(0)} of your budget! Consider monthly passes or carpooling to reduce costs.`);
    } else if (topCategory === 'entertainment' && percentage > 25) {
      tips.push(`🎬 You're spending ₹${topAmount.toFixed(0)} on entertainment. Balance is key! Try free activities or student discounts to enjoy while saving.`);
    } else if (topCategory === 'shopping' && percentage > 20) {
      tips.push(`🛍️ Shopping costs are at ₹${topAmount.toFixed(0)}. Before buying, ask yourself: Do I need this or want this? Wait 24 hours before non-essential purchases!`);
    }
  }
  
  // Frequency-based tips
  const foodTransactions = expenses.filter(t => t.category === 'food').length;
  if (foodTransactions > 15) {
    tips.push("🍲 You're eating out quite often! Meal prepping on Sundays can save you both time and money. Try it for a week!");
  }
  
  // Income vs expense ratio tips
  const expenseRatio = totalExpenses / totalIncome;
  if (expenseRatio > 0.8) {
    tips.push("📊 You're using 80%+ of your income! Use ClearBudget's analytics to identify your top 3 expenses and see where you can trim ₹1000-2000.");
  }
  
  // Motivational and ClearBudget-specific tips
  if (transactions.length > 20) {
    tips.push("📈 You're doing great tracking in ClearBudget! Check your charts regularly - visual patterns help you make better money decisions.");
  }
  
  // Always include some general encouraging tips
  const generalTips = [
    "🎯 Pro tip: The 50/30/20 rule works wonders - 50% needs, 30% wants, 20% savings. Start small and build up!",
    "📱 ClearBudget's chat makes tracking super easy! Just tell me 'spent 200 on groceries' and I'll handle the categorization.",
    "🎓 Always look for student discounts! Apps like HDFC Smartbuy, Amazon Prime Student can save you 10-40% on purchases.",
    "📦 Try the 'envelope method' - set monthly limits for categories and stick to them. ClearBudget helps you track this automatically!",
    "💰 Emergency fund tip: Save ₹100-500 weekly in a separate account. Small amounts compound into big security!"
  ];
  
  // Add 1-2 general tips if we need more
  while (tips.length < 4 && generalTips.length > 0) {
    const randomTip = generalTips.splice(Math.floor(Math.random() * generalTips.length), 1)[0];
    tips.push(randomTip);
  }
  
  return tips.slice(0, 5);
}
