import { prisma } from "@/lib/prisma"

export const getAllUsersForNewsEmail = async () => {
  try {
    const users = 
      await prisma.user.findMany()
      
    if (!users) throw new Error("users not found")

    return users.filter((user) => user.email && user.firstName).map((user) => ({
      id: user.id  || user.id?.toString() || "",
      email: user.email,
      firstName: user.firstName
    }))
  } catch (error) {
    console.error("Error fetching users for news email:", error)
  }
}