import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { ROLE_LABELS, type Role } from "@/lib/roles";

// Re-export para compatibilidade com importadores server-side existentes.
export { ROLE_LABELS, type Role };

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-zimmeros-secret-change"
);

export const COOKIE_NAME = "zimmeros_session";

/** Forma da sessão guardada no cookie JWT. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** Lê e valida o cookie de sessão. Não toca no banco. */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/** Busca o usuário completo no banco a partir da sessão (cacheado por request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const s = await getSession();
  if (!s) return null;
  const u = await prisma.user.findUnique({
    where: { id: s.id },
    select: { id: true, name: true, email: true, role: true, ativo: true },
  });
  if (!u || !u.ativo) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role as Role };
});

/** Exige sessão válida + usuário ativo. Redireciona para /entrar caso contrário. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

/** Exige que o usuário tenha uma das funções informadas. */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

/** Exige função ADMINISTRADOR. */
export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(["ADMINISTRADOR"]);
}

/** Para Server Actions / rotas: lança erro em vez de redirecionar. */
export async function requireUserForAction(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

/** Para Server Actions / rotas com checagem de função. */
export async function requireRoleForAction(roles: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");
  if (!roles.includes(user.role)) throw new Error("Acesso negado.");
  return user;
}

/** Gera o token JWT (HS256, 30 dias) para o cookie de sessão. */
export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);
}
