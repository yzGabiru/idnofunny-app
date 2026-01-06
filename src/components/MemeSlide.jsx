import React, { useState, useEffect, useRef } from 'react';
import { 
  IonAvatar, IonButton, IonIcon, IonToast, IonActionSheet, 
  IonCard, IonCardHeader, IonCardContent, IonCardSubtitle, useIonToast 
} from '@ionic/react';
import { 
  heart, heartOutline, chatbubbleOutline, shareSocialOutline, 
  ellipsisHorizontal, downloadOutline, copyOutline, alertCircleOutline,
  eyeOutline, personCircleOutline 
} from 'ionicons/icons';
import { formatRelativeTime } from '../utils/time';
import api from '../services/api';
import VideoPlayer from './VideoPlayer';

const MemeSlide = ({ meme, onLike, onFollowToggle, goToDetails, goToProfile, currentUserId, openCommentsModal, isAuthenticated = true, onUnauthorized }) => {
  const [isFollowing, setIsFollowing] = useState(meme.owner_is_following);
  const [followLoading, setFollowLoading] = useState(false);
  const [presentToast] = useIonToast();
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    setIsFollowing(meme.owner_is_following);
  }, [meme.owner_is_following]);

  const checkAuth = () => {
    if (!isAuthenticated) {
      if (onUnauthorized) onUnauthorized();
      return false;
    }
    return true;
  };

  const handleFollow = async () => {
    if (!checkAuth()) return;
    if (followLoading) return;
    setFollowLoading(true);
    const newStatus = !isFollowing;
    setIsFollowing(newStatus); 

    try {
      await api.post(`/users/${meme.owner_username}/follow`);
      if (onFollowToggle) {
        onFollowToggle(meme.owner_username, newStatus);
      }
    } catch (error) {
      console.error("Erro ao seguir", error);
      setIsFollowing(!newStatus);
    } finally {
      setFollowLoading(false);
    }
  };

  // --- ACTIONS (Action Sheet) ---
  const downloadImage = async () => {
    if (!checkAuth()) return;

    // Check if it's a video
    const isVideoFile = meme.media_type === 'video' || (meme.image_url && /\.(mp4|mov|webm)$/i.test(meme.image_url));
    if (isVideoFile) {
      presentToast({ message: 'Download de vídeos não suportado ainda.', duration: 2000, color: 'warning' });
      return;
    }

    try {
      const imageUrl = `${import.meta.env.VITE_API_BASE_URL}${meme.image_url}`;
      let img;

      // Try with fetch first (better for CORS)
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Fetch failed');
        const blob = await response.blob();
        img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });
      } catch (fetchError) {
        // Fallback: try with crossOrigin
        console.log('Fetch failed, trying with crossOrigin...');
        img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });
      }

      // Setup Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const stripHeight = 50; // Altura da faixa preta

      canvas.width = img.width;
      canvas.height = img.height + stripHeight;

      // Draw Image
      ctx.drawImage(img, 0, 0);

      // Draw Black Strip
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, img.height, canvas.width, stripHeight);

      // Draw Text "IDNOFunny" (Left)
      const fontSize = 24;
      ctx.font = `bold ${fontSize}px sans-serif`;
      const padding = 20;
      const textY = img.height + 33; // Centralizado verticalmente na faixa

      // "IDNO" (White)
      ctx.fillStyle = '#ffffff';
      ctx.fillText('IDNO', padding, textY);

      const idnoWidth = ctx.measureText('IDNO').width;

      // "Funny" (Blue)
      ctx.fillStyle = '#007aff';
      ctx.fillText('Funny', padding + idnoWidth, textY);

      // Draw Text "idnofunnybr.com.br" (Right)
      ctx.fillStyle = '#ffffff';
      const rightText = 'idnofunnybr.com.br';
      const rightTextWidth = ctx.measureText(rightText).width;
      ctx.fillText(rightText, canvas.width - rightTextWidth - padding, textY);

      // Trigger Download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Falha ao criar blob da imagem');
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `idnofunny-${meme.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Clean up object URL if created from blob
        if (img.src.startsWith('blob:')) {
          URL.revokeObjectURL(img.src);
        }

        presentToast({ message: 'Imagem baixada com sucesso!', duration: 2000, color: 'success' });
      }, 'image/jpeg', 0.9);

    } catch (e) {
      console.error("Erro ao baixar imagem com marca d'água", e);
      presentToast({ message: 'Erro ao gerar imagem. Verifique sua conexão.', duration: 2500, color: 'danger' });
    }
  };

  const copyLink = async () => {
    if (!checkAuth()) return;
    const link = `${window.location.origin}/meme/${meme.id}`;
    try {
      await navigator.clipboard.writeText(link);
      presentToast({ message: 'Link copiado!', duration: 2000, color: 'primary' });
    } catch (err) {
      console.error('Erro ao copiar', err);
    }
  };

  const reportMeme = async () => {
    if (!checkAuth()) return;
    try {
      // Mock report
      await new Promise(r => setTimeout(r, 500));
      presentToast({ message: 'Denúncia enviada. Obrigado.', duration: 3000, color: 'success' });
    } catch (e) {
      presentToast({ message: 'Erro ao denunciar.', duration: 2000, color: 'danger' });
    }
  };

  // --- DOUBLE TAP LOGIC ---
  const [showHeart, setShowHeart] = useState(false);
  
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!checkAuth()) return;
    onLike(meme.id);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const lastTapRef = useRef(0);
  const handleTouchEnd = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      handleDoubleClick(e);
    }
    lastTapRef.current = now;
  };

  const isMyMeme = currentUserId === meme.owner_username;

  // --- DELETED USER LOGIC ---
  const isDeletedUser = meme.owner_username && meme.owner_username.includes('Usuário Deletado');
  const displayUsername = isDeletedUser ? 'Usuário Deletado' : meme.owner_username;
  const canGoToProfile = !isDeletedUser && goToProfile;

  // --- MEDIA TYPE DETECTION ---
  const isVideo = meme.media_type === 'video' || (meme.image_url && /\.(mp4|mov|webm)$/i.test(meme.image_url));

  return (
    <div className="meme-slide" data-id={meme.id} style={{ backgroundColor: 'transparent', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>

      {/* --- CARD STRUCTURE --- */}
      <div className="meme-card" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', overflow: 'hidden' }}>

        {/* HEADER */}
        <IonCardHeader style={{ padding: '10px 15px', paddingBottom: 5, flexShrink: 0, minHeight: 'fit-content', background: 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                onClick={(e) => canGoToProfile && goToProfile(e, meme.owner_username)}
                style={{ 
                  width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', 
                  background: '#333', border: '1px solid #444', 
                  cursor: canGoToProfile ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {meme.owner_avatar_url ? (
                   <img src={`${import.meta.env.VITE_API_BASE_URL}${meme.owner_avatar_url}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : isDeletedUser ? (
                   <IonIcon icon={personCircleOutline} style={{ fontSize: '36px', color: '#999' }} />
                ) : (
                   <img src={`https://ui-avatars.com/api/?name=${meme.owner_username}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span
                   onClick={(e) => canGoToProfile && goToProfile(e, meme.owner_username)}
                   style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#f5f5f5', cursor: canGoToProfile ? 'pointer' : 'default' }}
                 >
                   @{displayUsername}
                 </span>

                 {/* FOLLOW BUTTON - Hide if deleted */}
                 {!isMyMeme && !isDeletedUser && (
                   <span
                      onClick={(e) => { e.stopPropagation(); handleFollow(); }}
                      style={{
                        color: isFollowing ? '#999' : 'var(--ion-color-primary)',
                        fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', marginTop: '2px', letterSpacing: '0.5px'
                      }}
                   >
                     {isFollowing ? 'SEGUINDO' : 'SEGUIR'}
                   </span>
                 )}
              </div>

              {/* Views Count (Header) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px', opacity: 0.7 }}>
                 <IonIcon icon={eyeOutline} style={{ fontSize: '14px', color: '#ddd' }} />
                 <span style={{ fontSize: '0.8rem', color: '#ddd' }}>{meme.views || 0}</span>
              </div>
            </div>

            {/* 3 Dots */}
            <IonButton fill="clear" color="medium" onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={ellipsisHorizontal} />
            </IonButton>
          </div>
        </IonCardHeader>

        {/* IMAGE/VIDEO CONTENT */}
        <IonCardContent style={{ padding: 0, flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0, overflow: 'hidden', background: 'transparent' }}>
            <div
              style={{ width: '100%', flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onDoubleClick={!isVideo ? handleDoubleClick : undefined} // Only double click like for images
              onTouchEnd={!isVideo ? handleTouchEnd : undefined}
            >
              {isVideo ? (
                <VideoPlayer 
                  src={`${import.meta.env.VITE_API_BASE_URL}${meme.image_url}`} 
                  poster={`${import.meta.env.VITE_API_BASE_URL}${meme.image_url}?thumb=true`} // Optional thumb
                />
              ) : (
                <>
                  <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${meme.image_url}`}
                      alt={meme.title}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                  />
                  {/* Double Click Heart Animation */}
                  {showHeart && (
                    <div className="double-click-heart">
                      <IonIcon icon={heart} color="danger" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Título - sempre visível acima da barra fixa */}
            <div style={{
              padding: '10px 15px',
              flexShrink: 0,
              background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
              minHeight: '45px',
              display: 'flex',
              alignItems: 'center'
            }}>
               <h3 style={{
                 margin: 0,
                 fontSize: '1rem',
                 color: '#f5f5f5',
                 fontWeight: '500',
                 overflow: 'hidden',
                 textOverflow: 'ellipsis',
                 whiteSpace: 'nowrap',
                 textShadow: '0 1px 4px rgba(0,0,0,0.8)'
               }}>{meme.title}</h3>
            </div>
        </IonCardContent>
      </div>

      {/* FOOTER ACTIONS - FIXED AT BOTTOM */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0',
        borderTop: '1px solid #222',
        background: '#121212',
        zIndex: 10
      }}>

        <IonButton fill="clear" onClick={() => checkAuth() && onLike(meme.id)}>
          <IonIcon
            icon={meme.is_liked_by_me ? heart : heartOutline}
            color={meme.is_liked_by_me ? 'danger' : 'medium'}
            size="large"
          />
          <span style={{ marginLeft: 6, color: '#e0e0e0', fontSize: '0.9rem' }}>{meme.like_count}</span>
        </IonButton>

        <IonButton fill="clear" onClick={() => checkAuth() && openCommentsModal(meme.id)}>
          <IonIcon icon={chatbubbleOutline} color="medium" size="large" />
          <span style={{ marginLeft: 6, color: '#e0e0e0', fontSize: '0.9rem' }}>{meme.comments ? meme.comments.length : 0}</span>
        </IonButton>

        <IonButton fill="clear" onClick={copyLink}>
          <IonIcon icon={shareSocialOutline} color="medium" size="large" />
        </IonButton>
      </div>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          { text: 'Baixar Imagem', icon: downloadOutline, handler: downloadImage },
          { text: 'Copiar Link', icon: copyOutline, handler: copyLink },
          { text: 'Denunciar', icon: alertCircleOutline, role: 'destructive', handler: reportMeme },
          { text: 'Cancelar', role: 'cancel' }
        ]}
      />
    </div>
  );
};

export default MemeSlide;
