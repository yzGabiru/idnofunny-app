import React, { useState, useEffect } from 'react';
import { 
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonSpinner, IonModal 
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import api from '../services/api';
import MemeSlide from '../components/MemeSlide';
import CommentsModal from '../components/CommentsModal';
import '../styles/Feed.css'; // Reusing Feed styles for similar look

const MemeDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  
  // Authentication check
  const token = localStorage.getItem('token');
  const currentUserId = localStorage.getItem('username');
  const isAuthenticated = !!token && !!currentUserId;

  const fetchMeme = async () => {
    try {
      const res = await api.get(`/memes/${id}`);
      setMeme(res.data);
    } catch (error) {
      console.error("Erro ao carregar meme", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeme();
  }, [id]);

  const handleLike = async (memeId) => {
    try {
      const response = await api.post(`/memes/${memeId}/like`);
      setMeme(prev => ({
        ...prev,
        like_count: response.data.total_likes,
        is_liked_by_me: response.data.liked
      }));
    } catch (error) {
      console.error("Erro ao curtir:", error);
    }
  };

  const handleFollowToggle = (targetUsername, newStatus) => {
    setMeme(prev => ({
        ...prev,
        owner_is_following: newStatus
    }));
  };

  const handleUnauthorized = () => {
    history.push('/login');
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!meme) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ textAlign: 'center', padding: '20px' }}>Meme não encontrado.</div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      {/* Header Transparente/Fixo para Voltar */}
      <IonHeader className="ion-no-border" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <IonToolbar style={{ '--background': 'transparent' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/feed" color="light" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': '#000' }}>
         <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingTop: 'var(--header-height, 50px)',
            maxHeight: '100vh',
            overflow: 'hidden'
         }}>
            <MemeSlide 
              meme={meme}
              onLike={handleLike}
              onFollowToggle={handleFollowToggle}
              goToDetails={() => {}} // Already details
              goToProfile={(e, username) => {
                  e.stopPropagation();
                  history.push(`/users/${username}`);
              }}
              currentUserId={currentUserId}
              openCommentsModal={() => setIsCommentsOpen(true)}
              isAuthenticated={isAuthenticated}
              onUnauthorized={handleUnauthorized}
            />
         </div>

         {/* Comments Modal */}
         <IonModal 
            isOpen={isCommentsOpen} 
            onDidDismiss={() => setIsCommentsOpen(false)}
            initialBreakpoint={1} 
            breakpoints={[0, 1]} 
            className="comments-sheet-modal"
         >
            <CommentsModal 
                memeId={meme.id} 
                onCommentAdded={(id, comments) => {
                   setMeme(prev => ({ ...prev, comments }));
                }}
                currentUser={{ username: currentUserId }} // Minimal user obj needed
                onClose={() => setIsCommentsOpen(false)}
            />
         </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default MemeDetail;
