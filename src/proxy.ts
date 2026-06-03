import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Next 16: o antigo "middleware" foi renomeado para "proxy" (mesma assinatura).
// Esta função roda antes das rotas para proteger a aplicação exigindo sessão.

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-zimmeros-secret-change"
);

const COOKIE_NAME = "zimmeros_session";

const PUBLIC = [
  "/entrar",
  "/api/auth",
  "/api/health",
  "/favicon",
  "/icon",
  "/logo",
  "/manifest",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.match(/\.(png|ico|svg|jpg|jpeg|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
