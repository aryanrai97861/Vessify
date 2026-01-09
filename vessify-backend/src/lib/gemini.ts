import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ExtractedTransaction {
  date: Date;
  description: string;
  amount: number;
  balance: number | null;
  category: string | null;
  confidence: number;
}

const EXTRACTION_PROMPT = `You are a financial transaction parser. Extract transaction details from the following bank statement text.

Return a JSON object with these fields:
- date: ISO 8601 date string (YYYY-MM-DD)
- description: Transaction description/merchant name
- amount: Numeric amount (negative for debits/purchases, positive for credits)
- balance: Balance after transaction (null if not available)
- category: Transaction category (e.g., "Food & Dining", "Transportation", "Shopping", "Entertainment", etc.)
- confidence: Your confidence score from 0 to 1 on how accurately you extracted the data

IMPORTANT:
- Parse dates carefully, handling various formats (DD MMM YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
- For amounts: "debited", "Dr", "-", or purchases are NEGATIVE. "credited", "Cr", "+" are POSITIVE
- Extract the actual merchant/description, removing transaction IDs and extra metadata
- If balance is shown as "Bal", "Balance", "Available Balance", etc., extract the numeric value
- Return ONLY valid JSON, no markdown or explanation

Text to parse:
`;

export async function extractTransaction(rawText: string): Promise<ExtractedTransaction> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(EXTRACTION_PROMPT + rawText);
  const response = result.response;
  const text = response.text();

  // Clean up the response - remove markdown code blocks if present
  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.slice(7);
  }
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.slice(3);
  }
  if (jsonText.endsWith("```")) {
    jsonText = jsonText.slice(0, -3);
  }
  jsonText = jsonText.trim();

  try {
    const parsed = JSON.parse(jsonText);
    
    // Robust date parsing
    let parsedDate: Date;
    if (parsed.date) {
      parsedDate = new Date(parsed.date);
      // If the date is invalid, try parsing common formats
      if (isNaN(parsedDate.getTime())) {
        // Try DD/MM/YYYY format
        const ddmmyyyy = parsed.date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (ddmmyyyy) {
          parsedDate = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
        }
      }
      // If still invalid, try DD MMM YYYY format
      if (isNaN(parsedDate.getTime())) {
        const ddmmmyyyy = parsed.date.match(/(\d{1,2})\s*(\w+)\s*(\d{4})/);
        if (ddmmmyyyy) {
          parsedDate = new Date(`${ddmmmyyyy[2]} ${ddmmmyyyy[1]}, ${ddmmmyyyy[3]}`);
        }
      }
      // Final fallback to current date
      if (isNaN(parsedDate.getTime())) {
        console.warn("Could not parse date:", parsed.date, "- using current date");
        parsedDate = new Date();
      }
    } else {
      parsedDate = new Date();
    }

    return {
      date: parsedDate,
      description: parsed.description || "Unknown Transaction",
      amount: typeof parsed.amount === "number" ? parsed.amount : parseFloat(String(parsed.amount).replace(/[₹,]/g, "")) || 0,
      balance: parsed.balance !== null && parsed.balance !== undefined 
        ? (typeof parsed.balance === "number" ? parsed.balance : parseFloat(String(parsed.balance).replace(/[₹,]/g, "")) || null)
        : null,
      category: parsed.category || null,
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", text, error);
    throw new Error("Failed to extract transaction from text");
  }
}
