import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Defina aqui TODAS as rotas públicas
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

// 🔧 rotas internas usam segredo compartilhado, não sessão Clerk —
// precisam ficar fora do auth.protect()
const isInternalRoute = createRouteMatcher([
  '/api/internal(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (isInternalRoute(request)) {
    return // deixa passar — a própria rota valida x-internal-secret
  }
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})
// export default clerkMiddleware();

export const config = {
  matcher: [
    // Ignora arquivos estáticos e _next
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Sempre roda para API routes
    '/(api|trpc)(.*)',
  ],
}
