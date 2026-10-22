import { useEffect, useState } from 'react';
import { playerManager, PlayerStatus } from '../services/playerManager';
import { ItemMusica } from '../services/musicaApi';

export function usePlayer(token?: string | null) {
  const [status, setStatus] = useState<PlayerStatus>(playerManager.getStatus());

  useEffect(() => {
    if (token) {
      playerManager.setToken(token);
    }
    const unsubscribe = playerManager.subscribe((novoStatus) => {
      setStatus(novoStatus);
    });

    return unsubscribe;
  }, [token]);

  return {
    ...status,
    play: (track: ItemMusica, queue?: ItemMusica[]) => {
      if (queue && queue.length > 0) {
        playerManager.setQueue(queue);
      }
      return playerManager.play(track, token);
    },
    pause: () => playerManager.pause(),
    resume: () => playerManager.resume(),
    togglePlayPause: () => playerManager.togglePlayPause(),
    seekTo: (segundos: number) => playerManager.seekTo(segundos),
    setVolume: (vol: number) => playerManager.setVolume(vol),
    toggleLoop: () => playerManager.toggleLoop(),
    toggleShuffle: () => playerManager.toggleShuffle(),
    addToQueue: (track: ItemMusica) => playerManager.addToQueue(track),
    playNextInQueue: (track: ItemMusica) => playerManager.playNextInQueue(track),
    setQueue: (tracks: ItemMusica[]) => playerManager.setQueue(tracks),
    setDefaultTrackIfEmpty: (track: ItemMusica) => playerManager.setDefaultTrackIfEmpty(track),
    next: () => playerManager.next(),
    previous: () => playerManager.previous(),
  };
}
