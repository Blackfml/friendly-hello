const API_BASE = "https://api.spotify.com/v1";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID?.trim();
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI?.trim() || (typeof window !== "undefined" ? window.location.origin : "");
const SCOPES = ["user-read-private", "user-library-read", "playlist-read-private"].join(" ");
const ACCESS_KEY = "fh_spotify_access_token";
const REFRESH_KEY = "fh_spotify_refresh_token";
const EXPIRY_KEY = "fh_spotify_expires_at";
const VERIFIER_KEY = "fh_spotify_pkce_verifier";
const STATE_KEY = "fh_spotify_oauth_state";

export type SpotifyArtist = { id: string; name: string; external_urls?: { spotify?: string } };
export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  explicit: boolean;
  artists: SpotifyArtist[];
  album: {
    id: string;
    name: string;
    images: { url: string; width?: number; height?: number }[];
    external_urls?: { spotify?: string };
  };
  external_urls?: { spotify?: string };
};
export type SpotifyUser = { id: string; display_name: string | null; images?: { url: string }[]; external_urls?: { spotify?: string } };
type SearchResponse = { tracks?: { items?: SpotifyTrack[]; total?: number } };
type SavedTracksResponse = { items?: { track: SpotifyTrack | null }[]; total?: number };
type TokenResponse = { access_token: string; token_type: string; expires_in: number; refresh_token?: string; error?: string };

export const spotifyConfigured = Boolean(CLIENT_ID);

function storage() {
  if (typeof window === "undefined") throw new Error("O Spotify só pode ser acessado no navegador.");
  return window.sessionStorage;
}
function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}
function randomString(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return base64Url(bytes).slice(0, length);
}
function saveToken(token: TokenResponse) {
  const s = storage();
  s.setItem(ACCESS_KEY, token.access_token);
  s.setItem(EXPIRY_KEY, String(Date.now() + Math.max(0, token.expires_in - 60) * 1000));
  if (token.refresh_token) s.setItem(REFRESH_KEY, token.refresh_token);
}
export function clearSpotifySession() {
  const s = storage();
  [ACCESS_KEY, REFRESH_KEY, EXPIRY_KEY, VERIFIER_KEY, STATE_KEY].forEach((key) => s.removeItem(key));
}
export function isSpotifyConnected() {
  return Boolean(storage().getItem(ACCESS_KEY));
}
export async function beginSpotifyLogin() {
  if (!CLIENT_ID) throw new Error("Falta configurar VITE_SPOTIFY_CLIENT_ID. Adicione o Client ID no ambiente do projeto e cadastre a URL de retorno no painel Spotify for Developers.");
  const s = storage();
  const verifier = randomString(96);
  const state = randomString(32);
  s.setItem(VERIFIER_KEY, verifier);
  s.setItem(STATE_KEY, state);
  const challenge = base64Url(await sha256(verifier));
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    scope: SCOPES,
  }).toString();
  window.location.assign(url.toString());
}
export async function handleSpotifyRedirect() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (!code && !error) return false;
  const s = storage();
  const expectedState = s.getItem(STATE_KEY);
  const receivedState = url.searchParams.get("state");
  const verifier = s.getItem(VERIFIER_KEY);
  window.history.replaceState({}, document.title, url.pathname);
  if (error) {
    clearSpotifySession();
    throw new Error(error === "access_denied" ? "Você cancelou o acesso ao Spotify." : "O Spotify recusou a autenticação.");
  }
  if (!expectedState || receivedState !== expectedState || !verifier) {
    clearSpotifySession();
    throw new Error("Não foi possível validar o retorno seguro do Spotify. Tente entrar novamente.");
  }
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID ?? "",
      grant_type: "authorization_code",
      code: code ?? "",
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  const token = (await response.json()) as TokenResponse;
  if (!response.ok || !token.access_token) {
    clearSpotifySession();
    throw new Error(token.error ?? "Não foi possível concluir o login com Spotify. Confira o Client ID e a URL de retorno.");
  }
  saveToken(token);
  s.removeItem(VERIFIER_KEY);
  s.removeItem(STATE_KEY);
  return true;
}
async function refreshAccessToken() {
  const s = storage();
  const refreshToken = s.getItem(REFRESH_KEY);
  if (!CLIENT_ID || !refreshToken) {
    clearSpotifySession();
    throw new Error("Sua sessão do Spotify expirou. Entre novamente.");
  }
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  const token = (await response.json()) as TokenResponse;
  if (!response.ok || !token.access_token) {
    clearSpotifySession();
    throw new Error("A sessão do Spotify expirou. Conecte sua conta novamente.");
  }
  saveToken(token);
  return token.access_token;
}
async function accessToken() {
  const s = storage();
  const token = s.getItem(ACCESS_KEY);
  if (!token) throw new Error("Conecte sua conta Spotify para carregar músicas reais.");
  const expiry = Number(s.getItem(EXPIRY_KEY) ?? 0);
  return expiry > Date.now() ? token : refreshAccessToken();
}
async function spotifyFetch<T>(path: string): Promise<T> {
  let token = await accessToken();
  let response = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401) {
    token = await refreshAccessToken();
    response = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  }
  if (!response.ok) {
    if (response.status === 403) throw new Error("O Spotify bloqueou este recurso para o aplicativo. Confira as permissões e o modo de desenvolvimento da sua aplicação.");
    if (response.status === 429) throw new Error("O Spotify limitou temporariamente as consultas. Aguarde um pouco e tente de novo.");
    throw new Error(`O Spotify não conseguiu carregar os dados (HTTP ${response.status}).`);
  }
  return (await response.json()) as T;
}
export async function getSpotifyProfile() {
  return spotifyFetch<SpotifyUser>("/me");
}
export async function searchSpotifyTracks(query: string) {
  const params = new URLSearchParams({ q: query, type: "track", limit: "10", market: "BR" });
  const data = await spotifyFetch<SearchResponse>(`/search?${params.toString()}`);
  return data.tracks?.items ?? [];
}
export async function getSavedSpotifyTracks() {
  const params = new URLSearchParams({ limit: "10", market: "BR" });
  const data = await spotifyFetch<SavedTracksResponse>(`/me/tracks?${params.toString()}`);
  return (data.items ?? []).map((item) => item.track).filter((track): track is SpotifyTrack => Boolean(track));
}
export function spotifyDuration(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
