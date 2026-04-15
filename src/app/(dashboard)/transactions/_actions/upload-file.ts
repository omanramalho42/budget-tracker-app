'use server'

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export async function uploadReceipt(base64: string) {
  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: 'receipts',
    })

    return {
      url: result.secure_url,
    }
  } catch (error) {
    console.error(error)
    throw new Error('Erro ao fazer upload')
  }
}