/**
 * Spotify Mobile Design System Tokens
 */
export const SPOTIFY_COLORS = {
  // Backgrounds
  background: '#121212',
  backgroundElevated: '#181818',
  surface: '#242424',
  surfaceSubtle: '#282828',
  surfaceHover: '#383838',
  surfaceActive: '#404040',

  // Mini player
  playerBackground: '#332015', // Tom terroso/acobreado característico do Spotify para o mini-player
  playerBackgroundFallback: '#282828',

  // Brand Accents
  green: '#1ed760',
  greenHover: '#1fdf64',
  greenDark: '#169c46',

  // Text
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  textSubtle: '#6a6a6a',
  textDark: '#000000',

  // Overlays & Accents
  overlay: 'rgba(0,0,0,0.6)',
  divider: 'rgba(255,255,255,0.08)',
  badgeBackground: 'rgba(0,0,0,0.65)',
};

export const SPOTIFY_TYPOGRAPHY = {
  fontFamily: undefined, // Sistema padrão (Circular / San Francisco / Roboto)
  h1: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: SPOTIFY_COLORS.text,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: SPOTIFY_COLORS.text,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: SPOTIFY_COLORS.text,
    lineHeight: 16,
  },
  body: {
    fontSize: 14,
    color: SPOTIFY_COLORS.text,
  },
  bodySecondary: {
    fontSize: 13,
    color: SPOTIFY_COLORS.textSecondary,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    color: SPOTIFY_COLORS.textSecondary,
  },
  pill: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
};

export const SPOTIFY_RADIUS = {
  pill: 9999,
  card: 6,
  cardLarge: 8,
  image: 4,
  avatar: 9999,
};
