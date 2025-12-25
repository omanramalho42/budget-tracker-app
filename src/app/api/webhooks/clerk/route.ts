import { prisma } from '@/lib/prisma'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data
    const eventType = evt.type
    console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
    console.log('Webhook payload:', evt.data)

    if (evt.type === 'user.created') {
      console.log('userId:', evt.data.id)
      
      const {
        id,
        email_addresses,
        first_name,
        last_name,
        image_url
      } = evt.data 
      
      try {
        const newUser = await prisma.user.create({
          data: {
            clerkUserId: id,
            email: email_addresses[0].email_address,
            firstName: first_name,
            lastName: last_name,
            imageUrl: image_url
          }
        })

        return new Response(JSON.stringify(newUser), {
          status: 201,
        })
      } catch (error) {
        console.log("Error: Failed to store event in the database:", error)
        return new Response("Error: Failed to store event in the database", {
          status: 500,
        })
      }
    }

    return new Response('Webhook received', { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}