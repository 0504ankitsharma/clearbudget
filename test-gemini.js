// Test script to verify Gemini API integration
const fetch = require('node-fetch');

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = "AIzaSyDhwJkSBvQxAEBhsHlJ19iDGBGSev8KPZU";

async function testGeminiAPI() {
  console.log("Testing Gemini API integration...");
  
  const headers = {
    'Content-Type': 'application/json',
    'X-goog-api-key': GEMINI_API_KEY,
  };
  
  const testPrompt = "Parse this transaction: 'I spent ₹250 on lunch at McDonald's' and respond with JSON format: {\"type\": \"expense\", \"amount\": 250, \"category\": \"food\", \"description\": \"lunch at McDonald's\"}";
  
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: testPrompt
              }
            ]
          }
        ]
      }),
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }
    
    const result = await response.json();
    console.log("API Response:", JSON.stringify(result, null, 2));
    
    if (result.candidates && result.candidates.length > 0 && 
        result.candidates[0].content && result.candidates[0].content.parts && 
        result.candidates[0].content.parts.length > 0) {
      const responseText = result.candidates[0].content.parts[0].text;
      console.log("Extracted response:", responseText);
      
      // Try to parse as JSON
      try {
        const jsonMatch = responseText.match(/\{[^}]*\}/);
        if (jsonMatch) {
          const parsedJSON = JSON.parse(jsonMatch[0]);
          console.log("Parsed JSON:", parsedJSON);
          console.log("✅ Gemini API integration successful!");
        } else {
          console.log("⚠️ Response doesn't contain valid JSON");
        }
      } catch (e) {
        console.log("⚠️ Failed to parse JSON from response");
      }
    } else {
      console.log("⚠️ Unexpected response format");
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testGeminiAPI();
