import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const signedIn = !!(await getAdmin());
  const onLogin = request.nextUrl.pathname === "/login";

  if (!signedIn && !onLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (signedIn && onLogin) return NextResponse.redirect(new URL("/admin", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*"],
};
