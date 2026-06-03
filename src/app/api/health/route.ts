export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    app: "zimmeros-ai",
    time: new Date().toISOString(),
  });
}
