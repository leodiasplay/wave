import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

export type FiltroPill = 'tudo' | 'musica' | 'generos' | 'artistas' | 'playlists';

interface SpotifyHeaderProps {
  filtroAtivo: FiltroPill;
  onSelecionarFiltro: (filtro: FiltroPill) => void;
  onPressPerfil?: () => void;
  avatarUrl?: string | null;
  userName?: string;
}

const FILTROS: { id: FiltroPill; label: string }[] = [
  { id: 'tudo', label: 'Tudo' },
  { id: 'musica', label: 'Música' },
  { id: 'generos', label: 'Gêneros' },
  { id: 'artistas', label: 'Artistas' },
  { id: 'playlists', label: 'Playlists' },
];

export default function SpotifyHeader({
  filtroAtivo,
  onSelecionarFiltro,
  onPressPerfil,
  avatarUrl,
  userName = 'Leo',
}: SpotifyHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Avatar do Perfil */}
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={onPressPerfil}
        activeOpacity={0.8}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Pílulas de Filtro Horizontais */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScroll}
      >
        {FILTROS.map((f) => {
          const ativo = filtroAtivo === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.pill,
                ativo ? styles.pillAtivo : styles.pillInativo,
              ]}
              onPress={() => onSelecionarFiltro(f.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  ativo ? styles.pillTextAtivo : styles.pillTextInativo,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: SPOTIFY_COLORS.background,
  },
  avatarButton: {
    marginRight: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  pillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: SPOTIFY_RADIUS.pill,
    marginRight: 8,
  },
  pillAtivo: {
    backgroundColor: SPOTIFY_COLORS.green,
  },
  pillInativo: {
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextAtivo: {
    color: SPOTIFY_COLORS.textDark,
    fontWeight: '700',
  },
  pillTextInativo: {
    color: SPOTIFY_COLORS.text,
  },
});
