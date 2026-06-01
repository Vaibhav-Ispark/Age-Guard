import prisma from "../db.server";
import { ensureAgeGuardTables } from "../models/ageGuard.server";

async function getGeoFromIp(ip) {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168") || ip.startsWith("10.")) {
    return { country: null, city: null };
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "age-guard-app/1.0" },
    });
    if (!res.ok) return { country: null, city: null };
    const data = await res.json();
    return {
      country: data.country_code || null,
      city: data.city || null,
    };
  } catch {
    return { country: null, city: null };
  }
}

function getClientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export const action = async ({ request }) => {
  const payload = await request.json().catch(() => ({}));

  if (payload.shop && payload.outcome) {
    await ensureAgeGuardTables();

    const ip = getClientIp(request);
    const geo = await getGeoFromIp(ip);

    await prisma.verificationEvent.create({
      data: {
        shop: payload.shop,
        outcome: payload.outcome,
        page: payload.page || null,
        country: geo.country || payload.country || null,
        city: geo.city || null,
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
