import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ArtistaItem,
  ItemMusica,
  PaginacaoMusica,
  obterArtistas,
  listarMusicas,
  alternarFavorita,
  isSameTrack,
} from '../services/musicaApi';
import TrackItem from '../components/TrackItem';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';
import { obterFotoRealGdrive } from '../constants/artistasGdriveMap';

interface ArtistasScreenProps {
  token: string | null;
  player: any;
  onAdicionarPlaylist?: (musica: ItemMusica) => void;
}

export default function ArtistasScreen({ token, player, onAdicionarPlaylist }: ArtistasScreenProps) {
  const [artistas, setArtistas] = useState<ArtistaItem[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Artista aberto
  const [artistaAberto, setArtistaAberto] = useState<ArtistaItem | null>(null);
  const [musicasArtista, setMusicasArtista] = useState<ItemMusica[]>([]);
  const [paginacao, setPaginacao] = useState<PaginacaoMusica | null>(null);
  const [carregandoMusicas, setCarregandoMusicas] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);

  const carregarArtistas = useCallback(async () => {
    try {
      setCarregando(true);
      const lista = await obterArtistas(token);
      const listaValida = (lista || []).filter((a: ArtistaItem) => (a.total_musicas || 0) > 0);
      setArtistas(listaValida);
    } catch (e) {
      console.warn('Erro ao carregar artistas:', e);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    carregarArtistas();
  }, [carregarArtistas]);

  // Carrega as primeiras 5 músicas do artista
  const carregarMusicasArtista = useCallback(async (nomeArtista: string) => {
    try {
      setCarregandoMusicas(true);
      const res = await listarMusicas(
        {
          artista: nomeArtista,
          limit: 5,
          page: 1,
        },
        token
      );
      setMusicasArtista(res.data);
      setPaginacao(res.pagination || null);
      player.setQueue(res.data);
    } catch (e) {
      console.warn('Erro ao carregar músicas do artista:', e);
    } finally {
      setCarregandoMusicas(false);
    }
  }, [token]);

  const carregarMaisFaixas = async (todas: boolean = false) => {
    if (!artistaAberto || carregandoMais) return;
    try {
      setCarregandoMais(true);
      const nextPage = (paginacao?.current_page || 1) + 1;
      const res = await listarMusicas(
        {
          artista: artistaAberto.artista,
          limit: todas ? undefined : 5,
          page: todas ? undefined : nextPage,
        },
        token
      );

      if (todas) {
        setMusicasArtista(res.data);
        player.setQueue(res.data);
        setPaginacao(null);
      } else {
        const unicas = [...musicasArtista];
        res.data.forEach((item) => {
          if (!unicas.some((m) => (m.id && m.id === item.id) || m.caminho_arquivo === item.caminho_arquivo)) {
            unicas.push(item);
          }
        });
        setMusicasArtista(unicas);
        player.setQueue(unicas);
        setPaginacao(res.pagination || null);
      }
    } catch (e) {
      console.warn('Erro ao carregar mais faixas do artista:', e);
    } finally {
      setCarregandoMais(false);
    }
  };

  const abrirArtista = (a: ArtistaItem) => {
    setArtistaAberto(a);
    carregarMusicasArtista(a.artista);
  };

  const voltarParaArtistas = () => {
    setArtistaAberto(null);
    setMusicasArtista([]);
    setPaginacao(null);
  };

  const handleFavoritar = async (musica: ItemMusica) => {
    if (!musica.id) return;
    try {
      const res = await alternarFavorita(musica.id, token);
      setMusicasArtista((prev) =>
        prev.map((m) => (m.id === musica.id ? { ...m, favorita: res.favorita } : m))
      );
    } catch (e) {
      console.warn('Erro ao favoritar música:', e);
    }
  };

  const artistasFiltrados = artistas.filter((a) =>
    a.artista.toLowerCase().includes(busca.toLowerCase().trim())
  );

  if (carregando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Carregando artistas...</Text>
      </View>
    );
  }

  // --- TELA DETALHES DO ARTISTA ---
  if (artistaAberto) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={voltarParaArtistas}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerMainTitle}>{artistaAberto.artista}</Text>
            <Text style={styles.headerSubTitle}>Discografia • {artistaAberto.total_musicas} músicas</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Card do Artista */}
          <View style={styles.artistHero}>
            {obterFotoRealGdrive(artistaAberto.artista) || artistaAberto.foto_perfil_url ? (
              <Image
                source={{ uri: (obterFotoRealGdrive(artistaAberto.artista) || artistaAberto.foto_perfil_url)! }}
                style={styles.artistAvatarLargeImg}
              />
            ) : (
              <View style={styles.artistAvatarLarge}>
                <Ionicons name="person" size={48} color="#38bdf8" />
              </View>
            )}
            <Text style={styles.artistHeroName}>{artistaAberto.artista}</Text>
            <View style={styles.artistHeroBadge}>
              <Ionicons name="musical-notes" size={14} color="#38bdf8" />
              <Text style={styles.artistHeroBadgeText}>{artistaAberto.total_musicas} faixas disponíveis</Text>
            </View>

            {musicasArtista.length > 0 && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#1ed760',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 24,
                  marginTop: 12,
                }}
                onPress={() => {
                  const tocandoDestaLista =
                    player.isPlaying &&
                    musicasArtista.some((m) => isSameTrack(player.currentTrack, m));
                  if (tocandoDestaLista) {
                    player.togglePlayPause();
                  } else {
                    player.play(musicasArtista[0], musicasArtista);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    player.isPlaying &&
                    musicasArtista.some((m) => isSameTrack(player.currentTrack, m))
                      ? 'pause'
                      : 'play'
                  }
                  size={18}
                  color="#000000"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: '#000000', fontWeight: '700', fontSize: 14 }}>
                  {player.isPlaying &&
                  musicasArtista.some((m) => isSameTrack(player.currentTrack, m))
                    ? 'Pausar'
                    : 'Tocar Tudo'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionLabel}>Faixas de {artistaAberto.artista}:</Text>

          {carregandoMusicas ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#38bdf8" />
              <Text style={styles.loadingBoxText}>Buscando faixas do artista...</Text>
            </View>
          ) : musicasArtista.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="musical-notes-outline" size={42} color="#475569" />
              <Text style={styles.emptyTitle}>Nenhuma faixa cadastrada</Text>
            </View>
          ) : (
            <>
              {musicasArtista.map((m) => {
                const isSelectedThis = isSameTrack(player.currentTrack, m);
                const isPlayingThis = player.isPlaying && isSelectedThis;

                return (
                  <TrackItem
                    key={m.id ? `m-${m.id}` : `f-${m.caminho_arquivo}`}
                    musica={m}
                    isPlayingThis={isPlayingThis}
                    isSelectedThis={isSelectedThis}
                    onPlayPress={() => {
                      if (isSelectedThis) {
                        player.togglePlayPause();
                      } else {
                        player.play(m, musicasArtista);
                      }
                    }}
                    onFavoritePress={() => handleFavoritar(m)}
                    onAddToPlaylistPress={() => onAdicionarPlaylist?.(m)}
                  />
                );
              })}

              {/* Paginação Instantânea */}
              {paginacao && paginacao.has_more && (
                <View style={styles.paginacaoBox}>
                  <View style={styles.paginacaoInfoRow}>
                    <Ionicons name="flash" size={15} color="#38bdf8" />
                    <Text style={styles.paginacaoTexto}>
                      Exibindo <Text style={styles.paginacaoDestaque}>{musicasArtista.length}</Text> de{' '}
                      <Text style={styles.paginacaoDestaque}>{paginacao.total}</Text> faixas
                    </Text>
                  </View>

                  <View style={styles.paginacaoBotoesRow}>
                    <TouchableOpacity
                      style={styles.btnCarregarMais}
                      onPress={() => carregarMaisFaixas(false)}
                      disabled={carregandoMais}
                    >
                      {carregandoMais ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.btnCarregarMaisTexto}>+ 5 faixas</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnCarregarTodas}
                      onPress={() => carregarMaisFaixas(true)}
                      disabled={carregandoMais}
                    >
                      <Ionicons name="play-forward-outline" size={16} color="#38bdf8" style={{ marginRight: 6 }} />
                      <Text style={styles.btnCarregarTodasTexto}>Carregar Todas ({paginacao.total})</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // --- LISTA GERAL DE ARTISTAS ---
  return (
    <View style={styles.container}>
      <View style={styles.mainHeader}>
        <View>
          <Text style={styles.appTitle}>Artistas</Text>
          <Text style={styles.appSubtitle}>{artistas.length} artistas no acervo</Text>
        </View>
        <TouchableOpacity style={styles.iconRefresh} onPress={carregarArtistas}>
          <Ionicons name="refresh" size={20} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      {/* Busca de Artistas */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artista por nome..."
            placeholderTextColor="#64748b"
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.artistasList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregarArtistas(); }} tintColor="#38bdf8" />}
      >
        {artistasFiltrados.map((a) => (
          <TouchableOpacity
            key={a.artista}
            style={styles.artistaRow}
            onPress={() => abrirArtista(a)}
            activeOpacity={0.7}
          >
            {obterFotoRealGdrive(a.artista) || a.foto_perfil_url ? (
              <Image
                source={{ uri: (obterFotoRealGdrive(a.artista) || a.foto_perfil_url)! }}
                style={styles.artistAvatarImg}
              />
            ) : (
              <View style={styles.artistAvatar}>
                <Ionicons name="person" size={22} color="#38bdf8" />
              </View>
            )}

            <View style={styles.artistaInfo}>
              <Text style={styles.artistaNome} numberOfLines={1}>{a.artista}</Text>
              <Text style={styles.artistaTotal}>{a.total_musicas} {a.total_musicas === 1 ? 'música' : 'músicas'}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  mainHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: SPOTIFY_COLORS.text,
    letterSpacing: -0.4,
  },
  appSubtitle: {
    fontSize: 12.5,
    color: SPOTIFY_COLORS.textSecondary,
    marginTop: 2,
  },
  iconRefresh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: SPOTIFY_COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: SPOTIFY_COLORS.text,
    fontSize: 13.5,
    padding: 0,
  },
  artistasList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 8,
  },
  artistaRow: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
  },
  artistAvatarLargeImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1e293b',
    borderWidth: 3,
    borderColor: '#38bdf8',
  },
  artistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  artistaInfo: {
    flex: 1,
  },
  artistaNome: {
    color: SPOTIFY_COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  artistaTotal: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12.5,
    marginTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: SPOTIFY_COLORS.background,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerMainTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubTitle: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  artistHero: {
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.cardLarge,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  artistAvatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: SPOTIFY_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  artistHeroName: {
    color: SPOTIFY_COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  artistHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30, 215, 96, 0.12)',
    borderRadius: SPOTIFY_RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  artistHeroBadgeText: {
    color: SPOTIFY_COLORS.green,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sectionLabel: {
    color: SPOTIFY_COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingBoxText: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 13,
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.cardLarge,
  },
  emptyTitle: {
    color: SPOTIFY_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  paginacaoBox: {
    marginTop: 14,
    padding: 16,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.cardLarge,
    alignItems: 'center',
    gap: 12,
  },
  paginacaoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginacaoTexto: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '500',
  },
  paginacaoDestaque: {
    color: '#ffffff',
    fontWeight: '700',
  },
  paginacaoBotoesRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btnCarregarMais: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPOTIFY_COLORS.green,
    paddingVertical: 12,
    borderRadius: SPOTIFY_RADIUS.pill,
  },
  btnCarregarMaisTexto: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  btnCarregarTodas: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPOTIFY_COLORS.surface,
    paddingVertical: 12,
    borderRadius: SPOTIFY_RADIUS.pill,
  },
  btnCarregarTodasTexto: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
