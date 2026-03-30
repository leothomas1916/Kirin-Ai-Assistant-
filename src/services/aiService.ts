import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export interface AIResponse {
  intent: "create_booking" | "update_status" | "show_jobs" | "general_chat" | "gmb_reply";
  action?: any;
  message: string;
}

export async function processAICommand(command: string, context: any): Promise<AIResponse> {
  if (!OPENROUTER_API_KEY) {
    return {
      intent: "general_chat",
      message: "OpenRouter API Key is missing. Please add it in the Settings menu."
    };
  }

  const systemPrompt = `
    You are Kirin AI, a senior CRM assistant for a repair business.
    You can parse commands and return structured JSON.
    
    Context:
    - Current Date: ${new Date().toISOString()}
    - Current Bookings: ${JSON.stringify(context.bookings || [])}
    
    Intents:
    1. create_booking: { customerName, phone, device, issue, price, status: "pending" }
    2. update_status: { bookingId, status }
    3. show_jobs: { filter: "today" | "pending" | "completed" }
    4. gmb_reply: { reviewId, replyText }
    5. general_chat: { message }
    
    Respond ONLY with a JSON object:
    {
      "intent": "intent_name",
      "action": { ... },
      "message": "A friendly confirmation message"
    }
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Kirin AI CRM"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: command }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const aiResult = JSON.parse(data.choices[0].message.content);

    // Log the action
    await addDoc(collection(db, "ai_logs"), {
      command,
      action: aiResult.intent,
      result: aiResult.message,
      timestamp: serverTimestamp()
    });

    return aiResult;
  } catch (error) {
    console.error("AI Error:", error);
    return {
      intent: "general_chat",
      message: "I encountered an error processing your request. Please try again."
    };
  }
}
