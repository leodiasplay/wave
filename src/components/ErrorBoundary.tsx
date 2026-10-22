import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPOTIFY_COLORS, SPOTIFY_RADIUS } from '../theme/spotifyTheme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={64} color={SPOTIFY_COLORS.green} />
          <Text style={styles.title}>Ops! Algo inesperado aconteceu</Text>
          <Text style={styles.subtitle}>
            {this.state.error?.message || 'Ocorreu um erro ao renderizar este conteúdo.'}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnPrimary} onPress={this.handleReload} activeOpacity={0.85}>
              <Ionicons name="refresh" size={18} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.btnPrimaryText}>Recarregar App</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={this.handleGoHome} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryText}>Ir para o Início</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPOTIFY_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: SPOTIFY_COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 340,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPOTIFY_COLORS.green,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: SPOTIFY_RADIUS.pill,
  },
  btnPrimaryText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: SPOTIFY_RADIUS.pill,
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
