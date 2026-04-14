import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma"
import { inngest } from "./inngest/client"
import { Role } from "@prisma/client"

// Configuração centralizada de limites por Role
const PLAN_CONFIG = {
  USER:    { aiLimit: 5,   voice: false },
  STARTER: { aiLimit: 50,  voice: true  },
  PREMIUM: { aiLimit: 500, voice: true  },
  ADMIN:   { aiLimit: 999, voice: true  },
}

export async function syncCurrentUser() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber ?? "";
    const firstName = clerkUser.firstName?.trim();

    // 1. Defina o include como uma constante para evitar repetição
    const userInclude = {
      usage: true,
      settings: true, // Se você precisar usar settings depois, inclua aqui também
    };

    let userDb = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
      include: userInclude,
    });

    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;
    // 2. Define a role de forma segura
    // Se o usuário já existe, MANTEMOS a role que está no banco (userDb.role).
    // Se é um novo usuário, a role inicial é SEMPRE 'USER'.
    const assignedRole: Role = userDb ? userDb.role : 'USER';

    if (userDb) {
      userDb = await prisma.user.update({
        where: { id: userDb.id },
        include: userInclude, // <-- ADICIONE ISSO AQUI
        data: {
          email,
          firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          role: assignedRole,
          usage: {
            upsert: {
              create: {
                aiLimit: PLAN_CONFIG[assignedRole].aiLimit,
                canUseVoice: PLAN_CONFIG[assignedRole].voice,
              },
              update: {
                aiLimit: PLAN_CONFIG[assignedRole].aiLimit,
                canUseVoice: PLAN_CONFIG[assignedRole].voice,
              }
            }
          }
        }
      });
    } else {
      userDb = await prisma.user.create({
        include: userInclude, // <-- ADICIONE ISSO AQUI TAMBÉM
        data: {
          clerkUserId: clerkUser.id,
          email,
          firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          role: assignedRole,
          usage: {
            create: {
              aiLimit: PLAN_CONFIG[assignedRole].aiLimit,
              canUseVoice: PLAN_CONFIG[assignedRole].voice,
            }
          }
        }
      });

      // ... Restante da lógica do Inngest
    }

    return userDb;
  } catch (error) {
    // ... catch error
  }
}