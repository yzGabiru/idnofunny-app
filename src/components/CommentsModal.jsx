import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, 
  IonList, IonItem, IonLabel, IonFooter, IonInput, IonIcon, IonAvatar,
  IonSpinner, IonAlert
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { closeOutline, send, heartOutline, heart, trashOutline, chevronDownOutline, chevronUpOutline, personCircleOutline, arrowUndoOutline } from 'ionicons/icons';
import api from '../services/api';
import { formatRelativeTime } from '../utils/time';

// --- SUB-COMPONENT: Recursive Comment Node ---
const CommentNode = ({ comment, onReply, onLike, onDelete, onProfileClick, currentUserId, depth = 0 }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isReply = !!comment.parent_id;
  const isMyComment = currentUserId === comment.owner_username;
  const hasChildren = comment.children && comment.children.length > 0;
  
  const isDeletedUser = comment.owner_username && comment.owner_username.includes('Usuário Deletado');
  const displayUsername = isDeletedUser ? 'Usuário Deletado' : comment.owner_username;
  const canClickProfile = !isDeletedUser;

  // Visual indentation logic (cap at depth 3 to avoid squishing)
  const indentation = depth > 0 ? 20 : 0; 
  const borderStyle = depth > 0 ? '2px solid #333' : 'none';

  // --- DELETE LOGIC ---
  const createdTime = new Date(comment.created_at).getTime();
  const now = new Date().getTime();
  const tenMinutesInMs = 10 * 60 * 1000;
  const isTooOld = (now - createdTime) > tenMinutesInMs;
  
  const canDelete = isMyComment && !hasChildren && !isTooOld;

  return (
    <div style={{ 
      marginLeft: depth > 0 ? '10px' : '0', 
      borderLeft: depth > 0 ? '1px solid #444' : 'none',
      paddingLeft: depth > 0 ? '10px' : '0',
      marginBottom: '10px'
    }}>
      <IonItem style={{ '--background': 'transparent', '--padding-start': 0, '--inner-padding-end': 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <IonAvatar 
            style={{ 
              width: 32, 
              height: 32, 
              marginTop: '4px', 
              marginRight: '10px', 
              cursor: canClickProfile ? 'pointer' : 'default',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', borderRadius: '50%', background: '#333'
            }}
            onClick={() => canClickProfile && onProfileClick(comment.owner_username)}
          >
             {comment.owner_avatar_url ? (
               <img 
                  src={`${import.meta.env.VITE_API_BASE_URL}${comment.owner_avatar_url}`} 
                  alt="avatar" 
                  style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} 
               />
             ) : isDeletedUser ? (
               <IonIcon icon={personCircleOutline} style={{ fontSize: '32px', color: '#888' }} />
             ) : (
               <img 
                  src={`https://ui-avatars.com/api/?name=${comment.owner_username}&background=random`} 
                  alt="avatar" 
                  style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }}
               />
             )}
          </IonAvatar>
          
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            {/* Bubble */}
            <div style={{ background: '#2a2a2a', borderRadius: '12px', padding: '8px 12px', display: 'inline-block', minWidth: '150px', maxWidth: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: '#eee' }}>
                    {displayUsername}
                  </h3>
                  {hasChildren && (
                    <div onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer', marginLeft: 10 }}>
                       <IonIcon icon={isCollapsed ? chevronDownOutline : chevronUpOutline} size="small" color="medium" />
                    </div>
                  )}
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem', color: '#ddd', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comment.text}</p>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', gap: '15px', paddingLeft: '8px', marginTop: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#888' }}>
                 {formatRelativeTime(comment.created_at)}
              </span>
              
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                onClick={() => onLike(comment.id)}
              >
                <IonIcon 
                  icon={comment.is_liked_by_me ? heart : heartOutline} 
                  style={{ fontSize: '1rem', color: comment.is_liked_by_me ? '#ff4444' : '#aaa' }} 
                />
                {comment.like_count > 0 && (
                  <span style={{ fontSize: '0.7rem', color: '#888' }}>{comment.like_count}</span>
                )}
              </div>

              <div 
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => onReply(comment)}
                aria-label="Responder"
                title="Responder"
              >
                <IonIcon 
                  icon={arrowUndoOutline} 
                  style={{ fontSize: '1rem', color: '#aaa' }} 
                />
              </div>
              {canDelete && (
                  <IonIcon 
                    icon={trashOutline} 
                    style={{ fontSize: '1rem', color: '#666', cursor: 'pointer' }}
                    onClick={() => onDelete(comment.id)}
                  />
              )}
          </div>
        </div>
        </div>
      </IonItem>

      {/* Recursive Children Rendering */}
      {!isCollapsed && hasChildren && (
        <div style={{ marginTop: '5px' }}>
          {comment.children.map(child => (
            <CommentNode 
              key={child.id} 
              comment={child} 
              onReply={onReply} 
              onLike={onLike} 
              onDelete={onDelete} 
              onProfileClick={onProfileClick}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
const CommentsModal = ({ memeId, onCommentAdded, currentUser, onClose }) => {
  const history = useHistory();
  const [text, setText] = useState('');
  const [flatComments, setFlatComments] = useState([]); // Raw data from backend
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertHeader, setAlertHeader] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const inputRef = useRef(null);

  // --- 1. Tree Builder Function (Memoized) ---
  const commentTree = useMemo(() => {
    const map = {};
    const roots = [];
    
    // Deep copy to avoid mutating state directly in previous renders
    const comments = flatComments.map(c => ({ ...c, children: [] }));

    // Initialize Map
    comments.forEach(c => {
      map[c.id] = c;
    });

    // Build Tree
    comments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(c);
        // Sort children by like_count desc, then date desc
        map[c.parent_id].children.sort((a, b) => {
          if ((b.like_count || 0) !== (a.like_count || 0)) {
            return (b.like_count || 0) - (a.like_count || 0);
          }
          return new Date(b.created_at) - new Date(a.created_at);
        });
      } else {
        roots.push(c);
      }
    });

    // Sort roots by like_count desc, then date desc
    return roots.sort((a, b) => {
      if ((b.like_count || 0) !== (a.like_count || 0)) {
        return (b.like_count || 0) - (a.like_count || 0);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [flatComments]);

  useEffect(() => {
    if (!memeId) return;
    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/memes/${memeId}`);
        // Ensure we handle null comments
        setFlatComments(res.data.comments || []);
      } catch (error) {
        console.error("Erro ao carregar comentários", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [memeId]);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
        inputRef.current.setFocus();
    }
  }, [replyingTo]);

  const handleSend = async () => {
    if (!text.trim()) return;

    // Construct payload conditionally
    const payload = { text };
    if (replyingTo) {
      payload.parent_id = replyingTo.id;
    }

    try {
      const response = await api.post(`/memes/${memeId}/comments`, payload);
      
      const newComment = {
        ...response.data,
        owner_username: localStorage.getItem('username') || 'Eu',
        // Make sure newly created comments have a timestamp so sort works
        created_at: new Date().toISOString(),
        parent_id: replyingTo ? replyingTo.id : null 
      };
      
      // OPTIMISTIC UPDATE: Add to flat list. The Tree Builder will handle nesting!
      setFlatComments(prev => [...prev, newComment]);
      
      setText('');
      setReplyingTo(null);

      // Notify parent if needed (just passing flat list for count)
      if (onCommentAdded) onCommentAdded(memeId, [...flatComments, newComment]);

    } catch (error) {
      // ... (keeping existing error handling)
      if (error.response && error.response.status === 400) {
        setAlertHeader('Ops!');
        setAlertMessage('Parece que você usou palavras inadequadas. Vamos manter a vibe positiva? 🌸');
        setShowAlert(true);
        const flowers = ['🌸', '🌺', '🌻', '🌹', '🌷'];
        const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
        setText(randomFlower);
      } else if (error.response && error.response.status === 429) {
        setAlertHeader('Calma aí!');
        setAlertMessage('Você está comentando muito rápido. Respire fundo e tente novamente em alguns segundos.');
        setShowAlert(true);
      } else {
        console.error("Erro ao comentar:", error.response?.data || error.message);
      }
    }
  };

  const handleLike = async (commentId) => {
    try {
      const res = await api.post(`/comments/${commentId}/like`);
      setFlatComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, like_count: res.data.total_likes, is_liked_by_me: res.data.liked } : c
      ));
    } catch (e) {
      console.error("Erro ao curtir comentário", e);
    }
  };

  const handleDelete = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      await api.delete(`/comments/${commentToDelete}`);
      setFlatComments(prev => prev.filter(c => c.id !== commentToDelete));
      setShowDeleteAlert(false);
      setCommentToDelete(null);
    } catch (e) {
      console.error("Erro ao deletar", e);
      setShowDeleteAlert(false);
      setCommentToDelete(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '10px 15px', borderBottom: '1px solid #333', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Comentários ({flatComments.length})</h4>
        <IonButton fill="clear" size="small" onClick={onClose}>
            <IonIcon icon={closeOutline} color="medium" />
        </IonButton>
      </div>

      {/* Content */}
      <IonContent className="ion-padding" style={{ flexGrow: 1 }}>
        {loading ? (
           <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
             <IonSpinner name="dots" />
           </div>
        ) : (
          <IonList lines="none">
            {commentTree.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                <p>Seja o primeiro a comentar!</p>
              </div>
            ) : (
              commentTree.map(rootNode => (
                <CommentNode 
                  key={rootNode.id} 
                  comment={rootNode} 
                  onReply={(c) => { setReplyingTo(c); setText(''); }}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onProfileClick={(username) => {
                    history.push(`/users/${username}`);
                    if (onClose) onClose(); // Close modal when navigating
                  }}
                  currentUserId={currentUser?.username || localStorage.getItem('username')}
                />
              ))
            )}
          </IonList>
        )}
      </IonContent>

      {/* Footer Input */}
      <IonFooter translucent={false} style={{ flexShrink: 0 }}>
        {replyingTo && (
            <div style={{ background: '#222', padding: '5px 15px', fontSize: '0.8rem', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                <span>Respondendo a <b>@{replyingTo.owner_username}</b></span>
                <span onClick={() => setReplyingTo(null)} style={{ cursor: 'pointer', color: '#fff' }}>Cancelar</span>
            </div>
        )}
        <IonToolbar style={{ '--background': '#1e1e1e', padding: '0 5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px' }}>
            <IonInput 
              ref={inputRef}
              placeholder={replyingTo ? "Escreva sua resposta..." : "Adicione um comentário..."}
              value={text} 
              onIonChange={e => setText(e.detail.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ 
                  '--background': '#333', 
                  '--color': 'white',
                  '--padding-start': '15px',
                  borderRadius: '20px', 
                  marginRight: '10px',
                  height: '40px'
              }}
            />
            <IonButton fill="clear" onClick={handleSend} color="primary" disabled={!text.trim()}>
              <IonIcon slot="icon-only" icon={send} />
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={alertHeader}
        message={alertMessage}
        buttons={['OK']}
      />

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Excluir Comentário"
        message="Tem certeza que deseja excluir este comentário?"
        buttons={[
          {
            text: 'Não',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              setShowDeleteAlert(false);
              setCommentToDelete(null);
            }
          },
          {
            text: 'Sim',
            cssClass: 'alert-button-confirm',
            handler: confirmDelete
          }
        ]}
      />
    </div>
  );
};

export default CommentsModal;