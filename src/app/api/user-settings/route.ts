import prisma from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

import { redirect } from 'next/navigation'

// async function getAllUsers() {
//     // "create your scrips below"
//     const allUsers =
//         await prisma.user.findMany()
//     console.log(allUsers)
// }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in?redirect=user-setings')
  }

  let userSettings = await prisma.userSettings.findUnique({
    where: {
      userId: user.id,
    },
  })

  if (!userSettings) {
    userSettings = await prisma.userSettings.create({
      data: {
        userId: user.id,
        currency: 'USD',
      },
    })
  }

  revalidatePath('/')
  return Response.json(userSettings)

  // getAllUsers()
  //     .then(
  //         async () => {
  //             await prisma.$disconnect()
  //             // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //             const userSettings = await getAllUsers();
  //         }
  //     )
  //     .catch(
  //         async (e: Error) => {
  //             console.error(e)
  //             await prisma.$disconnect()
  //             process.exit(1)
  //         }
  //     )
}
