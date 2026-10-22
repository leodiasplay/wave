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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  obterPerfil,
  listarAmigos,
  adicionarAmigo,
  removerAmigo,
  listarPlaylistsAmigo,
  compartilharPlaylist,
  RespostaPerfil,
  AmigoItem,
} from '../services/socialApi';
import { Playlist, listarPlaylists } from '../services/playlistApi';
import { sincronizarPastaMusicas } from '../services/musicaApi';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

interface PerfilScreenProps {
  token: string | null;
  player: any;
  onLogout: () => void;
}

export default function PerfilScreen({ token, player, onLogout }: PerfilScreenProps) {
  const [perfil, setPerfil] = useState<RespostaPerfil | null>(null);
  const [amigos, setAmigos] = useState<AmigoItem[]>([]);
  const [minhasPlaylists, setMinhasPlaylists] = useState<Playlist[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // Modal Adicionar Amigo
  const [modalAddAmigoVisivel, setModalAddAmigoVisivel] = useState(false);
  const [buscaAmigo, setBuscaAmigo] = useState('');
  const [salvandoAmigo, setSalvandoAmigo] = useState(false);

  // Modal Ver Playlists do Amigo
  const [modalPlaylistsAmigoVisivel, setModalPlaylistsAmigoVisivel] = useState(false);
  const [amigoSelecionado, setAmigoSelecionado] = useState<AmigoItem | null>(null);
  const [playlistsDoAmigo, setPlaylistsDoAmigo] = useState<Playlist[]>([]);
  const [carregandoPlaylistsAmigo, setCarregandoPlaylistsAmigo] = useState(false);

  // Modal Compartilhar Playlist com Amigo
  const [modalCompartilharVisivel, setModalCompartilharVisivel] = useState(false);
  const [playlistSelecionadaId, setPlaylistSelecionadaId] = useState<number | null>(null);
  const [amigoDestinoId, setAmigoDestinoId] = useState<number | null>(null);
  const [msgCompartilhar, setMsgCompartilhar] = useState('');
  const [salvandoCompartilhar, setSalvandoCompartilhar] = useState(false);

  const carregarTudo = useCallback(async () => {
    try {
      setCarregando(true);
      const [perf, amg, pls] = await Promise.all([
        obterPerfil(token).catch(() => null),
        listarAmigos(token).catch(() => []),
        listarPlaylists(token).catch(() => []),
      ]);
      setPerfil(perf);
      setAmigos(amg);
      setMinhasPlaylists(pls);
    } catch (e) {
      console.warn('Erro ao carregar dados do perfil:', e);
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  const handleAdicionarAmigo = async () => {
    if (!buscaAmigo.trim()) {
      Alert.alert('Aviso', 'Digite o nome de usuário ou e-mail do amigo.');
      return;
    }
    try {
      setSalvandoAmigo(true);
      const res = await adicionarAmigo(buscaAmigo.trim(), token);
      Alert.alert('Sucesso', res.message || 'Amigo adicionado!');
      setModalAddAmigoVisivel(false);
      setBuscaAmigo('');
      carregarTudo();
    } catch (e: any) {
      Alert.alert('Erro ao Adicionar', e?.message || 'Usuário não encontrado.');
    } finally {
      setSalvandoAmigo(false);
    }
  };

  const handleRemoverAmigo = (amg: AmigoItem) => {
    Alert.alert(
      'Remover Amigo',
      `Deseja desfazer a amizade com ${amg.name} (@${amg.username})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerAmigo(amg.amizade_id, token);
              setAmigos((prev) => prev.filter((a) => a.amizade_id !== amg.amizade_id));
            } catch (e: any) {
              Alert.alert('Erro', e?.message || 'Falha ao remover amigo.');
            }
          },
        },
      ]
    );
  };

  const verPlaylistsAmigo = async (amg: AmigoItem) => {
    setAmigoSelecionado(amg);
    setModalPlaylistsAmigoVisivel(true);
    try {
      setCarregandoPlaylistsAmigo(true);
      const lista = await listarPlaylistsAmigo(amg.id, token);
      setPlaylistsDoAmigo(lista);
    } catch (e) {
      console.warn('Erro ao buscar playlists do amigo:', e);
    } finally {
      setCarregandoPlaylistsAmigo(false);
    }
  };

  const abrirCompartilharComAmigo = (amg: AmigoItem) => {
    setAmigoDestinoId(amg.id);
    setPlaylistSelecionadaId(minhasPlaylists.length > 0 ? minhasPlaylists[0].id : null);
    setMsgCompartilhar('Dá uma olhada nessa playlist!');
    setModalCompartilharVisivel(true);
  };

  const handleConfirmarCompartilhamento = async () => {
    if (!playlistSelecionadaId || !amigoDestinoId) {
      Alert.alert('Aviso', 'Selecione uma playlist para enviar.');
      return;
    }
    try {
      setSalvandoCompartilhar(true);
      await compartilharPlaylist(
        playlistSelecionadaId,
        amigoDestinoId,
        msgCompartilhar.trim() || undefined,
        token
      );
      setModalCompartilharVisivel(false);
      Alert.alert('Sucesso', 'Playlist compartilhada com seu amigo!');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao compartilhar.');
    } finally {
      setSalvandoCompartilhar(false);
    }
  };

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      const res = await sincronizarPastaMusicas(token);
      Alert.alert('Sincronização Concluída', `Foram importadas ${res.quantidade_importadas || 0} faixas!`);
      carregarTudo();
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao sincronizar.');
    } finally {
      setSincronizando(false);
    }
  };

  if (carregando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  const u = perfil?.user;
  const s = perfil?.estatisticas;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.mainHeader}>
        <View>
          <Text style={styles.appTitle}>Meu Perfil</Text>
          <Text style={styles.appSubtitle}>Conexões e Compartilhamento</Text>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 4 }} />
          <Text style={styles.btnLogoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregarTudo(); }} tintColor="#38bdf8" />}
      >
        {/* Cartão de Perfil do Usuário */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Ionicons name="person" size={38} color="#ffffff" />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{u?.name || 'Usuário'}</Text>
            <Text style={styles.userUsername}>@{u?.username || 'usuario'}</Text>
            <Text style={styles.userEmail}>{u?.email || 'email@exemplo.com'}</Text>
          </View>
        </View>

        {/* Estatísticas do Usuário */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{s?.total_playlists ?? 0}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{s?.total_favoritas ?? 0}</Text>
            <Text style={styles.statLabel}>Favoritas</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{amigos.length}</Text>
            <Text style={styles.statLabel}>Amigos</Text>
          </View>
        </View>

        {/* SEÇÃO: AMIGOS & CONEXÕES */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Amigos ({amigos.length})</Text>
            <Text style={styles.sectionSubtitle}>Compartilhe playlists e descubra músicas novas</Text>
          </View>

          <TouchableOpacity style={styles.btnAddAmigo} onPress={() => setModalAddAmigoVisivel(true)}>
            <Ionicons name="person-add" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.btnAddAmigoText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {amigos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={44} color="#475569" />
            <Text style={styles.emptyTitle}>Nenhum amigo adicionado</Text>
            <Text style={styles.emptySubtitle}>
              Adicione amigos digitando o nome de usuário ou e-mail para compartilhar playlists com eles!
            </Text>
            <TouchableOpacity style={styles.btnAddAmigoEmpty} onPress={() => setModalAddAmigoVisivel(true)}>
              <Ionicons name="person-add" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.btnAddAmigoEmptyText}>Adicionar Primeiro Amigo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.amigosContainer}>
            {amigos.map((amg) => (
              <View key={`amg-${amg.amizade_id}`} style={styles.amigoCard}>
                <View style={styles.amigoAvatar}>
                  <Ionicons name="person" size={20} color="#38bdf8" />
                </View>

                <View style={styles.amigoInfo}>
                  <Text style={styles.amigoNome}>{amg.name}</Text>
                  <Text style={styles.amigoUser}>@{amg.username}</Text>
                  {amg.desde && <Text style={styles.amigoDesde}>Amigos desde {amg.desde}</Text>}
                </View>

                <View style={styles.amigoActions}>
                  {/* Botão Ver Playlists do Amigo */}
                  <TouchableOpacity
                    style={styles.btnAmigoAction}
                    onPress={() => verPlaylistsAmigo(amg)}
                  >
                    <Ionicons name="albums-outline" size={18} color="#38bdf8" />
                  </TouchableOpacity>

                  {/* Botão Compartilhar Playlist com esse Amigo */}
                  <TouchableOpacity
                    style={styles.btnAmigoAction}
                    onPress={() => abrirCompartilharComAmigo(amg)}
                  >
                    <Ionicons name="share-social-outline" size={18} color="#a855f7" />
                  </TouchableOpacity>

                  {/* Botão Remover Amigo */}
                  <TouchableOpacity
                    style={styles.btnAmigoAction}
                    onPress={() => handleRemoverAmigo(amg)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* FERRAMENTAS DO SISTEMA */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Configurações</Text>
        <TouchableOpacity style={styles.actionBtnRow} onPress={handleSincronizar} disabled={sincronizando}>
          <View style={styles.actionBtnIcon}>
            {sincronizando ? (
              <ActivityIndicator size="small" color="#38bdf8" />
            ) : (
              <Ionicons name="sync" size={20} color="#38bdf8" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionBtnTitle}>Sincronizar Pastas do Disco & Google Drive</Text>
            <Text style={styles.actionBtnSub}>Verifica novos arquivos MP3 e sincroniza metadados</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL ADICIONAR AMIGO */}
      <Modal visible={modalAddAmigoVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Amigo</Text>
              <TouchableOpacity onPress={() => setModalAddAmigoVisivel(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Usuário ou E-mail do amigo:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: leo, bob@exemplo.com..."
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              value={buscaAmigo}
              onChangeText={setBuscaAmigo}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setModalAddAmigoVisivel(false)}
              >
                <Text style={styles.btnModalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnModalConfirm}
                onPress={handleAdicionarAmigo}
                disabled={salvandoAmigo}
              >
                {salvandoAmigo ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnModalConfirmText}>Adicionar Amigo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL PLAYLISTS DO AMIGO */}
      <Modal visible={modalPlaylistsAmigoVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Playlists de {amigoSelecionado?.name}</Text>
                <Text style={{ color: '#38bdf8', fontSize: 12 }}>@{amigoSelecionado?.username}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalPlaylistsAmigoVisivel(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {carregandoPlaylistsAmigo ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#38bdf8" />
              </View>
            ) : playlistsDoAmigo.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Ionicons name="disc-outline" size={36} color="#64748b" />
                <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                  Este amigo ainda não tornou nenhuma playlist pública.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 8 }}>
                {playlistsDoAmigo.map((pl) => (
                  <View key={`amg-pl-${pl.id}`} style={styles.friendPlCard}>
                    <View style={styles.friendPlAvatar}>
                      <Ionicons name="musical-notes" size={20} color="#38bdf8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.friendPlTitle}>{pl.nome}</Text>
                      {pl.descricao ? <Text style={styles.friendPlDesc}>{pl.descricao}</Text> : null}
                      <Text style={styles.friendPlMeta}>{pl.total_musicas} músicas</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL COMPARTILHAR PLAYLIST */}
      <Modal visible={modalCompartilharVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compartilhar com Amigo</Text>
              <TouchableOpacity onPress={() => setModalCompartilharVisivel(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Escolha qual playlist deseja enviar:</Text>
            <ScrollView style={{ maxHeight: 150, marginBottom: 12 }}>
              {minhasPlaylists.map((pl) => {
                const isSel = playlistSelecionadaId === pl.id;
                return (
                  <TouchableOpacity
                    key={`opt-pl-${pl.id}`}
                    style={[styles.plOption, isSel && styles.plOptionActive]}
                    onPress={() => setPlaylistSelecionadaId(pl.id)}
                  >
                    <Ionicons name="disc" size={20} color={isSel ? '#38bdf8' : '#64748b'} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.plOptionTitle, isSel && styles.plOptionTitleActive]}>
                        {pl.nome}
                      </Text>
                      <Text style={styles.plOptionMeta}>{pl.total_musicas} músicas</Text>
                    </View>
                    {isSel && <Ionicons name="checkmark-circle" size={20} color="#38bdf8" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>Mensagem (opcional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Escuta essa seleção top!"
              placeholderTextColor="#64748b"
              value={msgCompartilhar}
              onChangeText={setMsgCompartilhar}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.btnModalCancel}
                onPress={() => setModalCompartilharVisivel(false)}
              >
                <Text style={styles.btnModalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnModalConfirm}
                onPress={handleConfirmarCompartilhamento}
                disabled={salvandoCompartilhar}
              >
                {salvandoCompartilhar ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnModalConfirmText}>Enviar</Text>
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
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SPOTIFY_RADIUS.pill,
  },
  btnLogoutText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.cardLarge,
    padding: 16,
    marginBottom: 14,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: SPOTIFY_COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  userUsername: {
    color: SPOTIFY_COLORS.green,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  userEmail: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.card,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: SPOTIFY_COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: SPOTIFY_COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  btnAddAmigo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.green,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SPOTIFY_RADIUS.pill,
  },
  btnAddAmigoText: {
    color: '#000000',
    fontSize: 12.5,
    fontWeight: '700',
  },
  amigosContainer: {
    gap: 8,
  },
  amigoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.card,
    padding: 12,
  },
  amigoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  amigoInfo: {
    flex: 1,
  },
  amigoNome: {
    color: SPOTIFY_COLORS.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  amigoUser: {
    color: SPOTIFY_COLORS.green,
    fontSize: 12,
    fontWeight: '600',
  },
  amigoDesde: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 10.5,
    marginTop: 2,
  },
  amigoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnAmigoAction: {
    padding: 7,
    borderRadius: SPOTIFY_RADIUS.pill,
    backgroundColor: SPOTIFY_COLORS.surface,
  },
  emptyBox: {
    padding: 30,
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
  emptySubtitle: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12.5,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  btnAddAmigoEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.green,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: SPOTIFY_RADIUS.pill,
    marginTop: 14,
  },
  btnAddAmigoEmptyText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.cardLarge,
    padding: 14,
    gap: 12,
  },
  actionBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SPOTIFY_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTitle: {
    color: SPOTIFY_COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnSub: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
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
  friendPlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  friendPlAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  friendPlTitle: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  friendPlDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  friendPlMeta: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  plOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  plOptionActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#111e38',
  },
  plOptionTitle: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  plOptionTitleActive: {
    color: '#38bdf8',
  },
  plOptionMeta: {
    color: '#94a3b8',
    fontSize: 11,
  },
});
