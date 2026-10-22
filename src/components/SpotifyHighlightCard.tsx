import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

interface SpotifyHighlightCardProps {
  secaoTitulo: string;
  secaoSubtitulo?: string;
  bannerUrl: string;
  badgeTempo?: string;
  artistaNome: string;
  musicaTitulo: string;
  artistaAvatarUrl?: string;
  tocando?: boolean;
  onPressPlay: () => void;
  onPressAdd?: () => void;
  onPressMenu?: () => void;
  onPressHeader?: () => void;
}

export default function SpotifyHighlightCard({
  secaoTitulo,
  secaoSubtitulo,
  bannerUrl,
  badgeTempo = '03:45',
  artistaNome,
  musicaTitulo,
  artistaAvatarUrl,
  tocando = false,
  onPressPlay,
  onPressAdd,
  onPressMenu,
  onPressHeader,
}: SpotifyHighlightCardProps) {
  return (
    <View style={styles.container}>
      {/* Cabeçalho da Seção */}
      <TouchableOpacity
        style={styles.header}
        onPress={onPressHeader}
        activeOpacity={onPressHeader ? 0.7 : 1}
      >
        <View style={styles.headerTitles}>
          <View style={styles.titleRow}>
            <Text style={styles.secaoTitulo}>{secaoTitulo}</Text>
            <Ionicons name="chevron-forward" size={20} color={SPOTIFY_COLORS.textSecondary} />
          </View>
          {secaoSubtitulo ? (
            <Text style={styles.secaoSubtitulo}>{secaoSubtitulo}</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Banner Principal com Controles Sobrepostos */}
      <View style={styles.bannerContainer}>
        <Image source={{ uri: bannerUrl }} style={styles.bannerImage} />

        {/* Badge de tempo no topo esquerdo */}
        {badgeTempo ? (
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{badgeTempo}</Text>
          </View>
        ) : null}

        {/* Controles Flutuantes no Canto Inferior Direito */}
        <View style={styles.overlayControls}>
          {onPressAdd ? (
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={onPressAdd}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.iconCircle}
            activeOpacity={0.8}
          >
            <Ionicons name="volume-medium" size={18} color="#ffffff" />
          </TouchableOpacity>

          {/* Botão Play Circular Branco Gigante */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={onPressPlay}
            activeOpacity={0.85}
          >
            <Ionicons
              name={tocando ? 'pause' : 'play'}
              size={24}
              color="#000000"
              style={!tocando ? { marginLeft: 3 } : null}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Informações da Faixa em Baixo do Banner */}
      <View style={styles.footerRow}>
        {artistaAvatarUrl ? (
          <Image source={{ uri: artistaAvatarUrl }} style={styles.artistAvatar} />
        ) : (
          <View style={styles.artistAvatarFallback}>
            <Ionicons name="musical-notes" size={16} color="#ffffff" />
          </View>
        )}

        <View style={styles.trackInfo}>
          <Text style={styles.musicaTitulo} numberOfLines={1}>
            {musicaTitulo}
          </Text>
          <Text style={styles.artistaNome} numberOfLines={1}>
            {artistaNome}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={onPressMenu}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={SPOTIFY_COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 10,
  },
  headerTitles: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secaoTitulo: {
    fontSize: 22,
    fontWeight: '800',
    color: SPOTIFY_COLORS.text,
    letterSpacing: -0.4,
  },
  secaoSubtitulo: {
    fontSize: 13,
    color: SPOTIFY_COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  bannerContainer: {
    width: '100%',
    height: 230,
    borderRadius: SPOTIFY_RADIUS.cardLarge,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  timeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  overlayControls: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  artistAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#333',
  },
  artistAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  musicaTitulo: {
    color: SPOTIFY_COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  artistaNome: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12.5,
    marginTop: 1,
  },
  menuButton: {
    padding: 6,
  },
});
