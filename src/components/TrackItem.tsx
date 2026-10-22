import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemMusica } from '../services/musicaApi';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

interface TrackItemProps {
  musica: ItemMusica;
  isPlayingThis: boolean;
  isSelectedThis: boolean;
  onPlayPress: () => void;
  onFavoritePress: () => void;
  onAddToPlaylistPress?: () => void;
  onOptionsPress?: () => void;
}

export default function TrackItem({
  musica,
  isPlayingThis,
  isSelectedThis,
  onPlayPress,
  onFavoritePress,
  onAddToPlaylistPress,
  onOptionsPress,
}: TrackItemProps) {
  return (
    <View style={[styles.card, isSelectedThis && styles.cardActive]}>
      {/* Botão Play / Pause */}
      <TouchableOpacity
        style={[styles.playBtn, isPlayingThis && styles.playBtnActive]}
        onPress={onPlayPress}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isPlayingThis ? 'pause' : 'play'}
          size={16}
          color={isPlayingThis ? '#000000' : isSelectedThis ? SPOTIFY_COLORS.green : '#ffffff'}
          style={!isPlayingThis ? { marginLeft: 2 } : null}
        />
      </TouchableOpacity>

      {/* Informações da Música */}
      <TouchableOpacity
        style={styles.infoCol}
        onPress={onPlayPress}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.title, isSelectedThis && styles.titleActive]}
          numberOfLines={1}
        >
          {musica.titulo}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {musica.artista}
          {musica.album ? ` • ${musica.album}` : ''}
        </Text>

        <View style={styles.badgeRow}>
          {musica.is_gdrive && (
            <View style={styles.badgeDrive}>
              <Ionicons name="cloud" size={10} color={SPOTIFY_COLORS.green} />
              <Text style={styles.badgeDriveText}>Google Drive</Text>
            </View>
          )}

          {musica.subgenero ? (
            <View style={styles.badgeSub}>
              <Text style={styles.badgeSubText}>{musica.subgenero}</Text>
            </View>
          ) : musica.genero ? (
            <View style={styles.badgeSub}>
              <Text style={styles.badgeSubText}>{musica.genero}</Text>
            </View>
          ) : null}

          {musica.formato && (
            <View style={styles.badgeFormat}>
              <Text style={styles.badgeFormatText}>{musica.formato.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Ações da Música */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onFavoritePress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={musica.favorita ? 'heart' : 'heart-outline'}
            size={20}
            color={musica.favorita ? SPOTIFY_COLORS.green : SPOTIFY_COLORS.textSecondary}
          />
        </TouchableOpacity>

        {(onOptionsPress || onAddToPlaylistPress) && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOptionsPress || onAddToPlaylistPress}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={SPOTIFY_COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: SPOTIFY_RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardActive: {
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playBtnActive: {
    backgroundColor: SPOTIFY_COLORS.green,
  },
  infoCol: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: SPOTIFY_COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  titleActive: {
    color: SPOTIFY_COLORS.green,
  },
  artist: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12.5,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badgeDrive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 215, 96, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeDriveText: {
    color: SPOTIFY_COLORS.green,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeSub: {
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSubText: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  badgeFormat: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeFormatText: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
  },
});
