
import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Executes a Gemini AI request with exponential backoff for rate-limiting (429) errors.
 * Includes jitter and specific detection for RESOURCE_EXHAUSTED status.
 */
export async function generateContentWithRetry(
  params: GenerateContentParameters, 
  retries = 4, 
  backoff = 3000
): Promise<GenerateContentResponse> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Satellite Uplink Failed: API Key configuration missing.");
  }

  // Create a new instance right before the call to ensure it uses the latest key state
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    const errorMsg = error?.message || "";
    const isRateLimit = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || error?.status === 429;
    
    if (isRateLimit && retries > 0) {
      // Add jitter (randomness) to avoid synchronized retries
      const jitter = Math.random() * 1000;
      const waitTime = backoff + jitter;
      
      console.warn(`[SpaceScope AI] Signal Congestion detected (429/Quota). Retrying in ${Math.round(waitTime)}ms... (${retries} attempts left)`);
      
      await delay(waitTime);
      // Double the backoff for the next attempt
      return generateContentWithRetry(params, retries - 1, backoff * 2);
    }
    
    // If we've exhausted retries or it's a different error, throw
    console.error("[SpaceScope AI] Critical Transmission Error:", error);
    throw error;
  }
}
