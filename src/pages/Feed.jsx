import React, { useState, useRef, useEffect } from 'react';
import { 
  IonContent, IonPage, IonHeader, IonToolbar, 
  IonButton, IonIcon, IonButtons, 
  useIonViewWillEnter, IonPopover, IonList, IonItem, IonLabel,
  IonAvatar // <--- Importado
} from '@ionic/react';
import { 
  personCircleOutline, menuOutline, cloudUploadOutline, settingsOutline, logOutOutline,
  chevronBackOutline, chevronForwardOutline 
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import api from '../services/api';
import MemeSlide from '../components/MemeSlide';
import '../styles/Feed.css';

const Feed = () => {
  const history = useHistory();
  const [memes, setMemes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // <--- NOVO: Estado do usuário logado
  
  const observerRef = useRef(null);
  const containerRef = useRef(null);
  const currentUserId = localStorage.getItem('username');

  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState(null);

  // 1. Busca os Memes
  const fetchMemes = async () => {
    try {
      const response = await api.get('/memes');
      setMemes(response.data);
    } catch (error) { console.error(error); }
  };

  // 2. Busca o Usuário (Para pegar a foto) <--- NOVO
  const fetchMe = async () => {
    try {
      const res = await api.get('/users/me');
      setCurrentUser(res.data);
    } catch (error) {
      console.error("Erro ao carregar usuário", error);
    }
  };

  // Carrega tudo ao entrar na tela
  useIonViewWillEnter(() => { 
    fetchMemes();
    fetchMe(); // <--- Chamamos aqui também
  });

  // Lógica do Observer (Views)
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

  // --- NAVEGAÇÃO MANUAL (Setas) ---
  const scrollFeed = (direction) => {
    if (containerRef.current) {
      const container = containerRef.current;
      const width = container.clientWidth; 
      const currentScroll = container.scrollLeft;
      
      const newPosition = direction === 'next' 
        ? currentScroll + width 
        : currentScroll - width;

      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  // --- EVENTOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') scrollFeed('next');
      if (e.key === 'ArrowLeft') scrollFeed('prev');
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleFollowUpdate = (targetUsername, newStatus) => {
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

  // Helper para decidir qual foto mostrar <--- NOVO
  const getMyAvatar = () => {
    if (currentUser?.avatar_url) {
      return `${import.meta.env.VITE_API_BASE_URL}${currentUser.avatar_url}`;
    }
    const name = currentUser?.username || 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=random&color=fff`;
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
          
          {/* --- AQUI ESTÁ A MUDANÇA NO HEADER --- */}
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/profile')} color="light">
              {currentUser ? (
                // Se carregou o usuário, mostra o Avatar
                <IonAvatar style={{ width: '32px', height: '32px', border: '1px solid #fff' }}>
                  <img 
                    src={getMyAvatar()} 
                    alt="Perfil" 
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                </IonAvatar>
              ) : (
                // Fallback enquanto carrega
                <IonIcon icon={personCircleOutline} size="large" />
              )}
            </IonButton>
          </IonButtons>

        </IonToolbar>
      </IonHeader>

      <IonPopover 
        isOpen={showPopover} 
        event={popoverEvent} 
        onDidDismiss={() => setShowPopover(false)}
        className="custom-popover"
      >
        <IonList>
          <IonItem button onClick={() => { setShowPopover(false); history.push('/upload'); }}>
            <IonIcon slot="start" icon={cloudUploadOutline} />
            <IonLabel>Postar Meme</IonLabel>
          </IonItem>
          <IonItem button onClick={() => { setShowPopover(false); history.push('/settings'); }}>
            <IonIcon slot="start" icon={settingsOutline} />
            <IonLabel>Configurações</IonLabel>
          </IonItem>
          <IonItem button onClick={() => { 
             localStorage.clear(); 
             history.push('/login'); 
             window.location.reload(); // Force reload para limpar estados
             setShowPopover(false);
          }}>
            <IonIcon slot="start" icon={logOutOutline} color="danger" />
            <IonLabel color="danger">Sair</IonLabel>
          </IonItem>
        </IonList>
      </IonPopover>

      <div className="desktop-nav-btn nav-prev" onClick={() => scrollFeed('prev')}>
        <IonIcon icon={chevronBackOutline} />
      </div>
      <div className="desktop-nav-btn nav-next" onClick={() => scrollFeed('next')}>
        <IonIcon icon={chevronForwardOutline} />
      </div>

      <IonContent scrollX={true} scrollY={false} className="horizontal-feed">
        <div className="feed-track" ref={containerRef}>
          {memes.map((meme) => (
            <MemeSlide 
              key={meme.id} 
              meme={meme} 
              onLike={handleLike}
              onFollowToggle={handleFollowUpdate} 
              goToDetails={(id) => history.push(`/meme/${id}`)}
              goToProfile={(e, u) => { e.stopPropagation(); history.push(`/users/${u}`); }}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Feed;