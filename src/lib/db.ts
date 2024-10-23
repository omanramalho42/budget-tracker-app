import { PrismaClient } from '@prisma/client'

import { withAccelerate } from '@prisma/extension-accelerate'
import { withOptimize } from '@prisma/extension-optimize'

const prismaClientSingleton = () => {
  return new PrismaClient()
    .$extends(
        withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY! })
    ).$extends(withAccelerate())
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma