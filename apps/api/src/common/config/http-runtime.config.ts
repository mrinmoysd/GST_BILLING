type SameSiteValue = 'lax' | 'strict' | 'none';

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function readSameSiteEnv(): SameSiteValue {
  const value = String(process.env.COOKIE_SAMESITE ?? 'lax')
    .trim()
    .toLowerCase();

  if (value === 'strict' || value === 'none') {
    return value;
  }

  return 'lax';
}

function readCookieDomain(): string | undefined {
  const value = String(process.env.COOKIE_DOMAIN ?? '').trim();
  return value.length > 0 ? value : undefined;
}

export function getRefreshCookieOptions(path: string) {
  const sameSite = readSameSiteEnv();
  const secure = readBooleanEnv('COOKIE_SECURE', false);
  const domain = readCookieDomain();

  return {
    httpOnly: true as const,
    sameSite,
    secure,
    path,
    ...(domain ? { domain } : {}),
  };
}

export function getRefreshClearCookieOptions(path: string) {
  const sameSite = readSameSiteEnv();
  const secure = readBooleanEnv('COOKIE_SECURE', false);
  const domain = readCookieDomain();

  return {
    sameSite,
    secure,
    path,
    ...(domain ? { domain } : {}),
  };
}

export function getCorsOriginConfig(): true | string[] {
  const explicitOrigins = String(
    process.env.API_CORS_ORIGIN ?? process.env.WEB_BASE_URL ?? '',
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return explicitOrigins.length > 0 ? explicitOrigins : true;
}

export function getTrustProxyValue(): boolean | number {
  const enabled = readBooleanEnv('TRUST_PROXY', false);
  if (!enabled) return false;

  const hopsRaw = String(process.env.TRUST_PROXY_HOPS ?? '').trim();
  if (!hopsRaw) return 1;

  const hops = Number(hopsRaw);
  return Number.isFinite(hops) && hops > 0 ? hops : 1;
}
