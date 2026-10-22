import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PastaGeneroItem,
  ArtistaItem,
  ItemMusica,
  PaginacaoMusica,
  obterPastasGeneros,
  obterCatalogoGeneros,
  obterArtistas,
  listarMusicas,
  alternarFavorita,
  isSameTrack,
} from '../services/musicaApi';
import TrackItem from '../components/TrackItem';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

const CORES_TILES: Record<string, string> = {
  'Psytrance': '#8b5cf6',
  'Eletrônica': '#1e3264',
  'Rock': '#e91429',
  'Funk': '#e1118c',
  'Sertanejo': '#148a08',
  'Rap': '#bc5900',
  'Reggae': '#e8115b',
  'Pop': '#8d67ab',
};

const MAPA_IMAGENS: Record<string, string> = {
  'Psytrance': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'Eletrônica': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
  'Rock': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
  'Funk': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  'Sertanejo': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'Rap': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  'Reggae': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop&q=80',
  'Pop': 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=600&auto=format&fit=crop&q=80',
};

interface GenerosScreenProps {
  token: string | null;
  player: any;
  onAdicionarPlaylist?: (musica: ItemMusica) => void;
  onOptionsPress?: (musica: ItemMusica) => void;
  onVoltar?: () => void;
  initialGenero?: string | null;
  initialSubgenero?: string | null;
  initialArtista?: string | null;
}

type FiltroBusca = 'tudo' | 'musicas' | 'artistas' | 'generos';

