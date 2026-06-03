import { prisma } from "@/lib/db";
import { createToken, COOKIE_NAME, type Role } from "@/lib/auth";
import { compareSync } from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { email, senha } = await req.json();

  if (!email || !senha) {
    return Response.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  });

  if (!user || !user.passwordHash || !compareSync(senha, user.passwordHash)) {
    return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  if (!user.ativo) {
    return Response.json(
      { error: "Conta inativa. Entre em contato com o administrador." },
      { status: 403 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await createToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
  });

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.json({ ok: true, role: user.role });
}
