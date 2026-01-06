import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent, IonPage, IonHeader, IonToolbar,
  IonButton, IonIcon, IonButtons,
  useIonViewWillEnter, IonPopover, IonList, IonItem, IonLabel,
  IonAvatar, IonSpinner, IonModal, IonAlert
} from '@ionic/react';
import { 
  menuOutline, cloudUploadOutline, settingsOutline, logOutOutline,
  personCircleOutline,
  caretDownOutline, checkmarkOutline, closeOutline,
  chevronBackOutline, chevronForwardOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import api from '../services/api';
import MemeSlide from '../components/MemeSlide';
import CommentsModal from '../components/CommentsModal';
import '../styles/Feed.css';

const Feed = () => {
  const history = useHistory();
  const [memes, setMemes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); 
  const [feedType, setFeedType] = useState('new'); 
  const [loading, setLoading] = useState(false);
  
  const observerRef = useRef(null);
  const containerRef = useRef(null);
  const currentUserId = localStorage.getItem('username');

  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState(null);

  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterPopoverEvent, setFilterPopoverEvent] = useState(null);

  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // --- COMMENTS MODAL STATE ---
  const [selectedMemeId, setSelectedMemeId] = useState(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const handleOpenComments = (memeId) => {
    setSelectedMemeId(memeId);
    setIsCommentsOpen(true);
  };

  // --- NAVIGATION (DESKTOP) ---
  const scrollPrev = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
    }
  };

  // 1. Busca os Memes
  const fetchMemes = async () => {
    setLoading(true); 
    try {
      const response = await api.get(`/memes?sort=${feedType}`);
      setMemes(response.data);
    } catch (error) { 
      console.error(error); 
    } finally {
      setLoading(false);
    }
  };

  // 2. Busca o Usuário (Para pegar a foto)
  const fetchMe = async () => {
    try {
      const res = await api.get('/users/me');
      setCurrentUser(res.data);
    } catch (error) {
      console.error("Erro ao carregar usuário", error);
    }
  };

  useEffect(() => {
    setMemes([]); 
    if (containerRef.current) {
       containerRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
    fetchMemes();
  }, [feedType]);

  useIonViewWillEnter(() => { 
    fetchMemes();
    fetchMe();
  });

  useIonViewWillEnter(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const memeId = entry.target.dataset.id;
          api.post(`/memes/${memeId}/view`).catch(err => console.error(err));
          observerRef.current.unobserve(entry.target);
        }
      });
    }, { threshold: 0.7 });
    setTimeout(() => {
      document.querySelectorAll('.meme-slide').forEach(el => observerRef.current.observe(el));
    }, 500);
  });

  const handleLike = async (id) => {
    try {
      const response = await api.post(`/memes/${id}/like`);
      setMemes(memes.map(meme => 
        meme.id === id 
          ? { ...meme, like_count: response.data.total_likes, is_liked_by_me: response.data.liked } 
          : meme
      ));
    } catch (error) { console.error(error); }
  };

  const handleFollow = (targetUsername, newStatus) => {
    setMemes(prevMemes => prevMemes.map(meme => {
      if (meme.owner_username === targetUsername) {
        return { ...meme, owner_is_following: newStatus };
      }
      return meme;
    }));
  };

  const openMenu = (e) => {
    e.persist();
    setPopoverEvent(e);
    setShowPopover(true);
  };

  const getMyAvatar = () => {
    if (currentUser?.avatar_url) {
      return `${import.meta.env.VITE_API_BASE_URL}${currentUser.avatar_url}`;
    }
    const name = currentUser?.username || 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=random&color=fff`;
  };

  const handleLogout = () => {
    setShowPopover(false);
    setShowLogoutAlert(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <IonPage className="feed-page">
      <IonHeader className="ion-no-border">
        <IonToolbar color="transparent" className="feed-toolbar">
          <IonButtons slot="start">
            <IonButton onClick={openMenu} color="light">
              <IonIcon icon={menuOutline} size="large" />
            </IonButton>
          </IonButtons>
          
          {/* --- CENTRAL TITLE DROPDOWN --- */}
          <div 
             style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto', cursor: 'pointer' }}
             onClick={(e) => {
               e.persist();
               setFilterPopoverEvent(e);
               setShowFilterPopover(true);
             }}
          >
            <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '1px', color: '#fff' }}>idno</span>
            <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '1px', color: '#007aff' }}>funny</span>
            <IonIcon icon={caretDownOutline} size="small" style={{ marginLeft: '5px', color: '#fff' }} />
          </div>
          
          <IonButtons slot="end" style={{ width: '48px' }}></IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* --- FILTER POPOVER --- */}
      <IonPopover
        isOpen={showFilterPopover}
        event={filterPopoverEvent}
        onDidDismiss={() => setShowFilterPopover(false)}
        className="filter-popover"
        style={{ '--width': '200px' }}
      >
        <IonList>
          <IonItem button onClick={() => { setFeedType('new'); setShowFilterPopover(false); }}>
            <IonLabel style={{ fontWeight: feedType === 'new' ? 'bold' : 'normal' }}>
           Descobrir🔎
            </IonLabel>
            {feedType === 'new' && <IonIcon slot="end" icon={checkmarkOutline} />}
          </IonItem>
          <IonItem button onClick={() => { setFeedType('top'); setShowFilterPopover(false); }}>
             <IonLabel style={{ fontWeight: feedType === 'top' ? 'bold' : 'normal' }}>
               Top Memes🔥
             </IonLabel>
             {feedType === 'top' && <IonIcon slot="end" icon={checkmarkOutline} />}
          </IonItem>
        </IonList>
      </IonPopover>

      {/* MENU LATERAL (Popover) */}
      <IonPopover 
        isOpen={showPopover} 
        event={popoverEvent} 
        onDidDismiss={() => setShowPopover(false)}
        className="custom-popover"
      >
        <IonList style={{ background: '#1e1e1e' }}>
          {/* Perfil movido para cá */}
          <IonItem button onClick={() => { setShowPopover(false); history.push('/profile'); }}>
             <IonIcon slot="start" icon={personCircleOutline} color="primary" />
             <IonLabel>Meu Perfil</IonLabel>
          </IonItem>
          <IonItem button onClick={() => { setShowPopover(false); history.push('/upload'); }}>
            <IonIcon slot="start" icon={cloudUploadOutline} />
            <IonLabel>Postar Meme</IonLabel>
          </IonItem>
          <IonItem button onClick={() => { setShowPopover(false); history.push('/settings'); }}>
            <IonIcon slot="start" icon={settingsOutline} />
            <IonLabel>Configurações</IonLabel>
          </IonItem>
          <IonItem button onClick={handleLogout}>
            <IonIcon slot="start" icon={logOutOutline} color="danger" />
            <IonLabel color="danger">Sair</IonLabel>
          </IonItem>
        </IonList>
      </IonPopover>

      {/* --- DESKTOP NAVIGATION ARROWS --- */}
      <div className="desktop-nav-btn prev" onClick={scrollPrev}>
        <IonIcon icon={chevronBackOutline} size="large" />
      </div>
      <div className="desktop-nav-btn next" onClick={scrollNext}>
        <IonIcon icon={chevronForwardOutline} size="large" />
      </div>

      {/* CONTEÚDO DO FEED (Horizontal) */}
      <IonContent scrollX={true} scrollY={false} className="horizontal-feed">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" color="light" />
          </div>
        ) : (
          <div className="feed-track" ref={containerRef}>
            {memes.map((meme) => (
              <MemeSlide 
                key={meme.id} 
                meme={meme} 
                onLike={handleLike}
                onFollowToggle={handleFollow} 
                goToDetails={(id) => history.push(`/meme/${id}`)}
                goToProfile={(e, username) => {
                  e.stopPropagation();
                  history.push(`/users/${username}`);
                }}
                openCommentsModal={handleOpenComments}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </IonContent>

      {/* --- SWIPE UP COMMENTS MODAL --- */}
      <IonModal 
        isOpen={isCommentsOpen} 
        onDidDismiss={() => setIsCommentsOpen(false)}
        initialBreakpoint={1} 
        breakpoints={[0, 1]} 
        className="comments-sheet-modal"
      >
         <CommentsModal 
            memeId={selectedMemeId} 
            onCommentAdded={(id, comments) => {
               setMemes(prev => prev.map(m => m.id === id ? { ...m, comments } : m));
            }}
            currentUser={currentUser}
            onClose={() => setIsCommentsOpen(false)}
         />
      </IonModal>

      <IonAlert
        isOpen={showLogoutAlert}
        onDidDismiss={() => setShowLogoutAlert(false)}
        header="Sair"
        message="Tem certeza que deseja sair?"
        buttons={[
          {
            text: 'Não',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => setShowLogoutAlert(false)
          },
          {
            text: 'Sim',
            cssClass: 'alert-button-confirm',
            handler: confirmLogout
          }
        ]}
      />

    </IonPage>
  );
};

export default Feed;
