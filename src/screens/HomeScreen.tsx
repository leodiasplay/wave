import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';
import SpotifyCarousel, { CarouselCardItem } from '../components/SpotifyCarousel';
import TrackItem from '../components/TrackItem';
import {
  ItemMusica,
  HomeData,
  PastaGeneroItem,
  obterHomeData,
  obterPastasGeneros,
  listarMusicas,
  alternarFavorita,
  isSameTrack,
} from '../services/musicaApi';
import { Playlist, listarPlaylists } from '../services/playlistApi';

interface HomeScreenProps {
  token: string | null;
  player: any;
  onNavegarTab: (tab: any, params?: any) => void;
  onAdicionarPlaylist?: (musica: ItemMusica) => void;
  onOptionsPress?: (musica: ItemMusica) => void;
}

interface ArtistaCardItem {
  artista: string;
  total_musicas: number;
  imagem_url: string;
}

const FOTOS_ARTISTAS_PSYTRANCE: Record<string, string> = {
  Vegas: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
  Mandragora: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
  Astrix: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
  'Vini Vici': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
  Neelix: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
  Blazy: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=400&auto=format&fit=crop&q=80',
  Avalon: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80',
  Berg: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&auto=format&fit=crop&q=80',
  'Burn in Noise': 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=400&auto=format&fit=crop&q=80',
  'Alien Chaos': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
  'Belik Boom': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
  Gonzi: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=400&auto=format&fit=crop&q=80',
  Sajanka: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
  'Claudinho Brasil': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&auto=format&fit=crop&q=80',
  'Liquid Soul': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80',
  Phaxe: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
  'Morten Granau': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
  Omiki: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
  'Fabio Fusco': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
  'Ghost Rider': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
  'Astral Projection': 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=400&auto=format&fit=crop&q=80',
  Cosmosis: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80',
  'Crazy Astronaut': 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&auto=format&fit=crop&q=80',
  'Mad Tribe': 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=400&auto=format&fit=crop&q=80',
  Skazi: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
  'Sesto Sento': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
  UnderCover: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=400&auto=format&fit=crop&q=80',
  'Special M': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
  Tristan: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&auto=format&fit=crop&q=80',
  'E-Mantra': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80',
  Goasia: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
  Virtuanoise: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
  Oxidaksi: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
  Arjuna: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
  'Man With No Name': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
  Maramba: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=400&auto=format&fit=crop&q=80',
};

const FOTOS_POOL = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=400&auto=format&fit=crop&q=80',
];

function getFotoArtistaPsy(nome: string): string {
  if (FOTOS_ARTISTAS_PSYTRANCE[nome]) return FOTOS_ARTISTAS_PSYTRANCE[nome];
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = (hash << 5) - hash + nome.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FOTOS_POOL.length;
  return FOTOS_POOL[index];
}

const ARTISTAS_PSYTRANCE_INICIAIS: ArtistaCardItem[] = Object.keys(FOTOS_ARTISTAS_PSYTRANCE).map((nome) => ({
  artista: nome,
  total_musicas: nome === 'Vegas' ? 11 : 10,
  imagem_url: FOTOS_ARTISTAS_PSYTRANCE[nome],
}));

const MAPA_IMAGENS_GENEROS: Record<string, string> = {
  'Hard Techno': 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&auto=format&fit=crop&q=80',
  Psytrance: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
  Eletrônica: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
  Rock: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
  Funk: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
  Sertanejo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
  Rap: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  Reggae: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=80',
  Pop: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=800&auto=format&fit=crop&q=80',
};

