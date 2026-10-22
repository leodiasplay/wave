import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

export interface CarouselCardItem {
  id: string | number;
  titulo: string;
  subtitulo?: string;
  imagemUrl: string;
  isCircular?: boolean;
  onPress: () => void;
}

interface SpotifyCarouselProps {
  titulo: string;
  subtitulo?: string;
  items: CarouselCardItem[];
  onPressVerTudo?: () => void;
}

export default function SpotifyCarousel({
  titulo,
  subtitulo,
  items,
  onPressVerTudo,
}: SpotifyCarouselProps) {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Cabeçalho da Seção */}
      <TouchableOpacity
        style={styles.header}
        onPress={onPressVerTudo}
        activeOpacity={onPressVerTudo ? 0.7 : 1}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.titulo}>{titulo}</Text>
          {onPressVerTudo ? (
            <View style={styles.verTudoRow}>
              <Text style={styles.verTudoText}>Ver tudo</Text>
              <Ionicons name="chevron-forward" size={16} color={SPOTIFY_COLORS.textSecondary} />
            </View>
          ) : null}
        </View>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </TouchableOpacity>

      {/* Carrossel Horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, item.isCircular ? styles.cardCircular : null]}
            onPress={item.onPress}
            activeOpacity={0.75}
          >
            <Image
              source={{ uri: item.imagemUrl }}
              style={[
                styles.image,
                item.isCircular ? styles.imageCircular : null,
              ]}
            />
            <Text
              style={[
                styles.cardTitle,
                item.isCircular ? styles.textCenter : null,
              ]}
              numberOfLines={1}
            >
              {item.titulo}
            </Text>
            {item.subtitulo ? (
              <Text
                style={[
                  styles.cardSubtitle,
                  item.isCircular ? styles.textCenter : null,
                ]}
                numberOfLines={1}
              >
                {item.subtitulo}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: SPOTIFY_COLORS.text,
    letterSpacing: -0.3,
  },
  verTudoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verTudoText: {
    fontSize: 12,
    fontWeight: '700',
    color: SPOTIFY_COLORS.textSecondary,
    marginRight: 2,
  },
  subtitulo: {
    fontSize: 13,
    color: SPOTIFY_COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: 140,
    marginRight: 14,
  },
  cardCircular: {
    width: 120,
    alignItems: 'center',
    marginRight: 16,
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: SPOTIFY_RADIUS.image,
    backgroundColor: '#222222',
    marginBottom: 8,
  },
  imageCircular: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    color: SPOTIFY_COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  cardSubtitle: {
    color: SPOTIFY_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 15,
  },
  textCenter: {
    textAlign: 'center',
  },
});
