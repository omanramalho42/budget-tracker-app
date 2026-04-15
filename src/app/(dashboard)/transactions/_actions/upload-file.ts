"use server"

import OpenAI from "openai"
import { cloudinary } from "@/lib/cloudinary.config"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import z from "zod"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function uploadToCloudinary(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise<{ url: string; resourceType: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
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
      )
      .end(buffer)
  })
}

export async function uploadAndScanReceipt(formData: FormData) {
  try {
    // 1. Validação de Usuário
    const user = await currentUser()
    if (!user) redirect('/sign-in')

    const userDb = await prisma.user.findFirst({
      where: { clerkUserId: user.id },
    })
    if (!userDb) throw new Error("User not found")
    // ✅ Recupere o arquivo do FormData
    const file = formData.get('file') as File;
    
    if (!file) throw new Error("Arquivo não encontrado");

    // O restante do código permanece igual
    // 2. Upload para Cloudinary
    let imageUrl: string | null = null
    if (file && file instanceof File) {
      const uploaded = await uploadToCloudinary(file);
      imageUrl = uploaded.url
    }

    if (!imageUrl) throw new Error("Falha no upload da imagem")

    // 3. Extração com IA usando a URL do Cloudinary
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um extrator de dados de recibos. Retorne APENAS um JSON válido com os campos: description, amount (number), date (YYYY-MM-DD) e merchant.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia os dados deste recibo:" },
            {
              type: "image_url",
              image_url: { url: imageUrl }, // Passando a URL direta
            },
          ],
        },
      ],
      response_format: { type: "json_object" } // Garante retorno JSON
    })

    const content = response.choices[0].message.content || "{}"
    const parsed = JSON.parse(content)

    return {
      url: imageUrl, 
      description: parsed.description || "",
      amount: Number(parsed.amount) || 0,
      date: parsed.date || "",
      merchant: parsed.merchant || "",
    }
    
  } catch (error) {
    console.error("uploadAndScanReceipt error:", error)
    throw new Error("Erro ao processar recibo")
  }
}