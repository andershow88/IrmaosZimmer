import { COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
