import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rotas acessadas via navegador, sem exigir sessão (páginas públicas)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

// Rotas server-to-server: autenticadas por client_secret/access_token
// no corpo/header da própria request, NUNCA por sessão Clerk.
// Também cobre os links de e-mail de confirmação de vínculo, que são
// clicados fora de qualquer sessão logada.
const isServerToServerRoute = createRouteMatcher([
  '/api/internal(.*)',        // legado, se ainda usado
  '/api/oauth/token',         // troca code por token — chamada do backend do Habits
  '/api/oauth/register(.*)',  // dynamic client registration
  '/api/external(.*)',        // consulta de categories/expenses/incomes via access_token
  '/api/oauth/link-status',   // polling do Habits sobre confirmação por e-mail
  '/account-link/confirm',    // clique no e-mail — sem sessão
  '/account-link/decline',    // idem
])

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request) || isServerToServerRoute(request)) {
    return
  }
  await auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}