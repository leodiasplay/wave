import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { lerToken, salvarToken, apagarToken, api } from './src/services/api';
import { usePlayer } from './src/hooks/usePlayer';
import { ItemMusica } from './src/services/musicaApi';
import { Playlist, listarPlaylists, adicionarMusicaPlaylist } from './src/services/playlistApi';

import HomeScreen from './src/screens/HomeScreen';
import GenerosScreen from './src/screens/GenerosScreen';
import MinhasPlaylistsScreen from './src/screens/MinhasPlaylistsScreen';
import PerfilScreen from './src/screens/PerfilScreen';

import SpotifyMiniPlayer from './src/components/SpotifyMiniPlayer';
import SpotifyBottomNav, { SpotifyTabId } from './src/components/SpotifyBottomNav';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from './src/theme/spotifyTheme';
import ErrorBoundary from './src/components/ErrorBoundary';

function getInitialTab(): SpotifyTabId {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const p = new URLSearchParams(window.location.search).get('tab');
    if (p === 'buscar' || p === 'biblioteca' || p === 'perfil') return p;
    if (p === 'generos' || p === 'artistas') return 'buscar';
    if (p === 'playlists') return 'biblioteca';
  }
  return 'inicio';
}

function MainApp() {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<SpotifyTabId>(getInitialTab);

  // Parâmetros de navegação para a aba Buscar
  const [generoFiltro, setGeneroFiltro] = useState<string | null>(null);
  const [subgeneroFiltro, setSubgeneroFiltro] = useState<string | null>(null);
  const [artistaFiltro, setArtistaFiltro] = useState<string | null>(null);

  // Estado de Autenticação (Login vs Cadastro)
  const [modoAuth, setModoAuth] = useState<'login' | 'cadastro'>('login');
  const [username, setUsername] = useState('leo');
  const [password, setPassword] = useState('123');
  const [cadNome, setCadNome] = useState('');
  const [cadUsuario, setCadUsuario] = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [authCarregando, setAuthCarregando] = useState(false);

  // Modal 3 Pontinhos da Música (Opções Rápidas: Fila, Playlist, etc.)
  const [modalOpcoesVisivel, setModalOpcoesVisivel] = useState(false);
  const [musicaOpcoes, setMusicaOpcoes] = useState<ItemMusica | null>(null);

  // Modal Adicionar Faixa a Playlist
  const [modalAddPlaylistVisivel, setModalAddPlaylistVisivel] = useState(false);
  const [musicaParaAdicionar, setMusicaParaAdicionar] = useState<ItemMusica | null>(null);
  const [playlistsDisponiveis, setPlaylistsDisponiveis] = useState<Playlist[]>([]);
  const [adicionandoPlaylist, setAdicionandoPlaylist] = useState(false);

  const player = usePlayer(token);

  useEffect(() => {
    async function requisitarPermissoes() {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        } catch (e) {
          console.warn('Erro ao solicitar permissão de notificações:', e);
        }
      }
    }
    requisitarPermissoes();
  }, []);

  useEffect(() => {
    async function checarAuth() {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('login') === '1') {
        setCarregandoAuth(false);
        return;
      }
      const t = await lerToken();
      if (t) {
        setToken(t);
        setCarregandoAuth(false);
        return;
      }
      try {
        const res: any = await api('login', {
          method: 'POST',
          body: { login: 'leo', username: 'leo', password: '123' },
        });
        if (res?.token) {
          await salvarToken(res.token);
          setToken(res.token);
        }
      } catch (err) {
        // Fallback para login manual
      } finally {
        setCarregandoAuth(false);
      }
    }
    checarAuth();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Aviso', 'Preencha usuário e senha.');
      return;
    }
    try {
      setAuthCarregando(true);
      const res: any = await api('login', {
        method: 'POST',
        body: { login: username, password },
      });
      if (res?.token) {
        await salvarToken(res.token);
        setToken(res.token);
      }
    } catch (e: any) {
      Alert.alert('Erro ao Entrar', e?.message || 'Falha na autenticação.');
    } finally {
      setAuthCarregando(false);
    }
  };

  const handleCadastro = async () => {
    if (!cadNome.trim() || !cadEmail.trim() || !cadSenha) {
      Alert.alert('Campos Obrigatórios', 'Preencha seu Nome, E-mail e Senha para criar a conta.');
      return;
    }
    if (cadSenha.length < 6) {
      Alert.alert('Senha Curta', 'A senha deve conter no mínimo 6 dígitos.');
      return;
    }
    try {
      setAuthCarregando(true);
      const usernameFinal = cadUsuario.trim() || cadEmail.trim().split('@')[0];
      const res: any = await api('register', {
        method: 'POST',
        body: {
          name: cadNome.trim(),
          username: usernameFinal,
          email: cadEmail.trim(),
          password: cadSenha,
        },
      });

      if (res?.token) {
        await salvarToken(res.token);
        setToken(res.token);
        Alert.alert('Conta criada com sucesso!', `Bem-vindo(a) ao Wave, ${cadNome.trim()}!`);
      } else {
        Alert.alert('Sucesso', 'Conta criada! Você já pode entrar com seu e-mail e senha.');
        setModoAuth('login');
        setUsername(usernameFinal);
      }
    } catch (e: any) {
      Alert.alert('Erro ao Criar Conta', e?.message || 'Falha no cadastro. Verifique se o e-mail já existe.');
    } finally {
      setAuthCarregando(false);
    }
  };

  const handleLogout = async () => {
    player.pause();
    await apagarToken();
    setToken(null);
  };

  const handleNavegarTab = (
    tab: SpotifyTabId,
    params?: { genero?: string; subgenero?: string; artista?: string }
  ) => {
    if (params) {
      if (params.genero) setGeneroFiltro(params.genero);
      if (params.subgenero) setSubgeneroFiltro(params.subgenero);
      if (params.artista) setArtistaFiltro(params.artista);
    }
    setTabAtiva(tab);
  };

  // ==========================================
  // CONTROLE DO MODAL DE 3 PONTINHOS DA MÚSICA
  // ==========================================
  const abrirModalOpcoes = (musica: ItemMusica) => {
    setMusicaOpcoes(musica);
    setModalOpcoesVisivel(true);
  };

  const fecharModalOpcoes = () => {
    setModalOpcoesVisivel(false);
  };

  const handleAcaoTocarAgora = () => {
    if (musicaOpcoes) {
      player.play(musicaOpcoes);
    }
    fecharModalOpcoes();
  };

  const handleAcaoTocarSeguinte = () => {
    if (musicaOpcoes) {
      player.playNextInQueue(musicaOpcoes);
      Alert.alert('Fila de Reprodução', `"${musicaOpcoes.titulo}" foi colocada para tocar a seguir!`);
    }
    fecharModalOpcoes();
  };

  const handleAcaoAdicionarFila = () => {
    if (musicaOpcoes) {
      player.addToQueue(musicaOpcoes);
      Alert.alert('Fila de Reprodução', `"${musicaOpcoes.titulo}" foi adicionada ao final da fila!`);
    }
    fecharModalOpcoes();
  };

  const handleAcaoAdicionarPlaylist = () => {
    const track = musicaOpcoes;
    fecharModalOpcoes();
    if (track) {
      abrirModalAddPlaylist(track);
    }
  };

  // ==========================================
  // CONTROLE DO MODAL ADICIONAR A PLAYLIST
  // ==========================================
  const abrirModalAddPlaylist = async (musica: ItemMusica) => {
    setMusicaParaAdicionar(musica);
    setModalAddPlaylistVisivel(true);
    try {
      const pls = await listarPlaylists(token);
      setPlaylistsDisponiveis(pls);
    } catch (e) {
      console.warn('Erro ao carregar playlists:', e);
    }
  };

  const confirmarAdicionarMusicaPlaylist = async (playlistId: number) => {
    if (!musicaParaAdicionar?.id) {
      Alert.alert('Aviso', 'Esta música precisa estar cadastrada para ser inserida na playlist.');
      return;
    }
    try {
      setAdicionandoPlaylist(true);
      await adicionarMusicaPlaylist(playlistId, musicaParaAdicionar.id, token);
      setModalAddPlaylistVisivel(false);
      Alert.alert('Sucesso', 'Música adicionada à playlist!');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao adicionar música.');
    } finally {
      setAdicionandoPlaylist(false);
    }
  };

  if (carregandoAuth) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={SPOTIFY_COLORS.green} />
      </View>
    );
  }

  // --- TELA DE LOGIN / CADASTRO ESTILO SPOTIFY ---
  if (!token) {
    return (
      <View style={[styles.loginContainer, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <StatusBar barStyle="light-content" backgroundColor={SPOTIFY_COLORS.background} />
        <View style={styles.loginCard}>
          <Image
            source={require('./assets/icon.png')}
            style={styles.loginLogoImage}
            resizeMode="contain"
          />
          <Text style={styles.loginTitle}>Wave</Text>
          <Text style={styles.loginSubtitle}>Sua música na frequência certa</Text>

          {/* Abas Alternar: Entrar | Criar Conta */}
          <View style={styles.authTabRow}>
            <TouchableOpacity
              style={[styles.authTabBtn, modoAuth === 'login' && styles.authTabBtnActive]}
              onPress={() => setModoAuth('login')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.authTabBtnText,
                  modoAuth === 'login' && styles.authTabBtnTextActive,
                ]}
              >
                Entrar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authTabBtn, modoAuth === 'cadastro' && styles.authTabBtnActive]}
              onPress={() => setModoAuth('cadastro')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.authTabBtnText,
                  modoAuth === 'cadastro' && styles.authTabBtnTextActive,
                ]}
              >
                Criar Conta
              </Text>
            </TouchableOpacity>
          </View>

          {modoAuth === 'login' ? (
            /* Formulário de Login */
            <View style={styles.loginForm}>
              <Text style={styles.inputLabel}>Usuário ou E-mail:</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Digite seu usuário ou e-mail..."
                placeholderTextColor={SPOTIFY_COLORS.textSecondary}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />

              <Text style={styles.inputLabel}>Senha:</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Digite sua senha..."
                placeholderTextColor={SPOTIFY_COLORS.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={styles.btnLoginSubmit}
                onPress={handleLogin}
                disabled={authCarregando}
                activeOpacity={0.85}
              >
                {authCarregando ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.btnLoginSubmitText}>Entrar no Wave</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnToggleAuthMode}
                onPress={() => setModoAuth('cadastro')}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleAuthText}>
                  Não tem uma conta? <Text style={styles.toggleAuthTextBold}>Cadastre-se grátis</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Formulário de Cadastro (Criar Nova Conta) */
            <View style={styles.loginForm}>
              <Text style={styles.inputLabel}>Nome Completo:</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Ex: Carlos Silva"
                placeholderTextColor={SPOTIFY_COLORS.textSecondary}
                value={cadNome}
                onChangeText={setCadNome}
              />

              <Text style={styles.inputLabel}>Nome de Usuário (opcional):</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Ex: carlossilva"
                placeholderTextColor={SPOTIFY_COLORS.textSecondary}
                autoCapitalize="none"
                value={cadUsuario}
                onChangeText={setCadUsuario}
              />

              <Text style={styles.inputLabel}>E-mail:</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Ex: carlos@email.com"
                placeholderTextColor={SPOTIFY_COLORS.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={cadEmail}
                onChangeText={setCadEmail}
              />

              <Text style={styles.inputLabel}>Senha (mínimo 6 caracteres):</Text>
              <TextInput
                style={styles.loginInput}
                placeholder="Crie sua senha segura..."
                placeholderTextColor={SPOTIFY_COLORS.textSecondary}
                secureTextEntry
                value={cadSenha}
                onChangeText={setCadSenha}
              />

              <TouchableOpacity
                style={styles.btnLoginSubmit}
                onPress={handleCadastro}
                disabled={authCarregando}
                activeOpacity={0.85}
              >
                {authCarregando ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.btnLoginSubmitText}>Criar Minha Conta no Wave</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnToggleAuthMode}
                onPress={() => setModoAuth('login')}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleAuthText}>
                  Já tem conta no Wave? <Text style={styles.toggleAuthTextBold}>Faça login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  // --- APLICATIVO PRINCIPAL SPOTIFY ---
  return (
    <View style={[styles.appContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={SPOTIFY_COLORS.background} />

      {/* Conteúdo da Tela Ativa */}
      <View style={styles.screenContainer}>
        {tabAtiva === 'inicio' && (
          <HomeScreen
            token={token}
            player={player}
            onNavegarTab={handleNavegarTab}
            onAdicionarPlaylist={abrirModalAddPlaylist}
            onOptionsPress={abrirModalOpcoes}
          />
        )}

        {tabAtiva === 'buscar' && (
          <GenerosScreen
            token={token}
            player={player}
            onAdicionarPlaylist={abrirModalAddPlaylist}
            onOptionsPress={abrirModalOpcoes}
            onVoltar={() => handleNavegarTab('inicio')}
            initialGenero={generoFiltro}
            initialSubgenero={subgeneroFiltro}
            initialArtista={artistaFiltro}
          />
        )}

        {tabAtiva === 'biblioteca' && (
          <MinhasPlaylistsScreen
            token={token}
            player={player}
          />
        )}

        {tabAtiva === 'perfil' && (
          <PerfilScreen
            token={token}
            player={player}
            onLogout={handleLogout}
          />
        )}
      </View>

      {/* Mini-Player Flutuante do Spotify com Controles Completos */}
      {player.currentTrack && (
        <SpotifyMiniPlayer
          currentTrack={player.currentTrack}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          isLooping={player.isLooping}
          isShuffle={player.isShuffle}
          onTogglePlayPause={player.togglePlayPause}
          onNext={player.next}
          onPrevious={player.previous}
          onSeek={player.seekTo}
          onToggleLoop={player.toggleLoop}
          onToggleShuffle={player.toggleShuffle}
          onPressAddPlaylist={abrirModalAddPlaylist}
          onOptionsPress={abrirModalOpcoes}
        />
      )}

      {/* Barra de Navegação Inferior (Bottom Tabs Spotify) */}
      <SpotifyBottomNav
        tabAtiva={tabAtiva}
        onSelecionarTab={(t) => {
          setTabAtiva(t);
        }}
      />

      {/* ======================================================== */}
      {/* MODAL 3 PONTINHOS DA MÚSICA (FILA, PLAYLIST, TOCAR)      */}
      {/* ======================================================== */}
      <Modal visible={modalOpcoesVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
            {/* Header com miniatura da música selecionada */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                <View style={styles.opcoesTrackCover}>
                  <Ionicons name="musical-notes" size={20} color={SPOTIFY_COLORS.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {musicaOpcoes?.titulo || 'Opções da Música'}
                  </Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {musicaOpcoes?.artista || 'Artista Wave'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={fecharModalOpcoes} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={SPOTIFY_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Lista de Ações Rápidas */}
            <View style={styles.opcoesList}>
              {/* 1. Tocar Agora */}
              <TouchableOpacity
                style={styles.opcaoItem}
                onPress={handleAcaoTocarAgora}
                activeOpacity={0.7}
              >
                <View style={[styles.opcaoIconBox, { backgroundColor: '#166534' }]}>
                  <Ionicons name="play" size={20} color="#ffffff" style={{ marginLeft: 2 }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.opcaoItemTitle}>Tocar Agora</Text>
                  <Text style={styles.opcaoItemDesc}>Inicia a reprodução desta faixa imediatamente</Text>
                </View>
              </TouchableOpacity>

              {/* 2. Colocar na Fila (Tocar a Seguir) */}
              <TouchableOpacity
                style={styles.opcaoItem}
                onPress={handleAcaoTocarSeguinte}
                activeOpacity={0.7}
              >
                <View style={[styles.opcaoIconBox, { backgroundColor: '#1e3a8a' }]}>
                  <Ionicons name="play-forward" size={20} color="#60a5fa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.opcaoItemTitle}>Tocar a Seguir</Text>
                  <Text style={styles.opcaoItemDesc}>Coloca esta música como a próxima a tocar na fila</Text>
                </View>
              </TouchableOpacity>

              {/* 3. Adicionar ao Fim da Fila */}
              <TouchableOpacity
                style={styles.opcaoItem}
                onPress={handleAcaoAdicionarFila}
                activeOpacity={0.7}
              >
                <View style={[styles.opcaoIconBox, { backgroundColor: '#312e81' }]}>
                  <Ionicons name="list" size={20} color="#a5b4fc" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.opcaoItemTitle}>Adicionar ao Fim da Fila</Text>
                  <Text style={styles.opcaoItemDesc}>Insere na lista após todas as outras faixas da fila</Text>
                </View>
              </TouchableOpacity>

              {/* 4. Adicionar à Playlist */}
              <TouchableOpacity
                style={styles.opcaoItem}
                onPress={handleAcaoAdicionarPlaylist}
                activeOpacity={0.7}
              >
                <View style={[styles.opcaoIconBox, { backgroundColor: '#701a75' }]}>
                  <Ionicons name="add-circle" size={20} color="#f472b6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.opcaoItemTitle}>Adicionar à Playlist</Text>
                  <Text style={styles.opcaoItemDesc}>Guarda esta música em uma das suas playlists salvas</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnModalCancel} onPress={fecharModalOpcoes}>
              <Text style={styles.btnModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL ADICIONAR MÚSICA À PLAYLIST                        */}
      {/* ======================================================== */}
      <Modal visible={modalAddPlaylistVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar à Playlist</Text>
              <TouchableOpacity onPress={() => setModalAddPlaylistVisivel(false)}>
                <Ionicons name="close" size={24} color={SPOTIFY_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.addTrackLabel}>
              Faixa: <Text style={{ color: '#ffffff', fontWeight: '700' }}>{musicaParaAdicionar?.titulo}</Text>
            </Text>

            <Text style={styles.inputLabel}>Escolha a playlist de destino:</Text>

            {playlistsDisponiveis.length === 0 ? (
              <View style={styles.emptyPlBox}>
                <Ionicons name="disc-outline" size={32} color={SPOTIFY_COLORS.textSecondary} />
                <Text style={styles.emptyPlText}>Nenhuma playlist criada ainda.</Text>
                <Text style={styles.emptyPlSub}>Crie uma playlist na aba Sua Biblioteca primeiro!</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 240, marginVertical: 8 }}>
                {playlistsDisponiveis.map((pl) => (
                  <TouchableOpacity
                    key={`opt-pl-${pl.id}`}
                    style={styles.playlistOption}
                    onPress={() => confirmarAdicionarMusicaPlaylist(pl.id)}
                    disabled={adicionandoPlaylist}
                    activeOpacity={0.7}
                  >
                    <View style={styles.plIconBox}>
                      <Ionicons name="musical-notes" size={18} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.playlistOptionName}>{pl.nome}</Text>
                      <Text style={styles.playlistOptionCount}>{pl.total_musicas} músicas</Text>
                    </View>
                    <Ionicons name="add-circle" size={22} color={SPOTIFY_COLORS.green} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.btnModalCancel}
              onPress={() => setModalAddPlaylistVisivel(false)}
            >
              <Text style={styles.btnModalCancelText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <MainApp />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100%' as any) : undefined,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: SPOTIFY_COLORS.background,
  },
  screenContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.cardLarge,
    padding: 24,
    alignItems: 'center',
  },
  loginLogoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  loginTitle: {
    color: SPOTIFY_COLORS.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  loginSubtitle: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  authTabRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: SPOTIFY_COLORS.surface,
    borderRadius: SPOTIFY_RADIUS.pill,
    padding: 4,
    marginTop: 18,
    marginBottom: 6,
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: SPOTIFY_RADIUS.pill,
    alignItems: 'center',
  },
  authTabBtnActive: {
    backgroundColor: '#333333',
  },
  authTabBtnText: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  authTabBtnTextActive: {
    color: '#ffffff',
  },
  loginForm: {
    width: '100%',
    marginTop: 10,
  },
  inputLabel: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  loginInput: {
    backgroundColor: SPOTIFY_COLORS.surface,
    borderRadius: SPOTIFY_RADIUS.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: SPOTIFY_COLORS.text,
    fontSize: 14,
  },
  btnLoginSubmit: {
    backgroundColor: SPOTIFY_COLORS.green,
    borderRadius: SPOTIFY_RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  btnLoginSubmitText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  btnToggleAuthMode: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleAuthText: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 13,
  },
  toggleAuthTextBold: {
    color: SPOTIFY_COLORS.green,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: SPOTIFY_COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  opcoesTrackCover: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  opcoesList: {
    marginTop: 8,
    marginBottom: 10,
  },
  opcaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.surface,
    borderRadius: SPOTIFY_RADIUS.card,
    padding: 12,
    marginBottom: 8,
  },
  opcaoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  opcaoItemTitle: {
    color: SPOTIFY_COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  opcaoItemDesc: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  addTrackLabel: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  emptyPlBox: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.surface,
    borderRadius: SPOTIFY_RADIUS.card,
    marginVertical: 10,
  },
  emptyPlText: {
    color: SPOTIFY_COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyPlSub: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  playlistOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.surface,
    borderRadius: SPOTIFY_RADIUS.card,
    padding: 12,
    marginBottom: 8,
  },
  plIconBox: {
    width: 38,
    height: 38,
    borderRadius: SPOTIFY_RADIUS.image,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistOptionName: {
    color: SPOTIFY_COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  playlistOptionCount: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  btnModalCancel: {
    backgroundColor: SPOTIFY_COLORS.surface,
    borderRadius: SPOTIFY_RADIUS.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnModalCancelText: {
    color: SPOTIFY_COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
