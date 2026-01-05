import React, { useState, useEffect } from 'react';
import { IonAvatar, IonButton, IonIcon, IonToast } from '@ionic/react';
import { heart, heartOutline, chatbubbleOutline, shareSocialOutline } from 'ionicons/icons';
import { formatRelativeTime } from '../utils/time';
import api from '../services/api';

const MemeSlide = ({ meme, onLike, onFollowToggle, goToDetails, goToProfile, currentUserId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(meme.owner_is_following);
  const [followLoading, setFollowLoading] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    setIsFollowing(meme.owner_is_following);
  }, [meme.owner_is_following]);

  const handleFollow = async () => {
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

  const handleShare = async () => {
    const link = `${window.location.origin}/meme/${meme.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setShowShareToast(true);
    } catch (err) {
      console.error('Erro ao copiar', err);
    }
  };

  const isMyMeme = currentUserId === meme.owner_username;

  // Lógica para definir qual avatar mostrar
  const avatarSrc = meme.owner_avatar_url 
    ? `${import.meta.env.VITE_API_BASE_URL}${meme.owner_avatar_url}`
    : `https://ui-avatars.com/api/?name=${meme.owner_username}&background=random`;

  return (
    <div className="meme-slide" data-id={meme.id}>
      <div 
        className="meme-image-bg"
        onClick={() => goToDetails(meme.id)}
        style={{ backgroundImage: `url(${import.meta.env.VITE_API_BASE_URL}${meme.image_url})` }} 
      />

      {/* --- HEADER OVERLAY (Topo) --- */}
      <div className="meme-header-overlay">
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IonAvatar 
            style={{ width: 32, height: 32, marginRight: 8, border: '1px solid #fff', cursor: 'pointer' }} 
            onClick={(e) => goToProfile(e, meme.owner_username)}
          >
            {/* MUDANÇA AQUI: Usa a variável avatarSrc e objectFit */}
            <img src={avatarSrc} alt="avatar" style={{ objectFit: 'cover' }} />
          </IonAvatar>
          
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
             <span 
               style={{ fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }} 
               onClick={(e) => goToProfile(e, meme.owner_username)}
             >
               @{meme.owner_username}
             </span>
             <span style={{ fontSize: '0.7rem', opacity: 0.8, color: '#ddd' }}>
               {formatRelativeTime(meme.created_at)}
             </span>
          </div>
        </div>

        {!isMyMeme && (
           <div 
             className={isFollowing ? "following-btn" : "follow-btn"}
             onClick={(e) => { e.stopPropagation(); handleFollow(); }}
           >
             {followLoading ? "..." : (isFollowing ? "Seguindo" : "Seguir")}
           </div>
        )}

      </div>
      
      {/* --- FOOTER OVERLAY (Baixo) --- */}
      <div className="meme-footer-overlay">
        
        <div style={{ paddingBottom: '10px' }}>
           <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 'bold', textShadow: '1px 1px 2px black' }}>{meme.title}</h3>
           
           <div className={`meme-description ${isExpanded ? '' : 'collapsed'}`}>
             {meme.hashtags.map(t => <span key={t.name} style={{color:'#fdd835', marginRight:5, fontWeight: '500'}}>#{t.name}</span>)}
           </div>
           
           {(meme.hashtags.length > 5) && (
             <div className="read-more" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
               {isExpanded ? "Ocultar" : "Ver mais"}
             </div>
           )}
        </div>

        <div className="action-bar-bottom">
           <IonButton fill="clear" color="light" onClick={(e) => { e.stopPropagation(); onLike(meme.id); }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IonIcon icon={meme.is_liked_by_me ? heart : heartOutline} color={meme.is_liked_by_me ? 'danger' : 'light'} size="large" />
                <span style={{fontWeight: '500'}}>{meme.like_count}</span>
              </div>
           </IonButton>

           <IonButton fill="clear" color="light" onClick={() => goToDetails(meme.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IonIcon icon={chatbubbleOutline} size="large" />
                <span style={{fontWeight: '500'}}>{meme.comments ? meme.comments.length : 0}</span>
              </div>
           </IonButton>

           <IonButton fill="clear" color="light" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
              <IonIcon icon={shareSocialOutline} size="large" />
           </IonButton>
        </div>

      </div>

      <IonToast
        isOpen={showShareToast}
        onDidDismiss={() => setShowShareToast(false)}
        message="Link copiado! 🔗"
        duration={1500}
        position="top"
        color="dark"
        style={{ '--border-radius': '20px', marginTop: '40px' }}
      />
    </div>
  );
};

export default MemeSlide;