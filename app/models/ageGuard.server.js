import prisma from "../db.server";

let tablesReady = false;

export const defaultSettings = {
  design: {
    popupType: "modal",
    borderRadius: 16,
    maxWidth: 480,
    backgroundColor: "#ffffff",
    backgroundOpacity: 100,
    overlayColor: "#111827",
    overlayOpacity: 72,
    boxShadow: true,
    shadowColor: "#000000",
    animation: "fade",
    backgroundImage: "",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundCustomSize: 100,
    backgroundImageOpacity: 18,
    backgroundBlur: 0,
    fallbackBackgroundColor: "#ffffff",
    logoImage: "",
    logoWidthDesktop: 120,
    logoWidthMobile: 96,
    logoPosition: "center",
    logoMarginTop: 0,
    logoMarginBottom: 18,
  },
  typography: {
    headingText: "Age Verification Required",
    headingFontFamily: "Inter",
    headingFontSizeDesktop: 32,
    headingFontSizeMobile: 24,
    headingFontWeight: 700,
    headingColor: "#111827",
    headingAlign: "center",
    headingLetterSpacing: 0,
    headingLineHeight: 1.15,
    descriptionText:
      "Please confirm you are old enough to enter this store. If you are not verified, you will not be able to access the site.",
    descriptionFontFamily: "Inter",
    descriptionFontSizeDesktop: 16,
    descriptionFontSizeMobile: 14,
    descriptionFontWeight: 400,
    descriptionColor: "#4b5563",
    descriptionAlign: "center",
    descriptionLetterSpacing: 0,
    descriptionLineHeight: 1.55,
    minimumAgeText: "You must be 18+ to enter",
    minimumAgeFontSizeDesktop: 14,
    minimumAgeFontSizeMobile: 13,
    minimumAgeColor: "#6b7280",
    minimumAgeBold: true,
    minimumAgeItalic: false,
    customCss: "",
  },
  buttons: {
    enterLabel: "Yes, I'm old enough",
    enterBackgroundColor: "#111827",
    enterTextColor: "#ffffff",
    enterBorderRadius: 10,
    enterFontSizeDesktop: 15,
    enterFontSizeMobile: 14,
    enterFontWeight: 700,
    enterPaddingY: 13,
    enterPaddingX: 22,
    enterHoverBackgroundColor: "#000000",
    enterHoverTextColor: "#ffffff",
    enterBorderWidth: 0,
    enterBorderColor: "#111827",
    enterFullWidth: false,
    exitLabel: "No, take me back",
    exitBackgroundColor: "#ffffff",
    exitTextColor: "#111827",
    exitBorderRadius: 10,
    exitFontSizeDesktop: 15,
    exitFontSizeMobile: 14,
    exitFontWeight: 600,
    exitPaddingY: 13,
    exitPaddingX: 22,
    exitHoverBackgroundColor: "#f3f4f6",
    exitHoverTextColor: "#111827",
    exitBorderWidth: 1,
    exitBorderColor: "#d1d5db",
    exitFullWidth: false,
    showExitButton: true,
    exitRedirectUrl: "https://www.google.com",
    layout: "side-by-side",
    gap: 12,
    customCss: "",
  },
  verification: {
    method: "click",
    minimumAge: 18,
    countryRulesEnabled: false,
    countryRules: [],
    rememberDays: 30,
    cookieName: "age_guard_verified",
    reverifyOnNewSession: false,
  },
  targeting: {
    showOn: "all",
    specificPages: [],
    excludePages: [],
    customerShowTo: "all",
    bypassLoggedIn: false,
    bypassTags: [],
    geoEnabled: false,
    geoMode: "include",
    countries: [],
  },
};

export function mergeSettings(settings = {}) {
  return {
    design: { ...defaultSettings.design, ...(settings.design || {}) },
    typography: {
      ...defaultSettings.typography,
      ...(settings.typography || {}),
    },
    buttons: { ...defaultSettings.buttons, ...(settings.buttons || {}) },
    verification: {
      ...defaultSettings.verification,
      ...(settings.verification || {}),
    },
    targeting: { ...defaultSettings.targeting, ...(settings.targeting || {}) },
  };
}

export async function ensureAgeGuardTables() {
  if (tablesReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ShopSettings" (
      "shop" TEXT NOT NULL PRIMARY KEY,
      "enabled" BOOLEAN NOT NULL DEFAULT false,
      "settings" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VerificationEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "shop" TEXT NOT NULL,
      "outcome" TEXT NOT NULL,
      "page" TEXT,
      "country" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VerificationEvent_shop_createdAt_idx"
    ON "VerificationEvent"("shop", "createdAt")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "VerificationEvent_shop_outcome_idx"
    ON "VerificationEvent"("shop", "outcome")
  `);

  tablesReady = true;
}

export async function getAgeGuardConfig(shop) {
  await ensureAgeGuardTables();
  const record = await prisma.shopSettings.findUnique({ where: { shop } });

  if (!record) {
    return { enabled: false, settings: mergeSettings() };
  }

  return {
    enabled: record.enabled,
    settings: mergeSettings(JSON.parse(record.settings || "{}")),
  };
}

export async function saveAgeGuardConfig(shop, data) {
  await ensureAgeGuardTables();
  const current = await getAgeGuardConfig(shop);
  const enabled =
    typeof data.enabled === "boolean" ? data.enabled : current.enabled;
  const settings = mergeSettings(data.settings || current.settings);

  return prisma.shopSettings.upsert({
    where: { shop },
    create: { shop, enabled, settings: JSON.stringify(settings) },
    update: { enabled, settings: JSON.stringify(settings) },
  });
}

export async function getDashboardStats(shop) {
  await ensureAgeGuardTables();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const events = await prisma.verificationEvent.findMany({
    where: { shop, createdAt: { gte: start } },
  });
  const total = events.length;
  const passed = events.filter((event) => event.outcome === "pass").length;
  const blocked = events.filter((event) => event.outcome === "block").length;

  return {
    total,
    blocked,
    passRate: total ? Math.round((passed / total) * 100) : 0,
  };
}

export async function getAnalytics(shop, days = 30) {
  await ensureAgeGuardTables();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const events = await prisma.verificationEvent.findMany({
    where: { shop, createdAt: { gte: start } },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map();
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    dailyMap.set(key, { date: key, total: 0, pass: 0, block: 0 });
  }

  const pages = new Map();
  const countries = new Map();
  const cities = new Map();
  let pass = 0;
  let block = 0;

  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10);
    const day = dailyMap.get(key) || { date: key, total: 0, pass: 0, block: 0 };
    day.total += 1;
    day[event.outcome] = (day[event.outcome] || 0) + 1;
    dailyMap.set(key, day);

    if (event.outcome === "pass") pass += 1;
    if (event.outcome === "block") block += 1;

    const page = event.page || "/";
    pages.set(page, (pages.get(page) || 0) + 1);

    if (event.country) {
      countries.set(event.country, (countries.get(event.country) || 0) + 1);
    }

    if (event.city) {
      const cityKey = event.city + (event.country ? `, ${event.country}` : "");
      cities.set(cityKey, (cities.get(cityKey) || 0) + 1);
    }
  }

  return {
    daily: [...dailyMap.values()],
    pass,
    block,
    pages: [...pages.entries()]
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    countries: [...countries.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    cities: [...cities.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}
