import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemMusica } from '../services/musicaApi';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

const { width } = Dimensions.get('window');

interface SpotifyMiniPlayerProps {
  currentTrack: ItemMusica | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLooping?: boolean;
  isShuffle?: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onToggleLoop?: () => void;
  onToggleShuffle?: () => void;
  onToggleFavorite?: (track: ItemMusica) => void;
  onPressAddPlaylist?: (track: ItemMusica) => void;
  onOptionsPress?: (track: ItemMusica) => void;
}

function formatarTempo(segundos: number): string {
  if (isNaN(segundos) || segundos < 0) return '00:00';
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}

export default function SpotifyMiniPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  isLooping = false,
  isShuffle = false,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleLoop,
  onToggleShuffle,
  onToggleFavorite,
  onPressAddPlaylist,
  onOptionsPress,
}: SpotifyMiniPlayerProps) {
  const insets = useSafeAreaInsets();
  const [modalExpandido, setModalExpandido] = useState(false);

  if (!currentTrack) return null;

  const duracaoValida = duration > 0 ? duration : currentTrack.duracao_segundos || 180;
  const progressPercent = Math.min(1, Math.max(0, currentTime / duracaoValida));

  const coverUrl =
    currentTrack.genero === 'Rock'
      ? 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80';

  // Permite adiantar a faixa clicando ou arrastando na barra de progresso
  const handleSeekPress = (e: any) => {
    if (duracaoValida <= 0) return;
    if (Platform.OS === 'web') {
      const clientX = e.nativeEvent?.clientX ?? (e as any).clientX;
      const currentTarget = e.currentTarget || e.target;
      const rect = currentTarget?.getBoundingClientRect?.();
      if (rect && rect.width > 0 && clientX !== undefined) {
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const ratio = x / rect.width;
        onSeek(ratio * duracaoValida);
        return;
      }
    }
    const clickX = e.nativeEvent?.locationX || 0;
    const barWidth = width - 16;
    const ratio = Math.max(0, Math.min(1, clickX / barWidth));
    onSeek(ratio * duracaoValida);
  };

  const handleFullSeekPress = (e: any) => {
    if (duracaoValida <= 0) return;
    if (Platform.OS === 'web') {
      const clientX = e.nativeEvent?.clientX ?? (e as any).clientX;
      const currentTarget = e.currentTarget || e.target;
      const rect = currentTarget?.getBoundingClientRect?.();
      if (rect && rect.width > 0 && clientX !== undefined) {
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const ratio = x / rect.width;
        onSeek(ratio * duracaoValida);
        return;
      }
    }
    const clickX = e.nativeEvent?.locationX || 0;
    const barWidth = width - 48;
    const ratio = Math.max(0, Math.min(1, clickX / barWidth));
    onSeek(ratio * duracaoValida);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. MINI-PLAYER COMPACTO FLUTUANTE (BARRA INFERIOR)       */}
      {/* ======================================================== */}
      <View style={styles.floatingWrapper}>
        <View style={styles.container}>
          {/* Barra de Progresso Superior Clicável para Avançar com área de toque ampla */}
          <TouchableOpacity
            style={styles.progressTouchArea}
            onPress={handleSeekPress}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 0, right: 0 }}
          >
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
            </View>
          </TouchableOpacity>

          <View style={styles.contentRow}>
            {/* Capa e Título: Toque para expandir o Player em Tela Cheia */}
            <TouchableOpacity
              style={styles.trackInfoWrapper}
              onPress={() => setModalExpandido(true)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: coverUrl }} style={styles.cover} />
              <View style={styles.trackInfo}>
                <Text style={styles.title} numberOfLines={1}>
                  {currentTrack.titulo}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {currentTrack.artista || 'Artista Desconhecido'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Ações de Controle da Música */}
            <View style={styles.actions}>
              {/* Botão Repetir */}
              {onToggleLoop && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={onToggleLoop}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="repeat"
                    size={20}
                    color={isLooping ? SPOTIFY_COLORS.green : '#999999'}
                  />
                </TouchableOpacity>
              )}

              {/* Botão Voltar Faixa */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onPrevious}
                activeOpacity={0.7}
              >
                <Ionicons name="play-skip-back" size={20} color="#ffffff" />
              </TouchableOpacity>

              {/* Botão Play / Pause */}
              <TouchableOpacity
                style={styles.playBtn}
                onPress={onTogglePlayPause}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={22}
                  color="#ffffff"
                  style={!isPlaying ? { marginLeft: 2 } : null}
                />
              </TouchableOpacity>

              {/* Botão Passar Faixa para Frente (Next) */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onNext}
                activeOpacity={0.7}
              >
                <Ionicons name="play-skip-forward" size={20} color="#ffffff" />
              </TouchableOpacity>

              {/* 3 Pontinhos da Música */}
              {onOptionsPress && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onOptionsPress(currentTrack)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="#b3b3b3" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* ======================================================== */}
      {/* 2. PLAYER EM TELA CHEIA (EXPANDIDO ESTILO SPOTIFY)        */}
      {/* ======================================================== */}
      <Modal
        visible={modalExpandido}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalExpandido(false)}
      >
        <View style={[styles.fullModalContainer, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Header Superior: Minimizar + Título do Contexto + Opções */}
          <View style={styles.fullHeader}>
            <TouchableOpacity
              style={styles.fullIconBtn}
              onPress={() => setModalExpandido(false)}
            >
              <Ionicons name="chevron-down" size={28} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.fullHeaderTitleCol}>
              <Text style={styles.fullContextSub}>TOCANDO DA BIBLIOTECA</Text>
              <Text style={styles.fullContextTitle} numberOfLines={1}>
                {currentTrack.genero || currentTrack.artista || 'Wave Player'}
              </Text>
            </View>

            {onOptionsPress ? (
              <TouchableOpacity
                style={styles.fullIconBtn}
                onPress={() => {
                  setModalExpandido(false);
                  onOptionsPress(currentTrack);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Capa Gigante da Música */}
          <View style={styles.fullCoverWrapper}>
            <Image
              source={{ uri: coverUrl }}
              style={styles.fullCoverImage}
              resizeMode="cover"
            />
          </View>

          {/* Informações da Música + Botão de Curtir */}
          <View style={styles.fullTrackMetaRow}>
            <View style={styles.fullTrackMetaCol}>
              <Text style={styles.fullTrackTitle} numberOfLines={1}>
                {currentTrack.titulo}
              </Text>
              <Text style={styles.fullTrackArtist} numberOfLines={1}>
                {currentTrack.artista || 'Artista Desconhecido'}
              </Text>
            </View>

            {onToggleFavorite && (
              <TouchableOpacity
                onPress={() => onToggleFavorite(currentTrack)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={currentTrack.favorita ? 'heart' : 'heart-outline'}
                  size={28}
                  color={currentTrack.favorita ? SPOTIFY_COLORS.green : '#ffffff'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Barra de Progresso / Scrubber com Tempos */}
          <View style={styles.fullScrubberContainer}>
            <TouchableOpacity
              style={styles.fullScrubberTouchArea}
              onPress={handleFullSeekPress}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 0, right: 0 }}
            >
              <View style={styles.fullScrubberTrack}>
                <View
                  style={[
                    styles.fullScrubberFill,
                    { width: `${progressPercent * 100}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.fullTimesRow}>
              <Text style={styles.fullTimeText}>{formatarTempo(currentTime)}</Text>
              <Text style={styles.fullTimeText}>{formatarTempo(duracaoValida)}</Text>
            </View>
          </View>

          {/* Controles Principais de Reprodução */}
          <View style={styles.fullControlsRow}>
            {/* Botão Mudar / Aleatório (Shuffle) */}
            <TouchableOpacity
              style={styles.controlSubBtn}
              onPress={onToggleShuffle}
              activeOpacity={0.7}
            >
              <Ionicons
                name="shuffle"
                size={24}
                color={isShuffle ? SPOTIFY_COLORS.green : '#888888'}
              />
            </TouchableOpacity>

            {/* Faixa Anterior */}
            <TouchableOpacity
              style={styles.controlSubBtn}
              onPress={onPrevious}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-back" size={32} color="#ffffff" />
            </TouchableOpacity>

            {/* Play / Pause Principal Gigante */}
            <TouchableOpacity
              style={styles.fullPlayBtn}
              onPress={onTogglePlayPause}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={34}
                color="#000000"
                style={!isPlaying ? { marginLeft: 4 } : null}
              />
            </TouchableOpacity>

            {/* Próxima Faixa (Passar para Frente) */}
            <TouchableOpacity
              style={styles.controlSubBtn}
              onPress={onNext}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-forward" size={32} color="#ffffff" />
            </TouchableOpacity>

            {/* Botão Repetir (Loop) */}
            <TouchableOpacity
              style={styles.controlSubBtn}
              onPress={onToggleLoop}
              activeOpacity={0.7}
            >
              <Ionicons
                name="repeat"
                size={24}
                color={isLooping ? SPOTIFY_COLORS.green : '#888888'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    paddingHorizontal: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  container: {
    backgroundColor: '#201614',
    borderRadius: SPOTIFY_RADIUS.cardLarge,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressTouchArea: {
    width: '100%',
    paddingVertical: 6,
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  progressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: SPOTIFY_COLORS.green,
    borderRadius: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  trackInfoWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: SPOTIFY_RADIUS.image,
    backgroundColor: '#222222',
  },
  trackInfo: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  artist: {
    color: '#b3b3b3',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    marginHorizontal: 1,
  },
  playBtn: {
    padding: 6,
    marginHorizontal: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Expandido Tela Cheia
  fullModalContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 8,
    paddingBottom: 12,
  },
  fullIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullHeaderTitleCol: {
    alignItems: 'center',
    flex: 1,
  },
  fullContextSub: {
    fontSize: 11,
    fontWeight: '700',
    color: SPOTIFY_COLORS.textSecondary,
    letterSpacing: 1.2,
  },
  fullContextTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  fullCoverWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    marginVertical: 16,
  },
  fullCoverImage: {
    width: width > 500 ? 340 : width - 56,
    height: width > 500 ? 340 : width - 56,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  fullTrackMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginBottom: 16,
  },
  fullTrackMetaCol: {
    flex: 1,
    marginRight: 16,
  },
  fullTrackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  fullTrackArtist: {
    fontSize: 16,
    color: SPOTIFY_COLORS.textSecondary,
    marginTop: 4,
  },
  fullScrubberContainer: {
    paddingHorizontal: 28,
    marginBottom: 20,
  },
  fullScrubberTouchArea: {
    width: '100%',
    paddingVertical: 10,
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  fullScrubberTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fullScrubberFill: {
    height: '100%',
    backgroundColor: SPOTIFY_COLORS.green,
    borderRadius: 3,
  },
  fullTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  fullTimeText: {
    fontSize: 12,
    color: SPOTIFY_COLORS.textSecondary,
  },
  fullControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  controlSubBtn: {
    padding: 8,
  },
  fullPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