export default function HomeScreen({
  token,
  player,
  onNavegarTab,
  onAdicionarPlaylist,
  onOptionsPress,
}: HomeScreenProps) {
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [pastasGeneros, setPastasGeneros] = useState<PastaGeneroItem[]>([]);
  const [artistasPsytrance, setArtistasPsytrance] = useState<ArtistaCardItem[]>(ARTISTAS_PSYTRANCE_INICIAIS);

  // Estados de navegação interna (Gênero -> Subvertente -> Artista)
  const [generoSelecionado, setGeneroSelecionado] = useState<string | null>(null);
  const [subgeneroSelecionado, setSubgeneroSelecionado] = useState<string | null>(null);
  const [artistaFiltroNoGenero, setArtistaFiltroNoGenero] = useState<string | null>(null);

  // Seleção de artista a partir da Home principal
  const [artistaSelecionado, setArtistaSelecionado] = useState<string | null>(null);

  // Faixas do gênero ou artista carregadas
  const [musicasFiltradas, setMusicasFiltradas] = useState<ItemMusica[]>([]);
  const [carregandoFiltradas, setCarregandoFiltradas] = useState(false);
  const [buscaInterna, setBuscaInterna] = useState('');

  const carregarDadosHome = useCallback(async () => {
    try {
      setCarregando(true);
      const [hRes, pRes, pgRes, psyRes] = await Promise.all([
        obterHomeData(token).catch(() => null),
        listarPlaylists(token).catch(() => []),
        obterPastasGeneros(token).catch(() => []),
        listarMusicas({ genero: 'Psytrance', limit: 500 }, token).catch(() => null),
      ]);

      if (hRes) {
        setHomeData(hRes);
        if (hRes.destaque && player.setDefaultTrackIfEmpty) {
          player.setDefaultTrackIfEmpty(hRes.destaque);
        }
      }
      setPlaylists(pRes || []);
      setPastasGeneros(pgRes || []);

      if (psyRes?.data && psyRes.data.length > 0) {
        const mapPsy = new Map<string, { artista: string; total_musicas: number; imagem_url: string }>();
        psyRes.data.forEach((m) => {
          const nome = m.artista?.trim();
          if (!nome || nome === 'Desconhecido') return;
          const atual = mapPsy.get(nome);
          if (atual) {
            atual.total_musicas += 1;
          } else {
            mapPsy.set(nome, {
              artista: nome,
              total_musicas: 1,
              imagem_url: getFotoArtistaPsy(nome),
            });
          }
        });
        const listaPsy = Array.from(mapPsy.values()).sort((a, b) => b.total_musicas - a.total_musicas);
        if (listaPsy.length > 0) {
          setArtistasPsytrance(listaPsy);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar Home:', e);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    carregarDadosHome();
  }, [carregarDadosHome]);

  // Carrega todas as faixas de um gênero selecionado
  const handleSelecionarGenero = async (nomeGenero: string) => {
    setGeneroSelecionado(nomeGenero);
    setSubgeneroSelecionado(null);
    setArtistaFiltroNoGenero(null);
    setArtistaSelecionado(null);
    setBuscaInterna('');
    try {
      setCarregandoFiltradas(true);
      const res = await listarMusicas({ genero: nomeGenero, limit: 500 }, token);
      setMusicasFiltradas(res.data || []);
      if (res.data && res.data.length > 0) {
        player.setQueue(res.data);
      }
    } catch (e) {
      console.warn('Erro ao carregar músicas do gênero:', e);
    } finally {
      setCarregandoFiltradas(false);
    }
  };

  // Carrega faixas quando um artista é selecionado na Home principal
  const handleSelecionarArtista = async (nomeArtista: string) => {
    setArtistaSelecionado(nomeArtista);
    setGeneroSelecionado(null);
    setSubgeneroSelecionado(null);
    setArtistaFiltroNoGenero(null);
    setBuscaInterna('');
    try {
      setCarregandoFiltradas(true);
      const res = await listarMusicas({ artista: nomeArtista, limit: 200 }, token);
      setMusicasFiltradas(res.data || []);
      if (res.data && res.data.length > 0) {
        player.setQueue(res.data);
      }
    } catch (e) {
      console.warn('Erro ao carregar músicas do artista:', e);
    } finally {
      setCarregandoFiltradas(false);
    }
  };

  // Botão Voltar para retornar ao estado anterior ou à home
  const handleVoltar = () => {
    if (artistaFiltroNoGenero) {
      setArtistaFiltroNoGenero(null);
      return;
    }
    setArtistaSelecionado(null);
    setGeneroSelecionado(null);
    setSubgeneroSelecionado(null);
    setArtistaFiltroNoGenero(null);
    setMusicasFiltradas([]);
    setBuscaInterna('');
  };

  const handleToggleFavorita = async (musica: ItemMusica) => {
    if (!musica.id) return;
    try {
      const res = await alternarFavorita(musica.id, token);
      setMusicasFiltradas((prev) =>
        prev.map((m) =>
          m.stream_url === musica.stream_url ? { ...m, favorita: res.favorita } : m
        )
      );
    } catch (e) {
      console.warn('Erro ao alternar favorita:', e);
    }
  };

  const handlePlayFaixaFiltrada = (musica: ItemMusica, listaBase: ItemMusica[]) => {
    if (isSameTrack(player.currentTrack, musica)) {
      player.togglePlayPause();
    } else {
      player.play(musica, listaBase.length > 0 ? listaBase : [musica]);
    }
  };

  // Subvertentes oficiais daquele gênero
  const subgenerosDoGenero = useMemo(() => {
    if (!generoSelecionado) return [];
    const info = pastasGeneros.find((p) => p.genero === generoSelecionado);
    if (info && info.subgeneros && info.subgeneros.length > 0) {
      return info.subgeneros;
    }
    // Fallback dinâmico a partir das músicas carregadas
    const subs = new Set<string>();
    musicasFiltradas.forEach((m) => {
      if (m.subgenero && m.subgenero.trim()) subs.add(m.subgenero.trim());
    });
    return Array.from(subs).sort();
  }, [generoSelecionado, pastasGeneros, musicasFiltradas]);

  // Artistas presentes no gênero (e na subvertente ativa, se houver)
  const artistasDoGenero = useMemo(() => {
    if (!generoSelecionado) return [];
    const mapa = new Map<string, { artista: string; total_musicas: number; imagem_url?: string }>();

    musicasFiltradas.forEach((m) => {
      // Se tiver subvertente ativa, filtra apenas músicas daquela subvertente
      if (subgeneroSelecionado && m.subgenero !== subgeneroSelecionado) {
        return;
      }
      const nome = m.artista?.trim() || 'Desconhecido';
      const existing = mapa.get(nome);
      if (existing) {
        existing.total_musicas += 1;
      } else {
        const fotoHome = homeData?.artistas?.find((a) => (a.artista || '').toLowerCase() === nome.toLowerCase())?.imagem_url;
        mapa.set(nome, {
          artista: nome,
          total_musicas: 1,
          imagem_url: fotoHome || m.capa_url || undefined,
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) => b.total_musicas - a.total_musicas);
  }, [generoSelecionado, subgeneroSelecionado, musicasFiltradas, homeData]);

  // Faixas filtradas para exibição no detalhe do gênero
  const faixasExibidasNoGenero = useMemo(() => {
    return musicasFiltradas.filter((m) => {
      if (subgeneroSelecionado && m.subgenero !== subgeneroSelecionado) {
        return false;
      }
      if (artistaFiltroNoGenero && (m.artista || '').toLowerCase() !== (artistaFiltroNoGenero || '').toLowerCase()) {
        return false;
      }
      if (buscaInterna.trim()) {
        const termo = buscaInterna.toLowerCase();
        const matchTitulo = (m.titulo || '').toLowerCase().includes(termo);
        const matchArtista = (m.artista || '').toLowerCase().includes(termo);
        const matchSub = (m.subgenero || '').toLowerCase().includes(termo);
        if (!matchTitulo && !matchArtista && !matchSub) return false;
      }
      return true;
    });
  }, [musicasFiltradas, subgeneroSelecionado, artistaFiltroNoGenero, buscaInterna]);

  // Tocar todas as faixas do contexto atual
  const handleTocarTudo = () => {
    const lista = generoSelecionado ? faixasExibidasNoGenero : musicasFiltradas;
    if (lista.length > 0) {
      const tocandoDestaLista =
        player.isPlaying &&
        lista.some((m) => isSameTrack(player.currentTrack, m));
      if (tocandoDestaLista) {
        player.togglePlayPause();
      } else {
        player.play(lista[0], lista);
      }
    }
  };

  const psytranceCards: CarouselCardItem[] = useMemo(() => {
    return artistasPsytrance.map((a) => ({
      id: "psy-" + a.artista,
      titulo: a.artista,
      subtitulo: String(a.total_musicas) + (a.total_musicas === 1 ? " faixa" : " faixas"),
      imagemUrl: a.imagem_url,
      isCircular: true,
      onPress: () => handleSelecionarArtista(a.artista),
    }));
  }, [artistasPsytrance]);
  const mixCards: CarouselCardItem[] = (homeData?.mix_recomendado || []).map((m) => ({
    id: m.id || m.caminho_arquivo,
    titulo: m.titulo,
    subtitulo: `${m.artista}${m.duracao_formatada ? ' • ' + m.duracao_formatada : ''}`,
    imagemUrl:
      m.genero === 'Rock'
        ? 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80'
        : m.genero === 'Psytrance'
        ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    onPress: () => {
      player.play(m, homeData?.mix_recomendado || [m]);
    },
  }));

  const outrosArtistasCards: CarouselCardItem[] = useMemo(() => {
    return (homeData?.artistas || [])
      .filter((a) => !artistasPsytrance.some((p) => p.artista.toLowerCase() === a.artista.toLowerCase()))
      .map((a) => ({
        id: `outros-${a.artista}`,
        titulo: a.artista,
        subtitulo: `${a.total_musicas} ${a.total_musicas === 1 ? 'faixa' : 'faixas'}`,
        imagemUrl: (a as any).imagem_url || (a.artista.toLowerCase().includes('charlie')
          ? 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80'),
        isCircular: true,
        onPress: () => handleSelecionarArtista(a.artista),
      }));
  }, [homeData, artistasPsytrance]);

  const generosDisponiveis = homeData?.generos || [];
  const artistasDisponiveis = homeData?.artistas || [];

  // ========================================================
  // VIEW 1: DETALHE DO GÊNERO (SUBVERTENTES + ARTISTAS + MÚSICAS)
  // ========================================================
  if (generoSelecionado) {
    const bannerFoto =
      MAPA_IMAGENS_GENEROS[generoSelecionado] ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';

    return (
      <View style={styles.container}>
        {/* Barra Superior com Navegação Hierárquica */}
        <View style={styles.topBackBar}>
          <TouchableOpacity
            style={styles.btnVoltar}
            onPress={handleVoltar}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
            <Text style={styles.btnVoltarTexto}>
              {artistaFiltroNoGenero
                ? `Voltar para ${generoSelecionado}`
                : 'Voltar ao Início'}
            </Text>
          </TouchableOpacity>

          {artistaFiltroNoGenero && (
            <TouchableOpacity
              style={styles.btnVoltarHomeIcon}
              onPress={() => {
                setArtistaSelecionado(null);
                setGeneroSelecionado(null);
                setSubgeneroSelecionado(null);
                setArtistaFiltroNoGenero(null);
                setMusicasFiltradas([]);
                setBuscaInterna('');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="home-outline" size={20} color="#b3b3b3" />
            </TouchableOpacity>
          )}
        </View>

        {carregandoFiltradas ? (
          <View style={styles.centerLoadingContainer}>
            <ActivityIndicator size="large" color={SPOTIFY_COLORS.green} />
            <Text style={styles.centerLoadingText}>
              Carregando faixas de {generoSelecionado}...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
          {/* Hero Banner do Gênero */}
          <View style={styles.detailBanner}>
            <Image
              source={{ uri: bannerFoto }}
              style={styles.detailBannerImage}
              resizeMode="cover"
            />
            <Text style={styles.detailTypeBadge}>GÊNERO MUSICAL</Text>
            <Text style={styles.detailTitle}>{generoSelecionado}</Text>
            <Text style={styles.detailTrackCount}>
              {musicasFiltradas.length} músicas • {artistasDoGenero.length} artistas
              {subgeneroSelecionado ? ` • ${subgeneroSelecionado}` : ''}
            </Text>

            {/* Botão Tocar Tudo */}
            {faixasExibidasNoGenero.length > 0 && (
              <TouchableOpacity
                style={styles.btnTocarTudo}
                onPress={handleTocarTudo}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={
                    player.isPlaying &&
                    faixasExibidasNoGenero.some((m) => isSameTrack(player.currentTrack, m))
                      ? 'pause'
                      : 'play'
                  }
                  size={20}
                  color="#000000"
                />
                <Text style={styles.btnTocarTudoTexto}>
                  {player.isPlaying &&
                  faixasExibidasNoGenero.some((m) => isSameTrack(player.currentTrack, m))
                    ? 'Pausar'
                    : 'Tocar Todas as Faixas'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ==================================================== */}
          {/* SUBVERTENTES: CARROSSEL HORIZONTAL DE ABAS / PILLS    */}
          {/* ==================================================== */}
          {subgenerosDoGenero.length > 0 && (
            <View style={styles.subgenerosSection}>
              <View style={styles.subgenerosHeader}>
                <Ionicons name="git-branch-outline" size={18} color={SPOTIFY_COLORS.green} />
                <Text style={styles.subgenerosTitle}>Subvertentes de {generoSelecionado}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subgenerosPillsScroll}
              >
                {/* Pílula: Todas as Vertentes */}
                <TouchableOpacity
                  style={[
                    styles.subgeneroPill,
                    subgeneroSelecionado === null && styles.subgeneroPillAtivo,
                  ]}
                  onPress={() => {
                    setSubgeneroSelecionado(null);
                    setArtistaFiltroNoGenero(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.subgeneroPillTexto,
                      subgeneroSelecionado === null && styles.subgeneroPillTextoAtivo,
                    ]}
                  >
                    Todas ({musicasFiltradas.length})
                  </Text>
                </TouchableOpacity>

                {/* Pílulas de Cada Subvertente */}
                {subgenerosDoGenero.map((sub) => {
                  const ativo = subgeneroSelecionado === sub;
                  const totalSub = musicasFiltradas.filter((m) => m.subgenero === sub).length;

                  return (
                    <TouchableOpacity
                      key={sub}
                      style={[
                        styles.subgeneroPill,
                        ativo && styles.subgeneroPillAtivo,
                      ]}
                      onPress={() => {
                        setSubgeneroSelecionado(ativo ? null : sub);
                        setArtistaFiltroNoGenero(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.subgeneroPillTexto,
                          ativo && styles.subgeneroPillTextoAtivo,
                        ]}
                      >
                        {sub} {totalSub > 0 ? `(${totalSub})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ==================================================== */}
          {/* GRID DE ARTISTAS DO GÊNERO / SUBVERTENTE             */}
          {/* ==================================================== */}
          {artistasDoGenero.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="people" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>
                    Artistas {subgeneroSelecionado ? `• ${subgeneroSelecionado}` : ''}
                  </Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  {artistasDoGenero.length} {artistasDoGenero.length === 1 ? 'artista' : 'artistas'} encontrados. Toque para filtrar suas músicas.
                </Text>
              </View>

              <View style={styles.artistsGrid}>
                {artistasDoGenero.map((a) => {
                  const isSelectedArtist = (artistaFiltroNoGenero || '').toLowerCase() === (a.artista || '').toLowerCase();
                  const foto =
                    a.imagem_url ||
                    ((a.artista || '').toLowerCase().includes('charlie')
                      ? 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80');

                  return (
                    <TouchableOpacity
                      key={a.artista}
                      style={[
                        styles.artistCard,
                        isSelectedArtist && styles.artistCardAtivo,
                      ]}
                      onPress={() => {
                        if (isSelectedArtist) {
                          setArtistaFiltroNoGenero(null);
                        } else {
                          setArtistaFiltroNoGenero(a.artista);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ position: 'relative' }}>
                        <Image source={{ uri: foto }} style={styles.artistAvatar} />
                        {isSelectedArtist && (
                          <View style={styles.artistSelectedBadge}>
                            <Ionicons name="checkmark" size={14} color="#000000" />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.artistName,
                          isSelectedArtist && styles.artistNameAtivo,
                        ]}
                        numberOfLines={1}
                      >
                        {a.artista}
                      </Text>
                      <Text style={styles.artistCount}>
                        {a.total_musicas} faixas
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ==================================================== */}
          {/* BARRA DE FILTRO DE ARTISTA ATIVO (CHIP REMOVÍVEL)   */}
          {/* ==================================================== */}
          {artistaFiltroNoGenero && (
            <View style={styles.activeFilterChipRow}>
              <View style={styles.activeFilterChip}>
                <Ionicons name="person" size={14} color={SPOTIFY_COLORS.green} style={{ marginRight: 6 }} />
                <Text style={styles.activeFilterChipTexto}>
                  Filtrando por: <Text style={{ fontWeight: '800', color: '#ffffff' }}>{artistaFiltroNoGenero}</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setArtistaFiltroNoGenero(null)}
                  style={{ marginLeft: 8, padding: 2 }}
                >
                  <Ionicons name="close-circle" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ==================================================== */}
          {/* BUSCA RÁPIDA NAS FAIXAS                             */}
          {/* ==================================================== */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={SPOTIFY_COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Buscar faixa em ${generoSelecionado}...`}
              placeholderTextColor={SPOTIFY_COLORS.textSecondary}
              value={buscaInterna}
              onChangeText={setBuscaInterna}
            />
            {buscaInterna ? (
              <TouchableOpacity onPress={() => setBuscaInterna('')}>
                <Ionicons name="close-circle" size={18} color={SPOTIFY_COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ==================================================== */}
          {/* LISTA DE MÚSICAS DO GÊNERO / SUBVERTENTE            */}
          {/* ==================================================== */}
          <View style={styles.trackListContainer}>
            <View style={styles.trackListHeader}>
              <Text style={styles.trackListTitle}>Faixas</Text>
              <Text style={styles.trackListCount}>
                {faixasExibidasNoGenero.length} {faixasExibidasNoGenero.length === 1 ? 'faixa' : 'faixas'}
              </Text>
            </View>

            {carregandoFiltradas ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={SPOTIFY_COLORS.green} />
                <Text style={styles.loadingText}>Carregando catálogo...</Text>
              </View>
            ) : faixasExibidasNoGenero.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={48} color={SPOTIFY_COLORS.textSecondary} />
                <Text style={styles.emptyText}>Nenhuma música encontrada para este filtro.</Text>
                {(subgeneroSelecionado || artistaFiltroNoGenero) && (
                  <TouchableOpacity
                    style={styles.btnClearFilter}
                    onPress={() => {
                      setSubgeneroSelecionado(null);
                      setArtistaFiltroNoGenero(null);
                    }}
                  >
                    <Text style={styles.btnClearFilterText}>Limpar Filtros</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              faixasExibidasNoGenero.map((item, index) => {
                const isSelectedThis = isSameTrack(player.currentTrack, item);
                const isPlayingThis = player.isPlaying && isSelectedThis;

                return (
                  <TrackItem
                    key={item.id || item.caminho_arquivo || index}
                    musica={item}
                    isPlayingThis={isPlayingThis}
                    isSelectedThis={isSelectedThis}
                    onPlayPress={() => handlePlayFaixaFiltrada(item, faixasExibidasNoGenero)}
                    onFavoritePress={() => handleToggleFavorita(item)}
                    onAddToPlaylistPress={() =>
                      onAdicionarPlaylist && onAdicionarPlaylist(item)
                    }
                    onOptionsPress={() =>
                      onOptionsPress ? onOptionsPress(item) : onAdicionarPlaylist && onAdicionarPlaylist(item)
                    }
                  />
                );
              })
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
        )}
      </View>
    );
  }

  // ========================================================
  // VIEW 2: DETALHE DE ARTISTA SELECIONADO NA HOME PRINCIPAL
  // ========================================================
  if (artistaSelecionado) {
    const fotoBanner =
      artistaSelecionado.toLowerCase().includes('charlie')
        ? 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80';

    const faixasArtista = musicasFiltradas.filter((m) => {
      if (!buscaInterna.trim()) return true;
      const t = buscaInterna.toLowerCase();
      return m.titulo.toLowerCase().includes(t) || (m.album && m.album.toLowerCase().includes(t));
    });

    return (
      <View style={styles.container}>
        <View style={styles.topBackBar}>
          <TouchableOpacity
            style={styles.btnVoltar}
            onPress={handleVoltar}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
            <Text style={styles.btnVoltarTexto}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.detailBanner}>
            <Image
              source={{ uri: fotoBanner }}
              style={[styles.detailBannerImage, styles.bannerCircular]}
              resizeMode="cover"
            />
            <Text style={styles.detailTypeBadge}>ARTISTA</Text>
            <Text style={styles.detailTitle}>{artistaSelecionado}</Text>
            <Text style={styles.detailTrackCount}>
              {musicasFiltradas.length} músicas disponíveis na biblioteca
            </Text>

            {musicasFiltradas.length > 0 && (
              <TouchableOpacity
                style={styles.btnTocarTudo}
                onPress={handleTocarTudo}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={
                    player.isPlaying &&
                    musicasFiltradas.some((m) => isSameTrack(player.currentTrack, m))
                      ? 'pause'
                      : 'play'
                  }
                  size={20}
                  color="#000000"
                />
                <Text style={styles.btnTocarTudoTexto}>
                  {player.isPlaying &&
                  musicasFiltradas.some((m) => isSameTrack(player.currentTrack, m))
                    ? 'Pausar'
                    : 'Tocar Todas as Músicas'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={SPOTIFY_COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Filtrar faixas de ${artistaSelecionado}...`}
              placeholderTextColor={SPOTIFY_COLORS.textSecondary}
              value={buscaInterna}
              onChangeText={setBuscaInterna}
            />
            {buscaInterna ? (
              <TouchableOpacity onPress={() => setBuscaInterna('')}>
                <Ionicons name="close-circle" size={18} color={SPOTIFY_COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {carregandoFiltradas ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={SPOTIFY_COLORS.green} />
              <Text style={styles.loadingText}>Carregando músicas...</Text>
            </View>
          ) : faixasArtista.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color={SPOTIFY_COLORS.textSecondary} />
              <Text style={styles.emptyText}>Nenhuma música encontrada.</Text>
            </View>
          ) : (
            faixasArtista.map((item, index) => {
              const isSelectedThis = isSameTrack(player.currentTrack, item);
              const isPlayingThis = player.isPlaying && isSelectedThis;

              return (
                <TrackItem
                  key={item.id || item.caminho_arquivo || index}
                  musica={item}
                  isPlayingThis={isPlayingThis}
                  isSelectedThis={isSelectedThis}
                  onPlayPress={() => handlePlayFaixaFiltrada(item, faixasArtista)}
                  onFavoritePress={() => handleToggleFavorita(item)}
                  onAddToPlaylistPress={() =>
                    onAdicionarPlaylist && onAdicionarPlaylist(item)
                  }
                  onOptionsPress={() =>
                    onOptionsPress ? onOptionsPress(item) : onAdicionarPlaylist && onAdicionarPlaylist(item)
                  }
                />
              );
            })
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  // ========================================================
  // VIEW 3: HOME PRINCIPAL (CARROSSEL PSYTRANCE, GÊNEROS E MIX WAVE)
  // ========================================================


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregarDadosHome();
            }}
            tintColor={SPOTIFY_COLORS.green}
          />
        }
      >
        {carregando && !refreshing && !homeData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SPOTIFY_COLORS.green} />
            <Text style={styles.loadingText}>Carregando catálogo do Wave...</Text>
          </View>
        ) : (
          <>
            {/* ==================================================== */}
            {/* SEÇÃO 1: GÊNEROS DISPONÍVEIS COM SUBVERTENTES        */}
            {/* ==================================================== */}
            {generosDisponiveis.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Gêneros Musicais</Text>
                  <Text style={styles.sectionSubtitle}>
                    Toque no gênero para explorar artistas e subvertentes
                  </Text>
                </View>

                <View style={styles.genresGrid}>
                  {generosDisponiveis.map((g) => {
                    const img =
                      MAPA_IMAGENS_GENEROS[g.genero] ||
                      (g as any).imagem_url ||
                      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80';

                    // Encontra subvertentes cadastradas para este gênero
                    const infoPasta = pastasGeneros.find((p) => p.genero === g.genero);
                    const subLista = infoPasta?.subgeneros || [];

                    return (
                      <TouchableOpacity
                        key={g.genero}
                        style={styles.genreCard}
                        onPress={() => handleSelecionarGenero(g.genero)}
                        activeOpacity={0.82}
                      >
                        <Image source={{ uri: img }} style={styles.genreCardImage} />
                        <View style={styles.genreCardOverlay}>
                          <Text style={styles.genreCardTitle}>{g.genero}</Text>
                          <Text style={styles.genreCardCount}>
                            {g.total_musicas} faixas
                          </Text>

                          {subLista.length > 0 && (
                            <Text style={styles.genreCardSubPreview} numberOfLines={1}>
                              {subLista.slice(0, 3).join(' • ')}
                            </Text>
                          )}
                        </View>
                        <View style={styles.playIconBadge}>
                          <Ionicons name="arrow-forward" size={14} color="#000000" />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ==================================================== */}
            {/* SEÇÃO 2: CARROSSEL DE ARTISTAS PSYTRANCE (DESTAQUE)  */}
            {/* ==================================================== */}
            {psytranceCards.length > 0 && (
              <SpotifyCarousel
                titulo="Psytrance"
                subtitulo="Todos os artistas da vertente • Toque para explorar as músicas"
                items={psytranceCards}
                onPressVerTudo={() => handleSelecionarGenero('Psytrance')}
              />
            )}

            {/* ==================================================== */}
            {/* SEÇÃO 3: OUTROS ARTISTAS (CARROSSEL)                 */}
            {/* ==================================================== */}
            {outrosArtistasCards.length > 0 && (
              <SpotifyCarousel
                titulo="Outros Artistas"
                subtitulo="Mais artistas do acervo Wave"
                items={outrosArtistasCards}
              />
            )}


            {/* ==================================================== */}
            {/* SEÇÃO 3: MIX WAVE • FAIXAS RECOMENDADAS              */}
            {/* ==================================================== */}
            {mixCards.length > 0 ? (
              <SpotifyCarousel
                titulo="Mix Wave • Faixas Selecionadas"
                subtitulo="Ouça seleções variadas diretamente"
                items={mixCards}
                onPressVerTudo={() => onNavegarTab('buscar')}
              />
            ) : null}

            <View style={{ height: 120 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  centerLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  centerLoadingText: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 12,
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  btnClearFilter: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#282828',
    borderRadius: 20,
  },
  btnClearFilterText: {
    color: SPOTIFY_COLORS.green,
    fontWeight: '700',
    fontSize: 13,
  },

  // Barra Superior Voltar
  topBackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  btnVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#242424',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  btnVoltarTexto: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
    marginLeft: 6,
  },
  btnVoltarHomeIcon: {
    padding: 8,
    backgroundColor: '#242424',
    borderRadius: 20,
  },

  // Hero Banner Detalhe
  detailBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailBannerImage: {
    width: 140,
    height: 140,
    borderRadius: 10,
    marginBottom: 16,
  },
  bannerCircular: {
    borderRadius: 70,
  },
  detailTypeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: SPOTIFY_COLORS.green,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  detailTrackCount: {
    fontSize: 13,
    color: SPOTIFY_COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  btnTocarTudo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginTop: 4,
    elevation: 4,
  },
  btnTocarTudoTexto: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Subvertentes Pills
  subgenerosSection: {
    marginTop: 18,
    marginBottom: 6,
  },
  subgenerosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  subgenerosTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  },
  subgenerosPillsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  subgeneroPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#242424',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  subgeneroPillAtivo: {
    backgroundColor: SPOTIFY_COLORS.green,
    borderColor: SPOTIFY_COLORS.green,
  },
  subgeneroPillTexto: {
    color: '#b3b3b3',
    fontSize: 13,
    fontWeight: '600',
  },
  subgeneroPillTextoAtivo: {
    color: '#000000',
    fontWeight: '700',
  },

  // Active Filter Chip
  activeFilterChipRow: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a2a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SPOTIFY_COLORS.green,
  },
  activeFilterChipTexto: {
    fontSize: 12.5,
    color: '#dddddd',
  },

  // Caixa de Busca Interna
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 14,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
  },

  // Track list
  trackListContainer: {
    marginTop: 8,
  },
  trackListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  trackListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  trackListCount: {
    fontSize: 12,
    color: SPOTIFY_COLORS.textSecondary,
  },

  // Seções da Home
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: SPOTIFY_COLORS.textSecondary,
    marginTop: 2,
  },

  // Grid de Gêneros (2 colunas)
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  genreCard: {
    width: '48.5%',
    height: 104,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#1f1f1f',
  },
  genreCardImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.65,
  },
  genreCardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    padding: 10,
    justifyContent: 'flex-end',
  },
  genreCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  genreCardCount: {
    fontSize: 11.5,
    color: SPOTIFY_COLORS.green,
    fontWeight: '700',
    marginTop: 1,
  },
  genreCardSubPreview: {
    fontSize: 10,
    color: '#b3b3b3',
    marginTop: 2,
  },
  playIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: SPOTIFY_COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid de Artistas (3 colunas)
  artistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  artistCard: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  artistCardAtivo: {
    borderColor: SPOTIFY_COLORS.green,
    backgroundColor: 'rgba(30, 215, 96, 0.08)',
  },
  artistAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    backgroundColor: '#282828',
  },
  artistSelectedBadge: {
    position: 'absolute',
    bottom: 8,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: SPOTIFY_COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#121212',
  },
  artistName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  artistNameAtivo: {
    color: SPOTIFY_COLORS.green,
  },
  artistCount: {
    fontSize: 11,
    color: SPOTIFY_COLORS.green,
    marginTop: 2,
  },
});
