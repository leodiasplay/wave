import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Playlist,
  listarPlaylists,
  obterPlaylist,
  criarPlaylist,
  excluirPlaylist,
  removerMusicaPlaylist,
} from '../services/playlistApi';
import {
  listarAmigos,
  compartilharPlaylist,
  listarPlaylistsCompartilhadas,
  AmigoItem,
  PlaylistCompartilhadaItem,
} from '../services/socialApi';
import { ItemMusica, alternarFavorita, isSameTrack } from '../services/musicaApi';
import TrackItem from '../components/TrackItem';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

interface MinhasPlaylistsScreenProps {
  token: string | null;
  player: any;
}

function getInitialAba(): 'minhas' | 'compartilhadas' {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const p = new URLSearchParams(window.location.search).get('aba');
    if (p === 'compartilhadas') return 'compartilhadas';
  }
  return 'minhas';
}

export default function MinhasPlaylistsScreen({ token, player }: MinhasPlaylistsScreenProps) {
  const [abaAtiva, setAbaAtiva] = useState<'minhas' | 'compartilhadas'>(getInitialAba);
  const [minhasPlaylists, setMinhasPlaylists] = useState<Playlist[]>([]);
  const [compartilhadas, setCompartilhadas] = useState<PlaylistCompartilhadaItem[]>([]);
  const [amigos, setAmigos] = useState<AmigoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal Criar Playlist
  const [modalCriarVisivel, setModalCriarVisivel] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaPublica, setNovaPublica] = useState(true);
  const [salvandoCriacao, setSalvandoCriacao] = useState(false);

  // Playlist aberta
  const [playlistAberta, setPlaylistAberta] = useState<Playlist | null>(null);
  const [carregandoPlaylist, setCarregandoPlaylist] = useState(false);

  // Modal Compartilhar Playlist
  const [modalCompartilharVisivel, setModalCompartilharVisivel] = useState(false);
  const [playlistParaCompartilhar, setPlaylistParaCompartilhar] = useState<Playlist | null>(null);
  const [amigoSelecionadoId, setAmigoSelecionadoId] = useState<number | null>(null);
  const [mensagemCompartilhar, setMensagemCompartilhar] = useState('');
  const [salvandoCompartilhamento, setSalvandoCompartilhamento] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const [pls, comps, amg] = await Promise.all([
        listarPlaylists(token).catch(() => []),
        listarPlaylistsCompartilhadas(token).catch(() => []),
        listarAmigos(token).catch(() => []),
      ]);
      setMinhasPlaylists(pls);
      setCompartilhadas(comps);
      setAmigos(amg.filter((a) => a.status === 'aceito'));
    } catch (e) {
      console.warn('Erro ao carregar playlists:', e);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const abrirPlaylist = async (id: number) => {
    try {
      setCarregandoPlaylist(true);
      const pl = await obterPlaylist(id, token);
      setPlaylistAberta(pl);
    } catch (e) {
      console.warn('Erro ao abrir playlist:', e);
      Alert.alert('Erro', 'Não foi possível carregar as faixas desta playlist.');
    } finally {
      setCarregandoPlaylist(false);
    }
  };

  const tocarTodaPlaylist = () => {
    if (!playlistAberta?.musicas || playlistAberta.musicas.length === 0) return;
    player.play(playlistAberta.musicas[0], playlistAberta.musicas);
  };

  const handleCriarPlaylist = async () => {
    if (!novoNome.trim()) {
      Alert.alert('Aviso', 'Informe o nome da playlist.');
      return;
    }
    try {
      setSalvandoCriacao(true);
      const nova = await criarPlaylist(
        {
          nome: novoNome.trim(),
          descricao: novaDescricao.trim() || undefined,
          publica: novaPublica,
        },
        token
      );
      setMinhasPlaylists((prev) => [nova, ...prev]);
      setModalCriarVisivel(false);
      setNovoNome('');
      setNovaDescricao('');
      Alert.alert('Sucesso', `Playlist "${nova.nome}" criada com sucesso!`);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao criar playlist.');
    } finally {
      setSalvandoCriacao(false);
    }
  };

  const handleExcluirPlaylist = (pl: Playlist) => {
    Alert.alert(
      'Excluir Playlist',
      `Tem certeza que deseja apagar a playlist "${pl.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await excluirPlaylist(pl.id, token);
              setMinhasPlaylists((prev) => prev.filter((p) => p.id !== pl.id));
              if (playlistAberta?.id === pl.id) {
                setPlaylistAberta(null);
              }
            } catch (e: any) {
              Alert.alert('Erro', e?.message || 'Falha ao excluir playlist.');
            }
          },
        },
      ]
    );
  };

  const handleRemoverMusica = async (musicaId: number) => {
    if (!playlistAberta) return;
    try {
      await removerMusicaPlaylist(playlistAberta.id, musicaId, token);
      setPlaylistAberta((prev) =>
        prev
          ? {
              ...prev,
              musicas: prev.musicas?.filter((m) => m.id !== musicaId),
              total_musicas: Math.max(0, prev.total_musicas - 1),
            }
          : null
      );
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao remover música da playlist.');
    }
  };

  const abrirModalCompartilhar = (pl: Playlist) => {
    setPlaylistParaCompartilhar(pl);
    setAmigoSelecionadoId(amigos.length > 0 ? amigos[0].id : null);
    setMensagemCompartilhar('Confira esta playlist que montei!');
    setModalCompartilharVisivel(true);
  };

  const handleConfirmarCompartilhamento = async () => {
    if (!playlistParaCompartilhar || !amigoSelecionadoId) {
      Alert.alert('Aviso', 'Selecione um amigo para compartilhar.');
      return;
    }
    try {
      setSalvandoCompartilhamento(true);
      await compartilharPlaylist(
        playlistParaCompartilhar.id,
        amigoSelecionadoId,
        mensagemCompartilhar.trim() || undefined,
        token
      );
      setModalCompartilharVisivel(false);
      Alert.alert('Sucesso', 'Playlist compartilhada com seu amigo!');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao compartilhar playlist.');
    } finally {
      setSalvandoCompartilhamento(false);
    }
  };

  const handleFavoritar = async (musica: ItemMusica) => {
    if (!musica.id) return;
    try {
      const res = await alternarFavorita(musica.id, token);
      if (playlistAberta?.musicas) {
        setPlaylistAberta({
          ...playlistAberta,
          musicas: playlistAberta.musicas.map((m) =>
            m.id === musica.id ? { ...m, favorita: res.favorita } : m
          ),
        });
      }
    } catch (e) {
      console.warn('Erro ao favoritar música:', e);
    }
  };

  if (carregando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Carregando playlists...</Text>
      </View>
    );
  }

  // --- DETALHE DA PLAYLIST ABERTA ---
  if (playlistAberta) {
    const total = playlistAberta.musicas?.length || 0;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setPlaylistAberta(null)}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerMainTitle}>{playlistAberta.nome}</Text>
            <Text style={styles.headerSubTitle}>
              {playlistAberta.publica ? 'Pública' : 'Privada'} • {total} {total === 1 ? 'faixa' : 'faixas'}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtnHeader} onPress={() => abrirModalCompartilhar(playlistAberta)}>
            <Ionicons name="share-social" size={20} color="#38bdf8" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Banner da Playlist */}
          <View style={styles.plHeroCard}>
            <View style={styles.plHeroAvatar}>
              <Ionicons name="musical-notes" size={36} color="#ffffff" />
            </View>
            <View style={styles.plHeroInfo}>
              <Text style={styles.plHeroTitle}>{playlistAberta.nome}</Text>
              {playlistAberta.descricao ? (
                <Text style={styles.plHeroDesc}>{playlistAberta.descricao}</Text>
              ) : null}
              <Text style={styles.plHeroMeta}>Total de {total} músicas</Text>
            </View>
          </View>

          {/* Botões de Ação da Playlist */}
          <View style={styles.plActionsRow}>
            <TouchableOpacity
              style={[styles.btnPlayAll, total === 0 && styles.btnDisabled]}
              onPress={() => {
                if (playlistAberta?.musicas && playlistAberta.musicas.length > 0) {
                  const tocandoEstaPl =
                    player.isPlaying &&
                    playlistAberta.musicas.some((m) => isSameTrack(player.currentTrack, m));
                  if (tocandoEstaPl) {
                    player.togglePlayPause();
                  } else {
                    player.play(playlistAberta.musicas[0], playlistAberta.musicas);
                  }
                }
              }}
              disabled={total === 0}
            >
              <Ionicons
                name={
                  player.isPlaying &&
                  playlistAberta?.musicas?.some((m) => isSameTrack(player.currentTrack, m))
                    ? 'pause'
                    : 'play'
                }
                size={18}
                color="#ffffff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.btnPlayAllText}>
                {player.isPlaying &&
                playlistAberta?.musicas?.some((m) => isSameTrack(player.currentTrack, m))
                  ? 'Pausar'
                  : 'Tocar Playlist'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSharePl}
              onPress={() => abrirModalCompartilhar(playlistAberta)}
            >
              <Ionicons name="share-social-outline" size={18} color="#38bdf8" style={{ marginRight: 6 }} />
              <Text style={styles.btnSharePlText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Faixas na Playlist:</Text>

          {carregandoPlaylist ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#38bdf8" />
              <Text style={styles.loadingBoxText}>Carregando faixas da playlist...</Text>
            </View>
          ) : !playlistAberta.musicas || playlistAberta.musicas.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="musical-notes-outline" size={42} color="#475569" />
              <Text style={styles.emptyTitle}>Playlist vazia</Text>
              <Text style={styles.emptySubtitle}>
                Vá até as abas Gêneros ou Artistas e clique no ícone de lista para adicionar músicas.
              </Text>
            </View>
          ) : (
            playlistAberta.musicas.map((m) => {
              const isSelectedThis = isSameTrack(player.currentTrack, m);
              const isPlayingThis = player.isPlaying && isSelectedThis;

              return (
                <View key={`pl-m-${m.id || m.caminho_arquivo}`} style={styles.trackRowWithDelete}>
                  <View style={{ flex: 1 }}>
                    <TrackItem
                      musica={m}
                      isPlayingThis={isPlayingThis}
                      isSelectedThis={isSelectedThis}
                      onPlayPress={() => {
                        if (isSelectedThis) {
                          player.togglePlayPause();
                        } else {
                          player.play(m, playlistAberta?.musicas || [m]);
                        }
                      }}
                      onFavoritePress={() => handleFavoritar(m)}
                    />
                  </View>
                  {m.id && (
                    <TouchableOpacity
                      style={styles.btnRemoverDaPl}
                      onPress={() => handleRemoverMusica(m.id!)}
                    >
                      <Ionicons name="remove-circle-outline" size={22} color="#f43f5e" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // --- LISTAGEM GERAL DE PLAYLISTS ---
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.mainHeader}>
        <View>
          <Text style={styles.appTitle}>Sua Biblioteca</Text>
          <Text style={styles.appSubtitle}>Playlists salvas e coleções compartilhadas</Text>
        </View>

        <TouchableOpacity style={styles.btnNovaPlaylist} onPress={() => setModalCriarVisivel(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Abas em Pílula Estilo Spotify: Criadas por Mim | Compartilhadas Comigo */}
      <View style={styles.tabNavRow}>
        <TouchableOpacity
          style={[styles.tabNavBtn, abaAtiva === 'minhas' && styles.tabNavBtnActive]}
          onPress={() => setAbaAtiva('minhas')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabNavText, abaAtiva === 'minhas' && styles.tabNavTextActive]}>
            Playlists ({minhasPlaylists.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavBtn, abaAtiva === 'compartilhadas' && styles.tabNavBtnActive]}
          onPress={() => setAbaAtiva('compartilhadas')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabNavText, abaAtiva === 'compartilhadas' && styles.tabNavTextActive]}>
            Compartilhadas ({compartilhadas.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo da Aba */}
      <ScrollView
        contentContainerStyle={styles.playlistsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregarDados(); }} tintColor="#38bdf8" />}
      >
        {abaAtiva === 'minhas' ? (
          minhasPlaylists.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="disc-outline" size={48} color="#475569" />
              <Text style={styles.emptyTitle}>Nenhuma playlist criada</Text>
              <Text style={styles.emptySubtitle}>
                Crie sua primeira playlist para organizar suas músicas favoritas!
              </Text>
              <TouchableOpacity style={styles.btnEmptyCreate} onPress={() => setModalCriarVisivel(true)}>
                <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.btnEmptyCreateText}>Criar Playlist</Text>
              </TouchableOpacity>
            </View>
          ) : (
            minhasPlaylists.map((pl) => (
              <View key={`minha-pl-${pl.id}`} style={styles.plCard}>
                <TouchableOpacity
                  style={styles.plCardMain}
                  onPress={() => abrirPlaylist(pl.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.plCardCover}>
                    <Ionicons name="musical-notes" size={24} color="#38bdf8" />
                  </View>

                  <View style={styles.plCardInfo}>
                    <Text style={styles.plCardName} numberOfLines={1}>{pl.nome}</Text>
                    {pl.descricao ? (
                      <Text style={styles.plCardDesc} numberOfLines={1}>{pl.descricao}</Text>
                    ) : null}
                    <View style={styles.plCardMetaRow}>
                      <View style={styles.badgePublica}>
                        <Text style={styles.badgePublicaText}>{pl.publica ? 'Pública' : 'Privada'}</Text>
                      </View>
                      <Text style={styles.plCardMeta}>{pl.total_musicas} faixas</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.plCardActions}>
                  <TouchableOpacity
                    style={styles.plCardIconBtn}
                    onPress={() => abrirModalCompartilhar(pl)}
                  >
                    <Ionicons name="share-social-outline" size={20} color="#38bdf8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.plCardIconBtn}
                    onPress={() => handleExcluirPlaylist(pl)}
                  >
                    <Ionicons name="trash-outline" size={19} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          compartilhadas.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color="#475569" />
              <Text style={styles.emptyTitle}>Nenhuma playlist recebida</Text>
              <Text style={styles.emptySubtitle}>
                Adicione amigos na aba Perfil para compartilhar e receber playlists com eles!
              </Text>
            </View>
          ) : (
            compartilhadas.map((c) => (
              <TouchableOpacity
                key={`comp-pl-${c.compartilhamento_id}`}
                style={styles.plCard}
                onPress={() => abrirPlaylist(c.id)}
                activeOpacity={0.7}
              >
                <View style={styles.plCardMain}>
                  <View style={[styles.plCardCover, { borderColor: '#a855f7' }]}>
                    <Ionicons name="gift-outline" size={24} color="#a855f7" />
                  </View>

                  <View style={styles.plCardInfo}>
                    <Text style={styles.plCardName} numberOfLines={1}>{c.nome}</Text>
                    <Text style={styles.plCompartilhadaPor}>
                      Enviada por <Text style={{ color: '#38bdf8', fontWeight: '700' }}>{c.compartilhado_por}</Text>
                    </Text>
                    {c.mensagem ? (
                      <Text style={styles.plMsgNota} numberOfLines={1}>"{c.mensagem}"</Text>
                    ) : null}
                    <Text style={styles.plCardMeta}>{c.total_musicas} faixas • {c.data}</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#64748b" style={{ marginRight: 8 }} />
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>

      {/* MODAL CRIAR PLAYLIST */}
      <Modal visible={modalCriarVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Criar Nova Playlist</Text>
              <TouchableOpacity onPress={() => setModalCriarVisivel(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nome da Playlist:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Treino Pesado, Techno Night..."
              placeholderTextColor="#64748b"
              value={novoNome}
              onChangeText={setNovoNome}
            />

            <Text style={styles.inputLabel}>Descrição (opcional):</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Descreva o estilo ou proposta dessa playlist..."
              placeholderTextColor="#64748b"
              multiline
              value={novaDescricao}
              onChangeText={setNovaDescricao}
            />

            <TouchableOpacity
              style={styles.publicaToggleRow}
              onPress={() => setNovaPublica(!novaPublica)}
            >
              <Ionicons
                name={novaPublica ? 'checkbox' : 'square-outline'}
                size={22}
                color={novaPublica ? '#38bdf8' : '#64748b'}
              />
              <Text style={styles.publicaToggleText}>
                Tornar playlist pública para amigos
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setModalCriarVisivel(false)}
              >
                <Text style={styles.btnModalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnModalConfirm}
                onPress={handleCriarPlaylist}
                disabled={salvandoCriacao}
              >
                {salvandoCriacao ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnModalConfirmText}>Criar Playlist</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL COMPARTILHAR PLAYLIST COM AMIGO */}
      <Modal visible={modalCompartilharVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compartilhar Playlist</Text>
              <TouchableOpacity onPress={() => setModalCompartilharVisivel(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.shareSubInfo}>
              Playlist selecionada: <Text style={{ color: '#ffffff', fontWeight: '700' }}>{playlistParaCompartilhar?.nome}</Text>
            </Text>

            <Text style={styles.inputLabel}>Selecione o Amigo:</Text>

            {amigos.length === 0 ? (
              <View style={styles.noFriendsBox}>
                <Ionicons name="people-outline" size={32} color="#64748b" />
                <Text style={styles.noFriendsText}>Você ainda não possui amigos adicionados.</Text>
                <Text style={styles.noFriendsSub}>Vá para a aba Perfil para adicionar amigos!</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 150, marginBottom: 12 }}>
                {amigos.map((amg) => {
                  const isSel = amigoSelecionadoId === amg.id;
                  return (
                    <TouchableOpacity
                      key={`amg-opt-${amg.id}`}
                      style={[styles.friendOption, isSel && styles.friendOptionActive]}
                      onPress={() => setAmigoSelecionadoId(amg.id)}
                    >
                      <Ionicons
                        name="person-circle"
                        size={28}
                        color={isSel ? '#38bdf8' : '#64748b'}
                      />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[styles.friendOptionName, isSel && styles.friendOptionNameActive]}>
                          {amg.name}
                        </Text>
                        <Text style={styles.friendOptionUser}>@{amg.username}</Text>
                      </View>
                      {isSel && <Ionicons name="checkmark-circle" size={20} color="#38bdf8" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <Text style={styles.inputLabel}>Mensagem para o amigo:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Escuta essa faixa que separei pra ti!"
              placeholderTextColor="#64748b"
              value={mensagemCompartilhar}
              onChangeText={setMensagemCompartilhar}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setModalCompartilharVisivel(false)}
              >
                <Text style={styles.btnModalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnModalConfirm, amigos.length === 0 && styles.btnDisabled]}
                onPress={handleConfirmarCompartilhamento}
                disabled={salvandoCompartilhamento || amigos.length === 0}
              >
                {salvandoCompartilhamento ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnModalConfirmText}>Enviar Playlist</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  btnNovaPlaylist: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNovaPlaylistText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tabNavRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabNavBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: SPOTIFY_RADIUS.pill,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
  },
  tabNavBtnActive: {
    backgroundColor: SPOTIFY_COLORS.green,
  },
  tabNavText: {
    color: SPOTIFY_COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  tabNavTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  playlistsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 12,
  },
  plCard: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  plCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  plCardCover: {
    width: 52,
    height: 52,
    borderRadius: SPOTIFY_RADIUS.image,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  plCardInfo: {
    flex: 1,
  },
  plCardName: {
    color: SPOTIFY_COLORS.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  plCardDesc: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  plCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  badgePublica: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgePublicaText: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  plCardMeta: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  plCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plCardIconBtn: {
    padding: 6,
  },
  plCompartilhadaPor: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
  },
  plMsgNota: {
    color: '#e2e8f0',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyBox: {
    padding: 36,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 10,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  btnEmptyCreate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  btnEmptyCreateText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0b1120',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
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
  iconBtnHeader: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  plHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  plHeroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  plHeroInfo: {
    flex: 1,
  },
  plHeroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  plHeroDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  plHeroMeta: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  plActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  btnPlayAll: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPlayAllText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnSharePl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnSharePlText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  sectionLabel: {
    color: '#ffffff',
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
    color: '#94a3b8',
    fontSize: 13,
  },
  trackRowWithDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnRemoverDaPl: {
    padding: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0b1120',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 10,
  },
  publicaToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  publicaToggleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btnModalCancel: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    alignItems: 'center',
  },
  btnModalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  btnModalConfirm: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
  },
  btnModalConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  shareSubInfo: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
  },
  noFriendsBox: {
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  noFriendsText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  noFriendsSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  friendOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  friendOptionActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#111e38',
  },
  friendOptionName: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  friendOptionNameActive: {
    color: '#38bdf8',
  },
  friendOptionUser: {
    color: '#94a3b8',
    fontSize: 11,
  },
});
