import { api, API_URL } from './api';

export interface ItemMusica {
  id: number | null;
  cadastrada: boolean;
  is_gdrive?: boolean;
  origem?: 'local' | 'google_drive';
  drive_file_id?: string | null;
  drive_url?: string | null;
  user_id?: number | null;
  titulo: string;
  artista: string;
  album?: string | null;
  genero?: string | null;
  subgenero?: string | null;
  ano?: number | null;
  duracao_segundos?: number;
  duracao_formatada?: string;
  caminho_arquivo: string;
  tamanho_bytes?: number;
  tamanho_formatado?: string;
  formato?: string;
  mime_type?: string;
  favorita: boolean;
  reproducoes: number;
  ultima_reproducao_em?: string | null;
  arquivo_presente: boolean;
  stream_url: string;
  capa_url?: string | null;
}

export function isSameTrack(a?: ItemMusica | null, b?: ItemMusica | null): boolean {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  if (a.drive_file_id && b.drive_file_id && a.drive_file_id === b.drive_file_id) return true;
  if (a.caminho_arquivo && b.caminho_arquivo && a.caminho_arquivo === b.caminho_arquivo) return true;
  if (a.titulo && b.titulo && a.artista && b.artista && a.titulo.trim().toLowerCase() === b.titulo.trim().toLowerCase() && a.artista.trim().toLowerCase() === b.artista.trim().toLowerCase()) return true;
  return false;
}

export interface PaginacaoMusica {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  has_more: boolean;
}

export interface EstatisticasMusica {
  total_geral: number;
  total_cadastradas: number;
  total_nao_cadastradas: number;
  total_favoritas: number;
  diretorios: string[];
}

export interface RespostaBiblioteca {
  data: ItemMusica[];
  pagination?: PaginacaoMusica;
  estatisticas: EstatisticasMusica;
}

export interface FiltrosMusica {
  tipo?: 'todas' | 'cadastradas' | 'nao_cadastradas' | 'favoritas';
  q?: string;
  genero?: string;
  subgenero?: string;
  artista?: string;
  origem?: 'local' | 'google_drive' | 'todas';
  limit?: number;
  page?: number;
}

export interface ArtistaItem {
  artista: string;
  total_musicas: number;
  imagem_url?: string;
  apenas_disco?: boolean;
}

export interface PastaGeneroItem {
  genero: string;
  total_musicas: number;
  subgeneros: string[];
  imagem_url?: string;
  apenas_disco?: boolean;
}

export interface QuickGridItemData {
  id: string;
  titulo: string;
  subtitulo: string;
  tipo: 'genero' | 'artista' | 'favoritas' | 'mix';
  valor: string;
  imagem_url: string;
  isCircular?: boolean;
}

export interface HomeData {
  destaque: ItemMusica | null;
  quick_grid: QuickGridItemData[];
  mix_recomendado: ItemMusica[];
  artistas: ArtistaItem[];
  generos: PastaGeneroItem[];
  total_biblioteca: number;
}

export async function obterHomeData(token?: string | null): Promise<HomeData> {
  return api<HomeData>('musicas/home', { token });
}

export function construirUrlStream(musica: ItemMusica, token?: string | null): string {
  let url = musica.stream_url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const base = API_URL.replace(/\/+$/, '');
    url = `${base}/${url.replace(/^\/+/, '')}`;
  }
  if (token) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}token=${encodeURIComponent(token)}`;
  }
  return url;
}

export async function listarMusicas(
  filtros: FiltrosMusica = {},
  token?: string | null
): Promise<RespostaBiblioteca> {
  const params = new URLSearchParams();
  if (filtros.tipo) params.append('tipo', filtros.tipo);
  if (filtros.q) params.append('q', filtros.q);
  if (filtros.genero) params.append('genero', filtros.genero);
  if (filtros.subgenero) params.append('subgenero', filtros.subgenero);
  if (filtros.artista) params.append('artista', filtros.artista);
  if (filtros.origem) params.append('origem', filtros.origem);
  if (filtros.limit !== undefined) params.append('limit', String(filtros.limit));
  if (filtros.page !== undefined) params.append('page', String(filtros.page));

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return api<RespostaBiblioteca>(`musicas${queryStr}`, { token });
}

export async function obterArtistas(token?: string | null): Promise<ArtistaItem[]> {
  return api<ArtistaItem[]>('musicas/artistas', { token });
}

export async function obterPastasGeneros(token?: string | null): Promise<PastaGeneroItem[]> {
  return api<PastaGeneroItem[]>('musicas/pastas-generos', { token });
}

export async function obterCatalogoGeneros(
  token?: string | null
): Promise<Record<string, string[]>> {
  return api<Record<string, string[]>>('musicas/generos', { token });
}

export async function alternarFavorita(id: number, token?: string | null): Promise<{ favorita: boolean }> {
  return api<{ favorita: boolean }>(`musicas/${id}/favoritar`, {
    method: 'POST',
    token,
  });
}

export async function sincronizarPastaMusicas(token?: string | null): Promise<any> {
  return api('musicas/sincronizar', {
    method: 'POST',
    token,
  });
}
