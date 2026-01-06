import React, { useRef, useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { IonIcon, IonSpinner } from '@ionic/react';
import { play, pause, volumeHigh, volumeMute, playBack, playForward } from 'ionicons/icons';
import './VideoPlayer.css'; // Vamos criar este CSS inline ou separado depois? Separado é melhor.

const VideoPlayer = ({ src, poster, muted: initialMuted = true }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [showIcon, setShowIcon] = useState(null); // 'play', 'pause', 'forward', 'rewind', 'mute', 'unmute'
  const [isLoading, setIsLoading] = useState(true);

  // Intersection Observer para Autoplay
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.6,
  });

  // Combine refs
  const setRefs = (node) => {
    videoRef.current = node;
    inViewRef(node);
  };

  useEffect(() => {
    if (!videoRef.current) return;

    if (inView) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => console.log("Autoplay blocked or aborted", error));
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [inView]);

  // Gestos e Cliques
  const lastTapRef = useRef(0);
  const timeoutRef = useRef(null);

  const handleTap = (e) => {
    // Impede propagação para não dar conflito com outros handlers (ex: Like do slide)
    e.stopPropagation();

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // X position within element
    const width = rect.width;
    const percentage = x / width;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // --- DOUBLE TAP ---
      clearTimeout(timeoutRef.current);
      lastTapRef.current = 0; // Reset

      if (percentage < 0.3) {
        // Esquerda (0-30%): Voltar 10s
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          flashIcon('rewind');
        }
      } else if (percentage > 0.7) {
        // Direita (70-100%): Avançar 10s
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
          flashIcon('forward');
        }
      } else {
        // Centro: Toggle Mute (Comportamento opcional para double tap no centro, ou ignorar)
        toggleMute();
      }

    } else {
      // --- SINGLE TAP (WAIT) ---
      lastTapRef.current = now;
      timeoutRef.current = setTimeout(() => {
        // Se não houver segundo toque, executa a ação de clique único (Play/Pause no centro)
        // Se o clique for nas bordas, também damos Play/Pause se for single tap, 
        // ou ignoramos? Geralmente single tap em qualquer lugar é toggle play.
        togglePlay();
        lastTapRef.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      flashIcon('play');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      flashIcon('pause');
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
    flashIcon(videoRef.current.muted ? 'mute' : 'unmute');
  };

  const flashIcon = (iconName) => {
    setShowIcon(iconName);
    setTimeout(() => setShowIcon(null), 600);
  };

  const getIcon = () => {
    switch (showIcon) {
      case 'play': return play;
      case 'pause': return pause;
      case 'forward': return playForward;
      case 'rewind': return playBack;
      case 'mute': return volumeMute;
      case 'unmute': return volumeHigh;
      default: return null;
    }
  };

  return (
    <div className="video-container" onClick={handleTap}>
      <video
        ref={setRefs}
        src={src}
        poster={poster}
        className="video-element"
        loop
        muted={isMuted}
        playsInline
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onLoadedData={() => setIsLoading(false)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="video-overlay loading">
           <IonSpinner name="crescent" color="light" />
        </div>
      )}

      {/* Mute Indicator (Static corner icon) */}
      <div className="mute-indicator" onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
        <IonIcon icon={isMuted ? volumeMute : volumeHigh} />
      </div>

      {/* Central Animated Icon */}
      {showIcon && (
        <div className="video-overlay icon-animation">
          <IonIcon icon={getIcon()} />
          {(showIcon === 'forward' || showIcon === 'rewind') && (
            <span className="seek-text">10s</span>
          )}
        </div>
      )}

      {/* Play Button Overlay (Visible when paused and not animating action) */}
      {!isPlaying && !isLoading && !showIcon && (
         <div className="video-overlay paused-overlay">
            <IonIcon icon={play} />
         </div>
      )}
    </div>
  );
};

export default VideoPlayer;
