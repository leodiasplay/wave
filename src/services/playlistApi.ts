import { api } from './api';
import { ItemMusica } from './musicaApi';

export interface Playlist {
  id: number;
  user_id?: number;
  nome: string;
  descricao?: string | null;
  capa_url?: string | null;
  publica?: boolean;
  total_musicas: number;
  musicas?: ItemMusica[];
  created_at?: string;
  updated_at?: string;
}

export async function listarPlaylists(token?: string | null): Promise<Playlist[]> {
  return api<Playlist[]>('playlists', { token });
}

export async function obterPlaylist(id: number, token?: string | null): Promise<Playlist> {
  return api<Playlist>(`playlists/${id}`, { token });
}

export async function criarPlaylist(
  dados: { nome: string; descricao?: string; publica?: boolean; capa_url?: string },
  token?: string | null
): Promise<Playlist> {
  return api<Playlist>('playlists', {
    method: 'POST',
    body: dados,
    token,
  });
}

export async function atualizarPlaylist(
  id: number,
  dados: { nome?: string; descricao?: string; publica?: boolean; capa_url?: string },
  token?: string | null
): Promise<Playlist> {
  return api<Playlist>(`playlists/${id}`, {
    method: 'PUT',
    body: dados,
    token,
  });
}

export async function excluirPlaylist(id: number, token?: string | null): Promise<void> {
  await api(`playlists/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function adicionarMusicaPlaylist(
  playlistId: number,
  musicaId: number,
  token?: string | null
): Promise<any> {
  return api(`playlists/${playlistId}/musicas`, {
    method: 'POST',
    body: { musica_id: musicaId },
    token,
  });
}

export async function removerMusicaPlaylist(
  playlistId: number,
  musicaId: number,
  token?: string | null
): Promise<any> {
  return api(`playlists/${playlistId}/musicas/${musicaId}`, {
    method: 'DELETE',
    token,
  });
}
