import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.wave.insonia.online/api';

const TOKEN_KEY = 'music_auth_token';

export async function lerToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return (
        globalThis.sessionStorage?.getItem(TOKEN_KEY) ??
        globalThis.localStorage?.getItem(TOKEN_KEY) ??
        null
      );
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function salvarToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.sessionStorage?.setItem(TOKEN_KEY, token);
      globalThis.localStorage?.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (err) {
    console.warn('Não foi possível salvar o token:', err);
  }
}

export async function apagarToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.sessionStorage?.removeItem(TOKEN_KEY);
      globalThis.localStorage?.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Nada a fazer
  }
}

let aoNaoAutorizado: (() => void) | null = null;

export function definirAoNaoAutorizado(fn: (() => void) | null) {
  aoNaoAutorizado = fn;
}

export interface ApiOpcoes extends Omit<RequestInit, 'body'> {
  body?: any;
  token?: string | null;
}

export async function api<T>(endpoint: string, opcoes: ApiOpcoes = {}): Promise<T> {
  const { body, token, headers: headersCustom, ...rest } = opcoes;

  const url = `${API_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  const headers = new Headers(headersCustom);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const tokenFinal = token ?? (await lerToken());
  if (tokenFinal) {
    headers.set('Authorization', `Bearer ${tokenFinal}`);
  }

  let bodyFinal: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      bodyFinal = body;
    } else {
      headers.set('Content-Type', 'application/json');
      bodyFinal = JSON.stringify(body);
    }
  }

  const resp = await fetch(url, {
    ...rest,
    headers,
    body: bodyFinal,
  });

  if (resp.status === 401) {
    aoNaoAutorizado?.();
  }

  const texto = await resp.text();
  let dados: any;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = texto;
  }

  if (!resp.ok) {
    const msg = dados?.message ?? `Erro HTTP ${resp.status}`;
    const err = new Error(msg);
    (err as any).status = resp.status;
    (err as any).dados = dados;
    throw err;
  }

  return dados as T;
}