export default function GenerosScreen({
  token,
  player,
  onAdicionarPlaylist,
  onOptionsPress,
  onVoltar,
  initialGenero,
  initialSubgenero,
  initialArtista,
}: GenerosScreenProps) {
  const [generos, setGeneros] = useState<PastaGeneroItem[]>([]);
  const [artistas, setArtistas] = useState<ArtistaItem[]>([]);
  const [catalogo, setCatalogo] = useState<Record<string, string[]>>({});
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Busca em tempo real
  const [busca, setBusca] = useState(initialArtista || '');
  const [filtroBusca, setFiltroBusca] = useState<FiltroBusca>('tudo');
  const [resultadosMusicas, setResultadosMusicas] = useState<ItemMusica[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);

  // Visualização de Gênero ou Artista selecionado
  const [generoSelecionado, setGeneroSelecionado] = useState<PastaGeneroItem | null>(null);
  const [artistaSelecionado, setArtistaSelecionado] = useState<string | null>(null);
  const [subgeneroSelecionado, setSubgeneroSelecionado] = useState<string | null>(initialSubgenero || null);
  const [musicasDetalhe, setMusicasDetalhe] = useState<ItemMusica[]>([]);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  // Carrega lista inicial de gêneros e artistas disponíveis
  const carregarDadosIniciais = useCallback(async () => {
    try {
      setCarregando(true);
      const [pastas, cats, arts] = await Promise.all([
        obterPastasGeneros(token).catch(() => []),
        obterCatalogoGeneros(token).catch(() => ({})),
        obterArtistas(token).catch(() => []),
      ]);
      const pastasValidas = (pastas || []).filter((p: PastaGeneroItem) => (p.total_musicas || 0) > 0);
      const artistasValidos = (arts || []).filter((a: ArtistaItem) => (a.total_musicas || 0) > 0);

      setGeneros(pastasValidas);
      setCatalogo(cats || {});
      setArtistas(artistasValidos);
    } catch (e) {
      console.warn('Erro ao carregar dados de busca:', e);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  // Se veio com inicializador de Artista ou Gênero
  useEffect(() => {
    if (initialArtista) {
      handleSelectArtista(initialArtista);
    } else if (initialGenero && generos.length > 0) {
      const found = generos.find((g) => g.genero.toLowerCase() === initialGenero.toLowerCase());
      if (found) {
        handleSelectGenero(found, initialSubgenero);
      }
    }
  }, [initialArtista, initialGenero, generos]);

  // Busca em tempo real quando o usuário digita
  useEffect(() => {
    if (!busca.trim()) {
      setResultadosMusicas([]);
      setCarregandoBusca(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCarregandoBusca(true);
        const res = await listarMusicas({ q: busca.trim(), limit: 40 }, token);
        setResultadosMusicas(res.data || []);
      } catch (e) {
        console.warn('Erro ao buscar músicas:', e);
      } finally {
        setCarregandoBusca(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [busca, token]);

  const handleSelectGenero = async (item: PastaGeneroItem, sub?: string | null) => {
    setGeneroSelecionado(item);
    setArtistaSelecionado(null);
    setSubgeneroSelecionado(sub || null);
    try {
      setCarregandoDetalhe(true);
      const res = await listarMusicas(
        { genero: item.genero, subgenero: sub || undefined, limit: 100 },
        token
      );
      setMusicasDetalhe(res.data || []);
      player.setQueue(res.data || []);
    } catch (e) {
      console.warn('Erro ao carregar faixas do gênero:', e);
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  const handleSelectArtista = async (nomeArtista: string) => {
    setArtistaSelecionado(nomeArtista);
    setGeneroSelecionado(null);
    setSubgeneroSelecionado(null);
    try {
      setCarregandoDetalhe(true);
      const res = await listarMusicas({ artista: nomeArtista, limit: 100 }, token);
      setMusicasDetalhe(res.data || []);
      player.setQueue(res.data || []);
    } catch (e) {
      console.warn('Erro ao carregar faixas do artista:', e);
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  const handleVoltar = () => {
    if (generoSelecionado || artistaSelecionado) {
      setGeneroSelecionado(null);
      setArtistaSelecionado(null);
      setMusicasDetalhe([]);
    } else if (onVoltar) {
      onVoltar();
    }
  };

  const handleToggleFavorita = async (musica: ItemMusica) => {
    if (!musica.id) return;
    try {
      const res = await alternarFavorita(musica.id, token);
      setMusicasDetalhe((prev) =>
        prev.map((m) =>
          m.stream_url === musica.stream_url ? { ...m, favorita: res.favorita } : m
        )
      );
      setResultadosMusicas((prev) =>
        prev.map((m) =>
          m.stream_url === musica.stream_url ? { ...m, favorita: res.favorita } : m
        )
      );
    } catch (e) {
      console.warn('Erro ao alternar favorita:', e);
    }
  };

  // Artistas filtrados pela busca
  const artistasFiltrados = artistas.filter((a) =>
    a.artista.toLowerCase().includes(busca.toLowerCase().trim())
  );

  // Gêneros filtrados pela busca
  const generosFiltrados = generos.filter((g) =>
    g.genero.toLowerCase().includes(busca.toLowerCase().trim())
  );

  // ========================================================
  // VIEW 1: DETALHE DE GÊNERO OU ARTISTA SELECIONADO
  // ========================================================
  if (generoSelecionado || artistaSelecionado) {
    const titulo = generoSelecionado ? generoSelecionado.genero : artistaSelecionado || '';
    const subtitulo = generoSelecionado ? 'Gênero Musical' : 'Artista';
    const foto =
      generoSelecionado?.genero === 'Rock' || artistaSelecionado?.toLowerCase().includes('charlie')
        ? 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80';

    return (
      <View style={styles.container}>
        <View style={styles.detailHeaderBar}>
          <TouchableOpacity style={styles.btnVoltarBar} onPress={handleVoltar} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.btnVoltarTexto}>Voltar à Busca</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.detailBanner}>
            <Image
              source={{ uri: foto }}
              style={[styles.detailBannerImage, artistaSelecionado ? styles.bannerCircular : null]}
            />
            <Text style={styles.detailTypeBadge}>{subtitulo.toUpperCase()}</Text>
            <Text style={styles.detailTitle}>{titulo}</Text>
            <Text style={styles.detailCount}>{musicasDetalhe.length} músicas na biblioteca</Text>

            {musicasDetalhe.length > 0 && (
              <TouchableOpacity
                style={styles.btnTocarTudo}
                onPress={() => {
                  const tocandoDestaLista =
                    player.isPlaying &&
                    musicasDetalhe.some((m) => isSameTrack(player.currentTrack, m));
                  if (tocandoDestaLista) {
                    player.togglePlayPause();
                  } else {
                    player.play(musicasDetalhe[0], musicasDetalhe);
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={
                    player.isPlaying &&
                    musicasDetalhe.some((m) => isSameTrack(player.currentTrack, m))
                      ? 'pause'
                      : 'play'
                  }
                  size={20}
                  color="#000000"
                />
                <Text style={styles.btnTocarTudoTexto}>
                  {player.isPlaying &&
                  musicasDetalhe.some((m) => isSameTrack(player.currentTrack, m))
                    ? 'Pausar'
                    : 'Tocar Tudo'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {carregandoDetalhe ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={SPOTIFY_COLORS.green} />
              <Text style={styles.loadingBoxText}>Carregando músicas...</Text>
            </View>
          ) : (
            musicasDetalhe.map((m, i) => {
              const isSelected = isSameTrack(player.currentTrack, m);
              const isPlaying = player.isPlaying && isSelected;
              return (
                <TrackItem
                  key={m.stream_url || i}
                  musica={m}
                  isPlayingThis={isPlaying}
                  isSelectedThis={isSelected}
                  onPlayPress={() => {
                    if (isSelected) {
                      player.togglePlayPause();
                    } else {
                      player.play(m, musicasDetalhe);
                    }
                  }}
                  onFavoritePress={() => handleToggleFavorita(m)}
                  onAddToPlaylistPress={() => onAdicionarPlaylist && onAdicionarPlaylist(m)}
                  onOptionsPress={() =>
                    onOptionsPress ? onOptionsPress(m) : onAdicionarPlaylist && onAdicionarPlaylist(m)
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
  // VIEW 2: TELA PRINCIPAL DE BUSCA (SPOTIFY SEARCH POWERHOUSE)
  // ========================================================
  const estaBuscando = busca.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Top Bar com Botão Início + Campo de Busca Estilo Spotify */}
      <View style={styles.searchTopBar}>
        <View style={styles.searchTopRow}>
          {onVoltar && (
            <TouchableOpacity style={styles.btnVoltarBar} onPress={onVoltar} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={18} color="#ffffff" />
              <Text style={styles.btnVoltarTexto}>Início</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.searchTitle}>Buscar</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={SPOTIFY_COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="O que você quer ouvir? (Música, artista ou gênero)"
            placeholderTextColor={SPOTIFY_COLORS.textSecondary}
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={SPOTIFY_COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros em Pílulas (Pills) quando estiver buscando */}
        {estaBuscando && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsScroll}
            contentContainerStyle={styles.pillsContainer}
          >
            {(['tudo', 'musicas', 'artistas', 'generos'] as FiltroBusca[]).map((f) => {
              const ativo = filtroBusca === f;
              const labels: Record<FiltroBusca, string> = {
                tudo: 'Tudo',
                musicas: 'Músicas',
                artistas: 'Artistas',
                generos: 'Gêneros',
              };
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.pillBtn, ativo && styles.pillBtnAtivo]}
                  onPress={() => setFiltroBusca(f)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, ativo && styles.pillTextAtivo]}>
                    {labels[f]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregarDadosIniciais();
            }}
            tintColor={SPOTIFY_COLORS.green}
          />
        }
      >
        {/* ======================================================== */}
        {/* SE ESTIVER BUSCANDO: MOSTRA RESULTADOS INSTANTÂNEOS       */}
        {/* ======================================================== */}
        {estaBuscando ? (
          carregandoBusca ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={SPOTIFY_COLORS.green} />
              <Text style={styles.loadingBoxText}>Buscando resultados...</Text>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              {/* Seção Artistas Encontrados */}
              {(filtroBusca === 'tudo' || filtroBusca === 'artistas') &&
                artistasFiltrados.length > 0 && (
                  <View style={styles.resultSection}>
                    <Text style={styles.resultSectionTitle}>Artistas</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {artistasFiltrados.map((a) => (
                        <TouchableOpacity
                          key={a.artista}
                          style={styles.artistResultItem}
                          onPress={() => handleSelectArtista(a.artista)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{
                              uri: a.artista.toLowerCase().includes('charlie')
                                ? 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=80'
                                : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80',
                            }}
                            style={styles.artistResultAvatar}
                          />
                          <Text style={styles.artistResultName} numberOfLines={1}>
                            {a.artista}
                          </Text>
                          <Text style={styles.artistResultCount}>
                            {a.total_musicas} faixas
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

              {/* Seção Gêneros Encontrados */}
              {(filtroBusca === 'tudo' || filtroBusca === 'generos') &&
                generosFiltrados.length > 0 && (
                  <View style={styles.resultSection}>
                    <Text style={styles.resultSectionTitle}>Gêneros</Text>
                    <View style={styles.tilesGridSmall}>
                      {generosFiltrados.map((g) => (
                        <TouchableOpacity
                          key={g.genero}
                          style={[
                            styles.tileSmallCard,
                            { backgroundColor: CORES_TILES[g.genero] || '#282828' },
                          ]}
                          onPress={() => handleSelectGenero(g)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.tileSmallTitle}>{g.genero}</Text>
                          <Text style={styles.tileSmallCount}>{g.total_musicas} músicas</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

              {/* Seção Músicas Encontradas */}
              {(filtroBusca === 'tudo' || filtroBusca === 'musicas') && (
                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>
                    Músicas ({resultadosMusicas.length})
                  </Text>
                  {resultadosMusicas.length === 0 ? (
                    <Text style={styles.emptySearchText}>
                      Nenhuma música encontrada para "{busca}".
                    </Text>
                  ) : (
                    resultadosMusicas.map((m, i) => {
                      const isSelected = isSameTrack(player.currentTrack, m);
                      const isPlaying = player.isPlaying && isSelected;
                      return (
                        <TrackItem
                          key={m.stream_url || i}
                          musica={m}
                          isPlayingThis={isPlaying}
                          isSelectedThis={isSelected}
                          onPlayPress={() => {
                            if (isSelected) {
                              player.togglePlayPause();
                            } else {
                              player.play(m, resultadosMusicas);
                            }
                          }}
                          onFavoritePress={() => handleToggleFavorita(m)}
                          onAddToPlaylistPress={() =>
                            onAdicionarPlaylist && onAdicionarPlaylist(m)
                          }
                          onOptionsPress={() =>
                            onOptionsPress ? onOptionsPress(m) : onAdicionarPlaylist && onAdicionarPlaylist(m)
                          }
                        />
                      );
                    })
                  )}
                </View>
              )}
            </View>
          )
        ) : (
          /* ======================================================== */
          /* SE NÃO ESTIVER BUSCANDO: MOSTRA GÊNEROS & ARTISTAS        */
          /* ======================================================== */
          <>
            <Text style={styles.sectionHeaderTitle}>Navegar por Gêneros</Text>
            {carregando ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={SPOTIFY_COLORS.green} />
                <Text style={styles.loadingBoxText}>Carregando catálogo...</Text>
              </View>
            ) : (
              <>
                {/* Grade de Gêneros Coloridos */}
                <View style={styles.tilesGrid}>
                  {generos.map((item) => {
                    const corTile = CORES_TILES[item.genero] || '#282828';
                    const imgTile = MAPA_IMAGENS[item.genero];

                    return (
                      <TouchableOpacity
                        key={item.genero}
                        style={[styles.tileCard, { backgroundColor: corTile }]}
                        onPress={() => handleSelectGenero(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.tileTitle}>{item.genero}</Text>
                        <Text style={styles.tileCount}>{item.total_musicas} músicas</Text>
                        {imgTile ? (
                          <Image source={{ uri: imgTile }} style={styles.tileImage} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Seção Artistas em Destaque */}
                {artistas.length > 0 && (
                  <View style={{ marginTop: 24 }}>
                    <Text style={styles.sectionHeaderTitle}>Artistas da Biblioteca</Text>
                    <View style={styles.artistsGridSearch}>
                      {artistas.map((a) => (
                        <TouchableOpacity
                          key={a.artista}
                          style={styles.artistSearchCard}
                          onPress={() => handleSelectArtista(a.artista)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{
                              uri: a.artista.toLowerCase().includes('charlie')
                                ? 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=80'
                                : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80',
                            }}
                            style={styles.artistSearchAvatar}
                          />
                          <Text style={styles.artistSearchName} numberOfLines={1}>
                            {a.artista}
                          </Text>
                          <Text style={styles.artistSearchCount}>
                            {a.total_musicas} faixas
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
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
    paddingBottom: 24,
  },
  searchTopBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: SPOTIFY_COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  searchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnVoltarBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  btnVoltarTexto: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  searchTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#000000',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  pillsScroll: {
    marginTop: 10,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  pillBtn: {
    backgroundColor: '#282828',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  pillBtnAtivo: {
    backgroundColor: SPOTIFY_COLORS.green,
  },
  pillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextAtivo: {
    color: '#000000',
    fontWeight: '700',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingBoxText: {
    marginTop: 8,
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 13,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tileCard: {
    width: '48%',
    height: 100,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  tileTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  tileCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  tileImage: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 65,
    height: 65,
    borderRadius: 4,
    transform: [{ rotate: '25deg' }],
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultSection: {
    marginBottom: 20,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
  },
  artistResultItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  artistResultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 6,
    backgroundColor: '#282828',
  },
  artistResultName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  artistResultCount: {
    fontSize: 10,
    color: SPOTIFY_COLORS.green,
    marginTop: 2,
  },
  tilesGridSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tileSmallCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tileSmallTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  tileSmallCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  emptySearchText: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 6,
  },
  artistsGridSearch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  artistSearchCard: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderRadius: 10,
  },
  artistSearchAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    backgroundColor: '#282828',
  },
  artistSearchName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  artistSearchCount: {
    fontSize: 11,
    color: SPOTIFY_COLORS.green,
    marginTop: 2,
  },

  // Banner Detalhe
  detailHeaderBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  detailBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  detailBannerImage: {
    width: 130,
    height: 130,
    borderRadius: 8,
    marginBottom: 14,
  },
  bannerCircular: {
    borderRadius: 65,
  },
  detailTypeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: SPOTIFY_COLORS.green,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  detailCount: {
    fontSize: 13,
    color: SPOTIFY_COLORS.textSecondary,
    marginBottom: 14,
  },
  btnTocarTudo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.green,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  btnTocarTudoTexto: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});
