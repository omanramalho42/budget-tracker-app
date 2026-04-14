import { Role, UserUsage } from "@prisma/client";

// lib/plan-limits.ts
export const PLAN_CONFIG = {
  USER:    { aiLimit: 5,   voice: false },
  STARTER: { aiLimit: 50,  voice: true  },
  PREMIUM: { aiLimit: 500, voice: true  },
  ADMIN:   { aiLimit: 999, voice: true  },
}

export function canUserUseAI(usage: UserUsage, role: Role) {
  const limit = PLAN_CONFIG[role].aiLimit;
  return usage.aiGenerationsUsed < limit;
}