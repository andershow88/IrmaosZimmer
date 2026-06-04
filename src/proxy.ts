import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Next 16: o antigo "middleware" foi renomeado para "proxy" (mesma assinatura).
// Esta função roda antes das rotas. A aplicação interna vive sob /painel e
// exige sessão; o site público (/, /sobre, /servicos, /contato, /agendar, ...)
// é liberado livremente.

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-zimmeros-secret-change"
);

const COOKIE_NAME = "zimmeros_session";

// APIs públicas (não exigem sessão).
const PUBLIC_API = ["/api/auth", "/api/health", "/api/agendar"];

// Extensões de assets servidos diretamente.
const ASSET_RX = /\.(png|ico|svg|jpg|jpeg|webp|gif|css|js|map|txt|woff2?|ttf)$/;

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Assets e arquivos do Next: sempre liberados.
  if (pathname.startsWith("/_next") || ASSET_RX.test(pathname)) {
    return NextResponse.next();
  }

  // APIs.
  if (pathname.startsWith("/api")) {
    if (PUBLIC_API.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }
    // Demais /api/* exigem sessão.
    if (await hasValidSession(req)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Aplicação interna: tudo sob /painel exige sessão.
  if (pathname === "/painel" || pathname.startsWith("/painel/")) {
    if (await hasValidSession(req)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  // Todo o resto é público: /, /sobre, /servicos, /contato, /agendar, /entrar, ...
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
