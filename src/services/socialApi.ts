import { api } from './api';
import { Playlist } from './playlistApi';

export interface UsuarioPerfil {
  id: number;
  name: string;
  username: string;
  email: string;
}

export interface EstatisticasPerfil {
  total_playlists: number;
  total_favoritas: number;
  total_amigos: number;
}

export interface RespostaPerfil {
  user: UsuarioPerfil;
  estatisticas: EstatisticasPerfil;
}

export interface AmigoItem {
  amizade_id: number;
  id: number;
  name: string;
  username: string;
  email: string;
  status: 'aceito' | 'pendente';
  sou_solicitante: boolean;
  desde?: string;
}

export interface PlaylistCompartilhadaItem extends Playlist {
  compartilhamento_id: number;
  compartilhado_por: string;
  mensagem?: string;
  data?: string;
}

export async function obterPerfil(token?: string | null): Promise<RespostaPerfil> {
  return api<RespostaPerfil>('perfil', { token });
}

export async function listarAmigos(token?: string | null): Promise<AmigoItem[]> {
  return api<AmigoItem[]>('amigos', { token });
}

export async function adicionarAmigo(busca: string, token?: string | null): Promise<any> {
  return api('amigos', {
    method: 'POST',
    body: { busca },
    token,
  });
}

export async function removerAmigo(amizadeId: number, token?: string | null): Promise<any> {
  return api(`amigos/${amizadeId}`, {
    method: 'DELETE',
    token,
  });
}

export async function compartilharPlaylist(
  playlistId: number,
  amigoId: number,
  mensagem?: string,
  token?: string | null
): Promise<any> {
  return api(`playlists/${playlistId}/compartilhar`, {
    method: 'POST',
    body: { amigo_id: amigoId, mensagem },
    token,
  });
}

export async function listarPlaylistsCompartilhadas(token?: string | null): Promise<PlaylistCompartilhadaItem[]> {
  return api<PlaylistCompartilhadaItem[]>('playlists-compartilhadas', { token });
}

export async function listarPlaylistsAmigo(amigoId: number, token?: string | null): Promise<Playlist[]> {
  return api<Playlist[]>(`amigos/${amigoId}/playlists`, { token });
}
