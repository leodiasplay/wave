import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPOTIFY_COLORS } from '../theme/spotifyTheme';

export type SpotifyTabId = 'inicio' | 'buscar' | 'biblioteca' | 'perfil';

interface SpotifyBottomNavProps {
  tabAtiva: SpotifyTabId;
  onSelecionarTab: (tab: SpotifyTabId) => void;
}

export default function SpotifyBottomNav({
  tabAtiva,
  onSelecionarTab,
}: SpotifyBottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);

  const tabs: { id: SpotifyTabId; label: string; iconAtivo: any; iconInativo: any }[] = [
    {
      id: 'inicio',
      label: 'Início',
      iconAtivo: 'home',
      iconInativo: 'home-outline',
    },
    {
      id: 'buscar',
      label: 'Buscar',
      iconAtivo: 'search',
      iconInativo: 'search-outline',
    },
    {
      id: 'biblioteca',
      label: 'Sua Biblioteca',
      iconAtivo: 'library',
      iconInativo: 'library-outline',
    },
    {
      id: 'perfil',
      label: 'Perfil',
      iconAtivo: 'person',
      iconInativo: 'person-outline',
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding, height: 56 + bottomPadding }]}>
      {tabs.map((tab) => {
        const ativo = tabAtiva === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => onSelecionarTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={ativo ? tab.iconAtivo : tab.iconInativo}
              size={24}
              color={ativo ? '#ffffff' : '#b3b3b3'}
            />
            <Text
              style={[
                styles.tabLabel,
                ativo ? styles.tabLabelAtivo : styles.tabLabelInativo,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: SPOTIFY_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    fontWeight: '600',
  },
  tabLabelAtivo: {
    color: '#ffffff',
  },
  tabLabelInativo: {
    color: '#b3b3b3',
  },
});
