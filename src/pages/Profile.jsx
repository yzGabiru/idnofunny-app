import React, { useState, useEffect, useRef } from 'react';
import { 
  IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonAvatar, IonSegment, IonSegmentButton, IonGrid, IonRow, IonCol, IonImg,
  IonIcon, IonButton, IonRefresher, IonRefresherContent, IonSpinner, IonToast
} from '@ionic/react';
import { 
  imagesOutline, heartOutline, chatboxOutline, logOutOutline, personAddOutline, 
  checkmarkOutline, cameraOutline 
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const history = useHistory();
  const { username } = useParams();
  const fileInputRef = useRef(null); // Referência para o input de arquivo oculto
  
  const [profile, setProfile] = useState(null);
  const [selectedTab, setSelectedTab] = useState('memes');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [uploading, setUploading] = useState(false); // Estado de carregamento do upload

  const isMyProfile = !username || username === localStorage.getItem('username');

  const fetchProfile = async () => {
    try {
      const endpoint = username ? `/users/${username}` : '/users/me';
      const res = await api.get(endpoint);
      setProfile(res.data);
    } catch (error) {
      console.error("Erro ao carregar perfil", error);
    }
  };

  const fetchTabContent = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const endpoint = `/users/${profile.username}/${selectedTab}`;
      const res = await api.get(endpoint);
      setItems(res.data);
    } catch (error) {
      console.error(`Erro ao carregar ${selectedTab}`, error);
      setItems([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await api.post(`/users/${profile.username}/follow`);
      setProfile(prev => ({
        ...prev,
        is_following: res.data.is_following,
        followers_count: res.data.is_following ? prev.followers_count + 1 : prev.followers_count - 1
      }));
      setToastMessage(res.data.message);
    } catch (error) {
      console.error("Erro ao seguir", error);
    }
  };

  // --- NOVA FUNÇÃO: UPLOAD DE FOTO ---
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Envia para o backend
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Atualiza o perfil localmente com a nova URL recebida
      setProfile(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
      setToastMessage("Foto de perfil atualizada! 📸");
    } catch (error) {
      console.error(error);
      setToastMessage("Erro ao enviar foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    history.push('/login');
    window.location.reload(); 
  };

  const doRefresh = async (event) => {
    await fetchProfile();
    await fetchTabContent();
    event.detail.complete();
  };

  // Helper para decidir qual imagem mostrar (Backend ou UI Avatars)
  const getAvatarSource = () => {
    if (profile?.avatar_url) {
      return `${import.meta.env.VITE_API_BASE_URL}${profile.avatar_url}`;
    }
    return `https://ui-avatars.com/api/?name=${profile?.username}&background=random`;
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (profile) fetchTabContent();
  }, [selectedTab, profile]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/feed" />
          </IonButtons>
          <IonTitle>@{profile?.username}</IonTitle>
          <IonButtons slot="end">
            {isMyProfile && (
              <IonButton onClick={handleLogout}>
                <IonIcon icon={logOutOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {profile && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 10px', background: '#1a1a1a' }}>
            
            {/* --- ÁREA DO AVATAR COM BOTÃO DE EDIÇÃO --- */}
            <div style={{ position: 'relative' }}>
              <IonAvatar 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  marginBottom: '10px', 
                  border: '2px solid #5b4ddb',
                  opacity: uploading ? 0.5 : 1 
                }}
              >
                <img 
                  src={getAvatarSource()} 
                  alt="Avatar" 
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </IonAvatar>

              {/* Botão de Câmera (Só aparece se for meu perfil) */}
              {isMyProfile && (
                <div 
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '-5px',
                    background: '#5b4ddb',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '2px solid #1a1a1a',
                    zIndex: 10
                  }}
                >
                  {uploading ? (
                    <IonSpinner name="crescent" style={{ width: '15px', height: '15px', color: 'white' }} />
                  ) : (
                    <IonIcon icon={cameraOutline} style={{ fontSize: '16px', color: '#fff' }} />
                  )}
                </div>
              )}
              
              {/* Input Invisível para abrir a galeria */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>

            <h2 style={{ fontSize: '1.2rem', margin: '5px 0' }}>{profile.username}</h2>
            
            {!isMyProfile && (
              <IonButton 
                size="small" 
                fill={profile.is_following ? "outline" : "solid"} 
                color={profile.is_following ? "medium" : "primary"}
                onClick={handleFollow}
                style={{ marginTop: 5, marginBottom: 15 }}
              >
                <IonIcon slot="start" icon={profile.is_following ? checkmarkOutline : personAddOutline} />
                {profile.is_following ? "Seguindo" : "Seguir"}
              </IonButton>
            )}

            {/* ESTATÍSTICAS */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '5px', justifyContent: 'center', color: '#ccc', fontSize: '0.9rem' }}>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '1.1rem', color: '#fff' }}>{profile.memes_count}</strong> Posts
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '1.1rem', color: '#fff' }}>{profile.total_likes || 0}</strong> Likes
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '1.1rem', color: '#fff' }}>{profile.followers_count}</strong> Fãs
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ display: 'block', fontSize: '1.1rem', color: '#fff' }}>{profile.following_count}</strong> Seg.
              </div>
            </div>
          </div>
        )}

        <IonSegment value={selectedTab} onIonChange={e => setSelectedTab(e.detail.value)} style={{ background: '#000' }}>
          <IonSegmentButton value="memes">
            <IonIcon icon={imagesOutline} />
          </IonSegmentButton>
          <IonSegmentButton value="likes">
            <IonIcon icon={heartOutline} />
          </IonSegmentButton>
          <IonSegmentButton value="comments">
            <IonIcon icon={chatboxOutline} />
          </IonSegmentButton>
        </IonSegment>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}><IonSpinner /></div>
        ) : (
          <IonGrid style={{ padding: '1px' }}> 
            <IonRow>
              {items.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666', width: '100%' }}>
                  <p>Nenhum item encontrado.</p>
                </div>
              )}
              
              {selectedTab !== 'comments' ? (
                // GRADE DE FOTOS
                items.map((item) => (
                  <IonCol 
                    size="4"       
                    size-md="3"    
                    key={item.id} 
                    style={{ padding: '1px' }} 
                  >
                    <div 
                      onClick={() => history.push(`/meme/${item.id}`)}
                      style={{ 
                        width: '100%', 
                        aspectRatio: '1/1',    
                        position: 'relative', 
                        backgroundColor: '#222',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }} 
                    >
                      <IonImg 
                        src={`${import.meta.env.VITE_API_BASE_URL}${item.image_url}`} 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </IonCol>
                ))
              ) : (
                // LISTA DE COMENTÁRIOS
                items.map((comment) => (
                  <IonCol size="12" key={comment.id}>
                    <div 
                      onClick={() => history.push(`/meme/${comment.meme_id}`)}
                      style={{ padding: '15px', borderBottom: '1px solid #333', cursor: 'pointer', background: '#111' }}
                    >
                      <p style={{ margin: 0, fontStyle: 'italic', color: '#ddd' }}>"{comment.text}"</p>
                      <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Ver no meme original</small>
                    </div>
                  </IonCol>
                ))
              )}
            </IonRow>
          </IonGrid>
        )}

        <IonToast isOpen={!!toastMessage} message={toastMessage} duration={2000} onDidDismiss={() => setToastMessage('')} />

      </IonContent>
    </IonPage>
  );
};

export default Profile;