import { getAgeGuardConfig } from "../models/ageGuard.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return Response.json({ enabled: true, settings: null }, { headers: corsHeaders() });
  }

  const config = await getAgeGuardConfig(shop);
  // Always enabled — on/off is controlled via the theme editor App Embeds toggle
  return Response.json({ ...config, enabled: true }, { headers: corsHeaders() });
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}
