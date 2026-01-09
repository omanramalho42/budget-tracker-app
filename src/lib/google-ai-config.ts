import { GoogleGenAI } from "@google/genai"

export const genAi = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
})

export const genAiModel = "gemini-2.0-flash"
