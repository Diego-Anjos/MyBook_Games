type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

/**
 * Obtém (e faz cache em memória) o token Bearer da Twitch
 * para autenticação na API da IGDB.
 */
export async function getTwitchAccessToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Defina TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET no arquivo .env.local",
    );
  }

  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const response = await fetch(url, { method: "POST" });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao autenticar na Twitch (${response.status}): ${body}`);
  }

  const data = (await response.json()) as TwitchTokenResponse;

  cachedToken = {
    accessToken: data.access_token,
    // renovar 60s antes do vencimento
    expiresAt: now + data.expires_in * 1000,
  };

  return data.access_token;
}

export function getTwitchClientId(): string {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) {
    throw new Error("TWITCH_CLIENT_ID não configurado");
  }
  return clientId;
}
