import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

export interface QuickGridItem {
  id: string;
  titulo: string;
  imagemUrl: string;
  isCircular?: boolean;
  onPress: () => void;
}

interface SpotifyQuickGridProps {
  items: QuickGridItem[];
}

export default function SpotifyQuickGrid({ items }: SpotifyQuickGridProps) {
  // Limita aos primeiros 8 itens (4 linhas x 2 colunas) como no Spotify
  const displayItems = items.slice(0, 8);

  return (
    <View style={styles.grid}>
      {displayItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: item.imagemUrl }}
            style={[
              styles.image,
              item.isCircular ? styles.imageCircular : null,
            ]}
          />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {item.titulo}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  card: {
    width: '48.5%',
    height: 56,
    backgroundColor: SPOTIFY_COLORS.surfaceSubtle,
    borderRadius: SPOTIFY_RADIUS.card,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  image: {
    width: 56,
    height: 56,
    backgroundColor: '#333333',
  },
  imageCircular: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 6,
    marginRight: 6,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  title: {
    color: SPOTIFY_COLORS.text,
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 15,
  },
});
