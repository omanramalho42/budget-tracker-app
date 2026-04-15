import { cloudinary } from "@/lib/cloudinary.config" // your config path
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"

export async function POST(req: NextRequest) {
  const user = await currentUser()

  if (!user) {
  return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // VERIFICAR SE O USUARIO EXISTE NO BD
  const userDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  })

  if(!userDb) {
    throw new Error("user not found")
  }

  if (req.method !== 'POST') return

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folderName = formData.get('folderName') as string

    if (!file) {
      return Response.json({
        msg: "File not found",
        statusCode: 404,
      })
    } else {
      // MAIN CLOUDINARY UPLOAD CODE
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const res = await new Promise<any>((res, rej) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folderName,
              transformation: [
                { width: 1024, height: 1024, crop: "limit" },
                { quality: "auto" },
              ],
          },
          (error, result) => {
            if (error) rej(error);
            else res(result as any)
          }
        );
        uploadStream.end(buffer);
      });

      if(!res.url) throw new Error("failed to uploaded file")
      
      return Response.json(res.url)
    }
      // PROCESSAMENTO DE DATA
    //   const responseData = await axios.get(res.url, {
    //     responseType: 'arraybuffer',
    //   })
    //   const base64String = Buffer.from(responseData.data).toString("base64")
    //   if(!base64String) throw new Error("Could not process file")
    //   const mimeType = `${res.resource_type}/${res.format}`

    //   console.log("BEFORE GEMINI")
    //   console.log({
    //     base64Length: base64String.length,
    //     mimeType,
    //   })
    //   if (base64String.length > 5_000_000) {
    //     throw new Error("Image too large for Gemini")
    //   }

    //   //RETORNAR OS DADOS CODIFICADOS DA AI
    //   let result
    //   try {
    //     result = await genAi.models.generateContent({
    //       model: genAiModel,
    //       contents: [
    //         createUserContent([
    //           receiptPrompt,
    //           createPartFromBase64(base64String, mimeType),
    //         ]),
    //       ],
    //       config: {
    //         temperature: 0,
    //         topP: 1,
    //         responseMimeType: "application/json",
    //       },
    //     })
    //   } catch (err) {
    //     console.error("GEMINI ERROR:", err)
    //     return NextResponse.json(
    //       { error: "Gemini processing failed" },
    //       { status: 500 }
    //     )
    //   }

    //   console.log("AFTER GEMINI")
    //   console.log(result)

    //   const response = result.text;
    //   const cleanedText = 
    //     response?.replace(/```(?:json)?\n?/g, "").trim()
    //   if(!cleanedText) {
    //     return {
    //       error: "Could not read reciept content"
    //     }
    //   }

    //   const data = JSON.parse(cleanedText)
      
    //   if(!data?.amount || !data?.date) {
    //     return {
    //       error: "Reciept missing required information"
    //     }
    //   }

    //   console.log(data, "data");

    //   return Response.json({
    //     title: data.title || "Receipt",
    //     amount: data.amount,
    //     date: data.date,
    //     description: data.description,
    //     category: data.category,
    //     paymentMethod: data.paymentMethod,
    //     type: data.type,
    //     receiptUrl: res.url,
    //   })
    // }
  } catch (error) {
    return Response.json({
      msg: "Error in fileupload route",
      statusCode: 500
    })
  }
}