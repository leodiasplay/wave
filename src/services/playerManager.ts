import { Platform } from 'react-native';
import { ItemMusica, construirUrlStream, isSameTrack } from './musicaApi';
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import { obterFotoRealGdrive } from '../constants/artistasGdriveMap';

export interface PlayerStatus {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  currentTrack: ItemMusica | null;
  volume: number;
  isLooping: boolean;
  isShuffle: boolean;
  queueLength: number;
}

type Listener = (status: PlayerStatus) => void;

class PlayerManager {
  private currentTrack: ItemMusica | null = null;
  private queue: ItemMusica[] = [];
  private isPlaying = false;
  private isLoading = false;
  private currentTime = 0;
  private duration = 0;
  private volume = 1.0;
  private isLooping = false;
  private isShuffle = false;
  private token: string | null = null;

  private listeners: Set<Listener> = new Set();
  private timer: any = null;

  private nativePlayer: AudioPlayer | null = null;
  private webAudio: HTMLAudioElement | null = null;
  private preloadedAudio: HTMLAudioElement | null = null;
  private preloadedTrack: ItemMusica | null = null;
  private isEnding = false;

  constructor() {
    this.configurarModoAudio();
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      this.webAudio = new window.Audio();
      this.setupWebListeners();
    }
  }

  public async configurarModoAudio() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
    } catch (e) {
      console.warn('Erro ao configurar modo de áudio no expo-audio:', e);
    }
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  public setQueue(tracks: ItemMusica[]) {
    this.queue = [...tracks];
    this.notify();
    this.checkPreloadNext();
  }

  public addToQueue(track: ItemMusica) {
    this.queue.push(track);
    this.notify();
    this.checkPreloadNext();
  }

  public playNextInQueue(track: ItemMusica) {
    if (!this.currentTrack) {
      this.play(track, this.token);
      return;
    }
    const idx = this.queue.findIndex((t) => isSameTrack(t, this.currentTrack));
    if (idx >= 0) {
      this.queue.splice(idx + 1, 0, track);
    } else {
      this.queue.unshift(track);
    }
    this.notify();
    this.checkPreloadNext();
  }

  public getQueue(): ItemMusica[] {
    return [...this.queue];
  }

  public setDefaultTrackIfEmpty(track: ItemMusica) {
    if (!this.currentTrack) {
      this.currentTrack = track;
      this.currentTime = 0;
      this.duration = track.duracao_segundos || 180;
      this.notify();
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  public getStatus(): PlayerStatus {
    let actuallyPlaying = this.isPlaying;
    if (Platform.OS === 'web' && this.webAudio) {
      if (!this.webAudio.paused && !this.webAudio.ended) {
        actuallyPlaying = true;
      } else if (this.webAudio.paused && !this.isLoading) {
        actuallyPlaying = false;
      }
    }

    return {
      isPlaying: actuallyPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      isLoading: this.isLoading,
      currentTrack: this.currentTrack,
      volume: this.volume,
      isLooping: this.isLooping,
      isShuffle: this.isShuffle,
      queueLength: this.queue.length,
    };
  }

  public async play(track: ItemMusica, token?: string | null) {
    if (token) this.token = token;
    this.currentTrack = track;
    this.isPlaying = true;
    this.isLoading = true;
    this.currentTime = 0;
    this.duration = track.duracao_segundos || 0;
    this.isEnding = false;

    // Se o track atual não estiver na fila, adiciona à fila
    const existsInQueue = this.queue.some((t) => isSameTrack(t, track));
    if (!existsInQueue) {
      this.queue.push(track);
    }

    this.notify();

    const streamUrl = construirUrlStream(track, this.token);

    if (Platform.OS === 'web') {
      try {
        // Se a faixa já foi pré-carregada no preloadedAudio, usamos ela direto
        if (
          this.preloadedAudio &&
          this.preloadedTrack &&
          isSameTrack(this.preloadedTrack, track)
        ) {
          if (this.webAudio) {
            this.webAudio.pause();
            this.webAudio.src = '';
          }
          this.webAudio = this.preloadedAudio;
          this.preloadedAudio = null;
          this.preloadedTrack = null;
          this.setupWebListeners();

          this.webAudio.currentTime = 0;
          this.webAudio.volume = this.volume;
          this.webAudio.loop = this.isLooping;

          await this.webAudio.play();
          this.isPlaying = true;
          this.isLoading = false;
          this.setupWebMediaSession(track);
          this.notify();
          this.checkPreloadNext();
          return;
        }

        if (!this.webAudio) {
          this.webAudio = new window.Audio();
        }
        this.webAudio.src = streamUrl;
        this.webAudio.volume = this.volume;
        this.webAudio.loop = this.isLooping;
        this.setupWebListeners();

        this.webAudio.load();
        const playPromise = this.webAudio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        this.isPlaying = true;
        this.isLoading = false;
        this.setupWebMediaSession(track);
        this.notify();
        this.checkPreloadNext();
      } catch (err) {
        console.warn('Erro ao reproduzir áudio na web:', err);
        this.isLoading = false;
        this.isPlaying = false;
        this.notify();
      }
    } else {
      try {
        await this.configurarModoAudio();

        if (this.nativePlayer) {
          try {
            this.nativePlayer.clearLockScreenControls();
            this.nativePlayer.pause();
            this.nativePlayer.release();
          } catch {}
          this.nativePlayer = null;
        }

        const player = createAudioPlayer(streamUrl, {
          updateInterval: 500,
        });

        this.nativePlayer = player;
        player.volume = this.volume;
        player.loop = this.isLooping;

        const fotoReal = track.artista ? obterFotoRealGdrive(track.artista) : null;
        const artwork = track.capa_url || fotoReal || (track.genero ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' : undefined);

        try {
          player.setActiveForLockScreen(
            true,
            {
              title: track.titulo || 'Faixa sem título',
              artist: track.artista || 'Wave',
              albumTitle: track.album || track.genero || 'Wave Music',
              artworkUrl: artwork,
            },
            {
              // Desativa os botoes de avancar/retroceder 10s (seek) na barra de notificacoes
              showSeekForward: false,
              showSeekBackward: false,
            }
          );
        } catch (errLock) {
          console.warn('Erro ao configurar controles na barra de notificações:', errLock);
        }

        // Listener nativo para sincronizar com controles da notificação / tela de bloqueio
        player.addListener('playbackStatusUpdate', (status) => {
          if (status.isLoaded) {
            this.isPlaying = status.playing;
            this.currentTime = status.currentTime;
            if (status.duration && status.duration > 0) {
              this.duration = status.duration;
            }
            if (status.didJustFinish && !this.isEnding) {
              this.handleTrackEnded();
            }
            this.notify();
          }
        });

        player.play();
        this.isPlaying = true;
        this.isLoading = false;
        this.iniciarMonitoramentoNativo();
        this.notify();
      } catch (err) {
        console.warn('Erro ao reproduzir áudio nativo:', err);
        this.isLoading = false;
        this.isPlaying = false;
        this.notify();
      }
    }
  }

  public async pause() {
    this.isPlaying = false;
    if (Platform.OS === 'web' && this.webAudio) {
      try {
        this.webAudio.pause();
      } catch (e) {
        console.warn('Erro ao pausar webAudio:', e);
      }
    } else if (this.nativePlayer) {
      try {
        this.nativePlayer.pause();
      } catch (e) {
        console.warn('Erro ao pausar nativo:', e);
      }
    }
    this.notify();
  }

  public async resume() {
    if (!this.currentTrack) return;
    this.isPlaying = true;
    this.notify();

    if (Platform.OS === 'web') {
      if (!this.webAudio || !this.webAudio.src || this.webAudio.src === '' || this.webAudio.src === window.location.href) {
        await this.play(this.currentTrack, this.token);
        return;
      }
      try {
        await this.webAudio.play();
        this.isPlaying = true;
        this.notify();
      } catch (err) {
        console.warn('Erro ao retomar áudio na web:', err);
        await this.play(this.currentTrack, this.token);
      }
    } else if (this.nativePlayer) {
      try {
        this.nativePlayer.play();
        this.isPlaying = true;
        this.notify();
      } catch (err) {
        console.warn('Erro ao retomar áudio nativo:', err);
        await this.play(this.currentTrack, this.token);
      }
    } else {
      await this.play(this.currentTrack, this.token);
    }
  }

  public async togglePlayPause() {
    if (Platform.OS === 'web' && this.webAudio) {
      if (this.webAudio.paused) {
        await this.resume();
      } else {
        await this.pause();
      }
      return;
    }
    if (this.isPlaying) {
      await this.pause();
    } else {
      await this.resume();
    }
  }

  public seekTo(segundos: number) {
    const maxDur = this.duration > 0 ? this.duration : 10000;
    const destino = Math.max(0, Math.min(maxDur, segundos));
    this.currentTime = destino;
    this.isEnding = false;

    if (Platform.OS === 'web' && this.webAudio) {
      try {
        this.webAudio.currentTime = destino;
        if (this.webAudio.paused && this.isPlaying) {
          this.webAudio.play().catch(() => {});
        }
      } catch (e) {
        console.warn('Erro ao buscar na web:', e);
      }
    } else if (this.nativePlayer) {
      try {
        this.nativePlayer.seekTo(destino);
      } catch (e) {
        console.warn('Erro ao buscar nativo:', e);
      }
    }

    this.notify();
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;

    if (Platform.OS === 'web' && this.webAudio) {
      this.webAudio.volume = clamped;
    } else if (this.nativePlayer) {
      this.nativePlayer.volume = clamped;
    }

    this.notify();
  }

  public toggleLoop() {
    this.isLooping = !this.isLooping;

    if (Platform.OS === 'web' && this.webAudio) {
      this.webAudio.loop = this.isLooping;
    } else if (this.nativePlayer) {
      this.nativePlayer.loop = this.isLooping;
    }

    this.notify();
  }

  public toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.notify();
    this.checkPreloadNext();
  }

  public next() {
    if (this.queue.length === 0 || !this.currentTrack) return;

    if (this.isShuffle && this.queue.length > 1) {
      let randomIdx = Math.floor(Math.random() * this.queue.length);
      const currentIdx = this.queue.findIndex((t) => isSameTrack(t, this.currentTrack));
      if (randomIdx === currentIdx) {
        randomIdx = (randomIdx + 1) % this.queue.length;
      }
      this.play(this.queue[randomIdx]);
      return;
    }

    const idx = this.queue.findIndex((t) => isSameTrack(t, this.currentTrack));

    if (idx >= 0 && idx < this.queue.length - 1) {
      this.play(this.queue[idx + 1]);
    } else if (this.queue.length > 0) {
      this.play(this.queue[0]);
    }
  }

  public previous() {
    if (this.queue.length === 0 || !this.currentTrack) return;

    if (this.currentTime > 3) {
      this.seekTo(0);
      return;
    }

    const idx = this.queue.findIndex((t) => isSameTrack(t, this.currentTrack));

    if (idx > 0) {
      this.play(this.queue[idx - 1]);
    } else if (this.queue.length > 0) {
      this.play(this.queue[this.queue.length - 1]);
    }
  }

  /**
   * Disparado quando a música atual finaliza.
   * Transiciona sem travas para a próxima faixa da fila.
   */
  private handleTrackEnded() {
    if (this.isEnding) return;
    this.isEnding = true;

    if (this.isLooping) {
      this.seekTo(0);
      this.resume();
      this.isEnding = false;
      return;
    }

    this.isPlaying = false;
    this.notify();

    // Pequeno timeout para permitir que os listeners atualizem e avance
    setTimeout(() => {
      this.next();
      this.isEnding = false;
    }, 100);
  }

  /**
   * Pré-carrega (engatilha) a próxima faixa da fila em background.
   */
  private checkPreloadNext() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (this.queue.length <= 1 || !this.currentTrack) return;

    const currentIdx = this.queue.findIndex((t) => isSameTrack(t, this.currentTrack));

    let nextTrack: ItemMusica | null = null;
    if (currentIdx >= 0 && currentIdx < this.queue.length - 1) {
      nextTrack = this.queue[currentIdx + 1];
    } else if (this.queue.length > 0) {
      nextTrack = this.queue[0];
    }

    if (!nextTrack) return;

    // Se já estiver engatilhada, não recria
    if (this.preloadedTrack && isSameTrack(this.preloadedTrack, nextTrack)) {
      return;
    }

    try {
      this.preloadedTrack = nextTrack;
      if (!this.preloadedAudio) {
        this.preloadedAudio = new window.Audio();
      }
      this.preloadedAudio.preload = 'auto';
      this.preloadedAudio.src = construirUrlStream(nextTrack, this.token);
      this.preloadedAudio.volume = 0; // silencioso durante o preload
      this.preloadedAudio.load();
    } catch (e) {
      // ignore
    }
  }


  private setupWebMediaSession(track: ItemMusica) {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const fotoReal = track.artista ? obterFotoRealGdrive(track.artista) : null;
        const artwork = track.capa_url || fotoReal || (track.genero ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' : undefined);

        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.titulo || 'Faixa sem título',
          artist: track.artista || 'Wave',
          album: track.album || track.genero || 'Wave Music',
          artwork: artwork ? [{ src: artwork, sizes: '512x512', type: 'image/jpeg' }] : [],
        });

        navigator.mediaSession.playbackState = 'playing';

        navigator.mediaSession.setActionHandler('play', () => {
          this.resume();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          this.pause();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          this.next();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          this.previous();
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime != null) {
            this.seekTo(details.seekTime);
          }
        });
      } catch (e) {
        // Ignora navegadores com suporte parcial
      }
    }
  }

  private setupWebListeners() {
    if (!this.webAudio) return;

    // Sincronização em tempo real de reprodução e estado do botão via propriedades (idempotente e sem duplicação)
    this.webAudio.onplay = () => {
      this.isPlaying = true;
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      this.notify();
    };

    this.webAudio.onplaying = () => {
      this.isPlaying = true;
      this.isLoading = false;
      this.notify();
    };

    this.webAudio.onpause = () => {
      // Se não estiver realmente pausado (ex: buffer ou troca de faixa), não marca como pausado
      if (this.webAudio && !this.webAudio.paused) return;
      this.isPlaying = false;
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      this.notify();
    };

    this.webAudio.onwaiting = () => {
      this.isLoading = true;
      this.notify();
    };

    this.webAudio.ontimeupdate = () => {
      if (this.webAudio) {
        this.currentTime = this.webAudio.currentTime;
        if (!isNaN(this.webAudio.duration) && this.webAudio.duration > 0) {
          this.duration = this.webAudio.duration;
        }

        // Garante que o status reflete a realidade do elemento de áudio
        const realmenteTocando = !this.webAudio.paused && !this.webAudio.ended;
        if (this.isPlaying !== realmenteTocando) {
          this.isPlaying = realmenteTocando;
        }

        // Detecção de fim de música antecipada para gapless
        if (
          this.duration > 2 &&
          this.currentTime >= this.duration - 0.4 &&
          !this.isEnding
        ) {
          this.handleTrackEnded();
        }

        this.notify();
      }
    };

    this.webAudio.onloadedmetadata = () => {
      if (this.webAudio && !isNaN(this.webAudio.duration)) {
        this.duration = this.webAudio.duration;
        this.isLoading = false;
        this.notify();
      }
    };

    this.webAudio.onended = () => {
      this.handleTrackEnded();
    };

    this.webAudio.onerror = (e) => {
      console.warn('Erro no elemento de áudio web:', e);
      this.isLoading = false;
      this.isPlaying = false;
      this.notify();
    };
  }

  private iniciarMonitoramentoNativo() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (this.nativePlayer) {
        try {
          this.currentTime = this.nativePlayer.currentTime || 0;
          if (this.nativePlayer.duration && this.nativePlayer.duration > 0) {
            this.duration = this.nativePlayer.duration;
          }
          this.isPlaying = this.nativePlayer.playing;

          // Se terminou de tocar nativo
          if (
            this.duration > 2 &&
            this.currentTime >= this.duration - 0.5 &&
            !this.isEnding
          ) {
            this.handleTrackEnded();
          }

          this.notify();
        } catch {
          // ignore
        }
      } else {
        clearInterval(this.timer);
      }
    }, 400);
  }
}

export const playerManager = new PlayerManager();
