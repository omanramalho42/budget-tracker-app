"use server"

import OpenAI from "openai"
import { cloudinary } from "@/lib/cloudinary"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

type Input = {
  base64: string
  type: string
}

export async function createAIScanner(input: Input) {
  try {
    const buffer = Buffer.from(input.base64, "base64")

    // 🔥 upload
    const upload = await new Promise<{
      url: string
      resourceType: string
    }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "receipts",
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) return reject(error)

          resolve({
            url: result.secure_url,
            resourceType: result.resource_type,
          })
        }
      ).end(buffer)
    })

    // 🔥 IA
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Você é um extrator de dados de recibos.
Retorne JSON:
{
  "description": "",
  "amount": number,
  "date": "YYYY-MM-DD",
  "merchant": ""
}
`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia os dados deste recibo" },
            {
              type: "image_url",
              image_url: {
                url: `data:${input.type};base64,${input.base64}`,
              },
            },
          ],
        },
      ],
    })

    let text = response.choices[0].message.content || "{}"

    text = text.replace(/```json/g, "").replace(/```/g, "").trim()

    let parsed: any = {}

    try {
      parsed = JSON.parse(text)
    } catch {
      console.error("RAW:", text)
    }

    return {
      url: upload.url,
      description: parsed.description || "",
      amount: Number(parsed.amount) || 0,
      date: parsed.date || "",
      merchant: parsed.merchant || "",
    }

  } catch (error) {
    console.error(error)
    throw error
  }
}