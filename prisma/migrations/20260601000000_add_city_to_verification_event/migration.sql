-- AlterTable
ALTER TABLE "VerificationEvent" ADD COLUMN IF NOT EXISTS "city" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VerificationEvent_shop_country_idx" ON "VerificationEvent"("shop", "country");
