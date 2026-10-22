import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemMusica } from '../services/musicaApi';

interface PlayerDockProps {
  currentTrack: ItemMusica | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onToggleFavorite?: (track: ItemMusica) => void;
}

export default function PlayerDock({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleFavorite,
}: PlayerDockProps) {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Barra de Progresso com Seek */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.progressBarBg}
        onPress={(e) => {
          const { locationX } = e.nativeEvent;
          // Estima largura padrão ou proporcional
          const barWidth = 350;
          const ratio = Math.max(0, Math.min(1, locationX / barWidth));
          onSeek(ratio * (duration || 1));
        }}
      >
        <View style={[styles.progressBarFill, { width: `${progressPercent * 100}%` }]} />
      </TouchableOpacity>

      <View style={styles.dockBody}>
        {/* Info da Faixa */}
        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.titulo}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artista}
            {currentTrack.genero ? ` • ${currentTrack.genero}` : ''}
            {currentTrack.subgenero ? ` (${currentTrack.subgenero})` : ''}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>

        {/* Controles de Reprodução */}
        <View style={styles.controlsRow}>
          {onToggleFavorite && (
            <TouchableOpacity
              style={styles.btnAction}
              onPress={() => onToggleFavorite(currentTrack)}
            >
              <Ionicons
                name={currentTrack.favorita ? 'heart' : 'heart-outline'}
                size={22}
                color={currentTrack.favorita ? '#38bdf8' : '#94a3b8'}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btnAction} onPress={onPrevious}>
            <Ionicons name="play-skip-back" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPlay} onPress={onTogglePlayPause}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnAction} onPress={onNext}>
            <Ionicons name="play-skip-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0b1120',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#1e293b',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  dockBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  artist: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  timeText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnAction: {
    padding: 6,
  },
  btnPlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
});
