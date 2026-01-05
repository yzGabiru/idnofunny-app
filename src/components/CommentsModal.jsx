import React, { useState, useEffect } from 'react';
import { 
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, 
  IonList, IonItem, IonLabel, IonFooter, IonInput, IonIcon, IonAvatar
} from '@ionic/react';
import { closeOutline, send } from 'ionicons/icons';
import api from '../services/api';

const CommentsModal = ({ isOpen, onClose, meme, onCommentAdded }) => {
  const [text, setText] = useState('');
  const [localComments, setLocalComments] = useState([]);

  // Atualiza a lista local sempre que o meme mudar
  useEffect(() => {
    if (meme && meme.comments) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalComments(meme.comments);
    }
  }, [meme]);

  const handleSend = async () => {
    if (!text.trim()) return;

    try {
      const response = await api.post(`/memes/${meme.id}/comments`, { text });
      
      const newComment = {
        ...response.data,
        owner_username: localStorage.getItem('username') || 'Eu'
      };
      
      // Adiciona o novo comentário no topo
      const updatedList = [newComment, ...localComments];
      setLocalComments(updatedList);
      setText('');

      // Avisa o Feed para atualizar o contador
      if (onCommentAdded) onCommentAdded(meme.id, updatedList);

    } catch (error) {
      console.error("Erro ao comentar:", error);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Comentários</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList lines="none">
          {localComments.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
              <p>Seja o primeiro a comentar!</p>
            </div>
          ) : (
            localComments.map((comment, index) => (
              <div 
                key={comment.id || index} 
                style={{ 
                  marginLeft: comment.parent_id ? '40px' : '0', 
                  borderLeft: comment.parent_id ? '2px solid #333' : 'none',
                  marginBottom: '10px'
                }}
              >
                <IonItem>
                  <IonAvatar slot="start" style={{ width: 30, height: 30 }}>
                    <img src={`https://ui-avatars.com/api/?name=${comment.owner_username}&background=random`} alt="avatar" />
                  </IonAvatar>
                  <IonLabel className="ion-text-wrap">
                    <h3>
                      <span style={{ fontWeight: 'bold', marginRight: '5px' }}>
                        @{comment.owner_username}
                      </span>
                      <small style={{ opacity: 0.6, fontSize: '0.8em' }}>
                         {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Agora'}
                      </small>
                    </h3>
                    <p>{comment.text}</p>
                  </IonLabel>
                </IonItem>
              </div>
            ))
          )}
        </IonList>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
            <IonInput 
              placeholder="Adicione um comentário..." 
              value={text} 
              onIonChange={e => setText(e.detail.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <IonButton fill="clear" onClick={handleSend}>
              <IonIcon slot="icon-only" icon={send} />
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default CommentsModal;