/**
 * CORS:
 * - Local: localhost:3000 / 3001
 * - Lista explícita: CORS_ORIGIN (URLs separadas por vírgula)
 * - Railway: se RAILWAY_* existir no ambiente, aceita automaticamente https://*.up.railway.app
 *   (evita erro toda hora por URL nova de web/painel)
 * - Opcional: CORS_ALLOW_RAILWAY_APP=1 força o mesmo fora da detecção Railway
 */
function isRunningOnRailway(): boolean {
  return Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_ID,
  );
}

function isRailwayPublicOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    return u.hostname.endsWith(".up.railway.app");
  } catch {
    return false;
  }
}

export function allowCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  const list =
    process.env.CORS_ORIGIN?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const defaults = ["http://localhost:3000", "http://localhost:3001"];
  const allowed = list.length ? list : defaults;

  if (allowed.includes(origin)) return true;

  if (process.env.CORS_ALLOW_RAILWAY_APP === "1" && isRailwayPublicOrigin(origin)) return true;

  if (isRunningOnRailway() && isRailwayPublicOrigin(origin)) return true;

  return false;
}

/** Express + credentials: devolve a origem explícita quando permitida */
export function corsOriginCallback(
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean | string) => void,
): void {
  if (!origin) {
    cb(null, true);
    return;
  }
  if (allowCorsOrigin(origin)) {
    cb(null, origin);
    return;
  }
  cb(null, false);
}

/** Socket.IO espera callback(null, boolean) */
export function socketCorsOriginCallback(
  origin: string | undefined,
  cb: (err: Error | null, success?: boolean) => void,
): void {
  cb(null, allowCorsOrigin(origin ?? ""));
}
