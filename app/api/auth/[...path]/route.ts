import { neonAuth } from "@/lib/neon-auth";

const handler = neonAuth.handler();

export const { GET, PUT, DELETE, PATCH } = handler;

// Email sign-in only goes through /login (app/login/actions.ts), which enforces the failed-attempt lock.
// Blocking it here stops scripts from guessing passwords through this route and skipping that lock.
export function POST(request: Request, context: Parameters<typeof handler.POST>[1]) {
  if (new URL(request.url).pathname.endsWith("/sign-in/email")) {
    return Response.json({ error: "Use the sign-in page." }, { status: 404 });
  }
  return handler.POST(request, context);
}
