import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `
          Você é um extrator de dados de recibos.
          Retorne apenas JSON no formato:

        {
          "description": "",
          "amount": number,
          "date": "YYYY-MM-DD",
          "merchant": ""
        }
        `,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extraia os dados deste recibo',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${file.type};base64,${base64}`,
            },
          },
        ],
      },
    ],
  })

  let text = response.choices[0].message.content || '{}'

  // remove ```json ``` e lixo
  text = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()

  try {
    const parsed = JSON.parse(text)
    
    console.log(parsed, "Parsed")
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('RAW RESPONSE:', text)
    return NextResponse.json({ error: 'Erro ao parsear resposta', raw: text })
  }
}