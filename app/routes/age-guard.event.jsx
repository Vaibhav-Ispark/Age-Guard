import prisma from "../db.server";
import { ensureAgeGuardTables } from "../models/ageGuard.server";

export const action = async ({ request }) => {
  const payload = await request.json().catch(() => ({}));

  if (payload.shop && payload.outcome) {
    await ensureAgeGuardTables();
    await prisma.verificationEvent.create({
      data: {
        shop: payload.shop,
        outcome: payload.outcome,
        page: payload.page || null,
        country: payload.country || null,
      },
    });
  }

  return Response.json({ ok: true }, { headers: corsHeaders() });
};

export const loader = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
