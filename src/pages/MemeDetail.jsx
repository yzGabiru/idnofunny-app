import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatRelativeTime } from '../utils/time';
import { 
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
  IonImg, IonCardHeader, IonCardSubtitle, IonCardTitle, IonButton, IonIcon,
  IonFooter, IonInput, IonAvatar, IonNote, IonToast, IonAlert
} from '@ionic/react';
import { 
  heart, heartOutline, chatbubbleOutline, send, arrowUndo, trashOutline, 
  chevronDownOutline, chevronForwardOutline, eyeOutline, shareSocialOutline 
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import api from '../services/api';

const MAX_CHARS = 280;

// --- COMPONENTE DE ITEM DE COMENTÁRIO ---
const CommentItem = ({ comment, repliesMap, handlers, currentUserId, depth = 0 }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const replies = repliesMap[comment.id] || [];
  
  const sortedReplies = [...replies].sort((a, b) => {
    if (b.like_count !== a.like_count) return b.like_count - a.like_count;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  // Avatar do comentário
  const commentAvatarSrc = comment.owner_avatar_url 
    ? `${import.meta.env.VITE_API_BASE_URL}${comment.owner_avatar_url}`
    : `https://ui-avatars.com/api/?name=${comment.owner_username}&background=random`;

  return (
    <div style={{ 
      marginLeft: depth > 0 ? '25px' : '0', 
      borderLeft: depth > 0 ? '2px solid #333' : 'none', 
      paddingLeft: depth > 0 ? '10px' : '0',
      marginBottom: '15px' 
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <IonAvatar 
          style={{ 
            width: 32, height: 32, minWidth: 32, cursor: 'pointer', marginRight: '12px', marginTop: '2px' 
          }} 
          onClick={() => handlers.goToProfile(comment.owner_username)}
        >
           <img src={commentAvatarSrc} alt="avatar" style={{objectFit: 'cover'}} />
        </IonAvatar>
        
        <div style={{ flex: 1, minWidth: 0 }}> 
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span 
              onClick={() => handlers.goToProfile(comment.owner_username)} 
              style={{ fontWeight: 'bold', cursor: 'pointer', marginRight: '8px', color: '#fff', fontSize: '0.95rem' }}
            >
              @{comment.owner_username}
            </span>
            <span style={{ fontSize: '0.75em', color: '#888' }}>
              {handlers.formatTime(comment.created_at)}
            </span>
          </div>

          <p style={{ 
            color: '#ddd', fontSize: '0.95rem', marginTop: '2px', marginBottom: '4px',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '1.4'
          }}>
            {comment.text}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }} onClick={() => handlers.onLike(comment.id)}>
              <IonIcon 
                  icon={comment.is_liked_by_me ? heart : heartOutline} 
                  color={comment.is_liked_by_me ? 'danger' : 'medium'}
                  style={{ fontSize: '1rem' }}
              />
              {comment.like_count > 0 && <span style={{ fontSize: '0.8rem', color: '#888' }}>{comment.like_count}</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }} onClick={() => handlers.onReply(comment)}>
               <IonIcon icon={arrowUndo} size="small" style={{ opacity: 0.6 }} />
               <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Responder</span>
            </div>

            {currentUserId === comment.owner_username && (
               <IonIcon 
                  icon={trashOutline} color="medium" style={{ fontSize: '1rem', cursor: 'pointer' }}
                  onClick={() => handlers.onDelete(comment.id)}
               />
            )}
          </div>

          {sortedReplies.length > 0 && (
            <div 
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px', cursor: 'pointer', color: '#3880ff' }}
            >
              <div style={{ height: '1px', width: '20px', background: '#333' }}></div>
              <IonIcon icon={isCollapsed ? chevronForwardOutline : chevronDownOutline} size="small" />
              <span style={{ fontSize: '0.8rem' }}>
                {isCollapsed ? `Ver ${sortedReplies.length} respostas` : 'Ocultar respostas'}
              </span>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && sortedReplies.map(reply => (
        <CommentItem 
          key={reply.id} comment={reply} repliesMap={repliesMap} handlers={handlers} currentUserId={currentUserId} depth={depth + 1} 
        />
      ))}
    </div>
  );
};


// --- PÁGINA PRINCIPAL ---
const MemeDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const inputRef = useRef(null);
  
  const [meme, setMeme] = useState(null);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showShareToast, setShowShareToast] = useState(false);
  
  // --- NOVOS ESTADOS PARA O ALERT ---
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ header: '', subHeader: '', message: '' });

  const currentUser = localStorage.getItem('username');

  const fetchMeme = async () => {
    try {
      const res = await api.get(`/memes/${id}`);
      setMeme(res.data);
    } catch (error) { console.error("Erro ao carregar meme", error); }
  };

  useEffect(() => { fetchMeme(); }, [id]);

  const { rootComments, repliesMap } = useMemo(() => {
    if (!meme || !meme.comments) return { rootComments: [], repliesMap: {} };
    const map = {};
    const roots = [];
    meme.comments.forEach(c => {
      if (c.parent_id) {
        if (!map[c.parent_id]) map[c.parent_id] = [];
        map[c.parent_id].push(c);
      } else {
        roots.push(c);
      }
    });
    roots.sort((a, b) => {
        if (b.like_count !== a.like_count) return b.like_count - a.like_count;
        return new Date(b.created_at) - new Date(a.created_at);
    });
    return { rootComments: roots, repliesMap: map };
  }, [meme]);

  const handlers = {
    goToProfile: (u) => history.push(`/users/${u}`),
    formatTime: formatRelativeTime,
    onLike: async (cid) => {
      try {
        const res = await api.post(`/comments/${cid}/like`);
        const updatedList = meme.comments.map(c => 
          c.id === cid ? { ...c, like_count: res.data.total_likes, is_liked_by_me: res.data.liked } : c
        );
        setMeme({ ...meme, comments: updatedList });
      } catch (e) { console.error(e); }
    },
    onDelete: async (cid) => {
      if (!window.confirm("Apagar comentário?")) return;
      try {
        await api.delete(`/comments/${cid}`);
        const filtered = meme.comments.filter(c => c.id !== cid);
        setMeme({ ...meme, comments: filtered });
      // eslint-disable-next-line no-unused-vars
      } catch (e) { alert("Erro ao deletar"); }
    },
    onReply: (comment) => {
      setReplyingTo(comment);
      setTimeout(() => inputRef.current?.setFocus(), 100);
    }
  };

  const handleMemeLike = async () => {
    const res = await api.post(`/memes/${id}/like`);
    setMeme({ ...meme, like_count: res.data.total_likes, is_liked_by_me: res.data.liked });
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/meme/${meme.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setShowShareToast(true);
    } catch (err) {
      console.error('Falha ao copiar', err);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    if (text.length > MAX_CHARS) {
      setErrorMsg(`Texto muito longo! O limite é ${MAX_CHARS} caracteres.`);
      return;
    }

    try {
      const payload = { text, parent_id: replyingTo?.id || null };
      await api.post(`/memes/${id}/comments`, payload);
      setText(''); setReplyingTo(null); fetchMeme(); 
    } catch (error) { 
      console.error(error);
      if (error.response) {
        const status = error.response.status;
        
        // 400 = Bad Request (Provavelmente Profanidade/Palavrão detectado pelo Backend)
        if (status === 400) {
          setAlertInfo({
            header: '🚫 Opa! Calma lá...',
            subHeader: 'Linguagem Imprópria',
            message: 'Detectamos palavras ofensivas no seu comentário. Por favor, mantenha o ambiente amigável para todos!'
          });
          setShowAlert(true);

          // Substitui o palavrão por uma flor
          const flowers = ['🌸', '🌺', '🌹', '🌻', '🌼', '🌷', '💐', '🪷', '🥀'];
          const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
          setText(randomFlower);
        } 
        
        // 429 = Too Many Requests (Spam)
        else if (status === 429) {
          setAlertInfo({
            header: '⏳ Você está indo rápido demais!',
            subHeader: 'Anti-Spam Ativado',
            message: 'Aguarde alguns segundos antes de comentar novamente.'
          });
          setShowAlert(true);
        }

        // Outros erros
        else {
           setErrorMsg('Erro ao enviar comentário. Tente novamente.');
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      handleSend();
    }
  };

  if (!meme) return <IonPage><IonContent>Carregando...</IonContent></IonPage>;

  // Avatar do dono do POST
  const ownerAvatarSrc = meme.owner_avatar_url 
    ? `${import.meta.env.VITE_API_BASE_URL}${meme.owner_avatar_url}`
    : `https://ui-avatars.com/api/?name=${meme.owner_username}&background=random`;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/feed" /></IonButtons>
          
          <div 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} 
            onClick={() => handlers.goToProfile(meme.owner_username)}
          >
            <IonAvatar style={{ width: 30, height: 30, marginRight: 10, marginLeft: 5 }}>
               <img src={ownerAvatarSrc} alt="avatar" style={{objectFit: 'cover'}} />
            </IonAvatar>
            <IonTitle style={{ paddingLeft: 0, fontSize: '1rem' }}>
               @{meme.owner_username}
            </IonTitle>
          </div>

        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        
        <div style={{
          width: '100%',
          height: '400px',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '15px'
        }}>
          <img 
            src={`${import.meta.env.VITE_API_BASE_URL}${meme.image_url}`} 
            alt="Meme"
            style={{ 
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }} 
          />
        </div>
        
        <IonCardHeader>
          <IonCardTitle>{meme.title}</IonCardTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#888', fontSize: '0.9rem' }}>
             <span>{meme.category?.name}</span>
             <div style={{ display: 'flex', gap: '15px' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <IonIcon icon={eyeOutline} /> {meme.views || 0}
               </span>
               <span>{formatRelativeTime(meme.created_at)}</span>
             </div>
          </div>
          <IonCardSubtitle style={{ marginTop: '5px' }}>
            {meme.hashtags.map(tag => <span key={tag.name} style={{ color: '#3880ff' }}> #{tag.name}</span>)}
          </IonCardSubtitle>
        </IonCardHeader>

        <div style={{ display: 'flex', gap: '10px', padding: '0 15px', marginBottom: '20px' }}>
          <IonButton fill="clear" onClick={handleMemeLike}>
            <IonIcon slot="icon-only" icon={meme.is_liked_by_me ? heart : heartOutline} color={meme.is_liked_by_me ? 'danger' : 'medium'} />
          </IonButton>
          <span style={{ alignSelf: 'center' }}>{meme.like_count}</span>
          
          <IonButton fill="clear"><IonIcon slot="icon-only" icon={chatbubbleOutline} /></IonButton>
          <span style={{ alignSelf: 'center' }}>{meme.comments.length}</span>

          <IonButton fill="clear" onClick={handleShare}>
             <IonIcon slot="icon-only" icon={shareSocialOutline} />
          </IonButton>
        </div>

        <div style={{ paddingBottom: '80px' }}>
          {rootComments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>Nenhum comentário ainda.</div>
          ) : (
            rootComments.map(root => (
              <CommentItem 
                key={root.id} comment={root} repliesMap={repliesMap} handlers={handlers} currentUserId={currentUser}
              />
            ))
          )}
        </div>

        <IonToast isOpen={!!errorMsg} message={errorMsg} duration={2000} color="danger" onDidDismiss={() => setErrorMsg('')} />
        
        <IonToast
          isOpen={showShareToast}
          onDidDismiss={() => setShowShareToast(false)}
          message="Link copiado! 🔗"
          duration={2000}
          position="bottom"
          color="dark"
        />

        {/* --- COMPONENTE DE ALERTA (POPUP) --- */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertInfo.header}
          subHeader={alertInfo.subHeader}
          message={alertInfo.message}
          buttons={['Entendi']}
        />
      </IonContent>

      <IonFooter>
        <IonToolbar>
          {replyingTo && (
            <div style={{ background: '#222', padding: '8px 15px', fontSize: '0.85em', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333' }}>
              <span style={{ color: '#aaa' }}>Respondendo a <strong>@{replyingTo.owner_username}</strong></span>
              <span onClick={() => setReplyingTo(null)} style={{ color: '#eb445a', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</span>
            </div>
          )}
          
          <div style={{ padding: '0 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <IonInput 
                  ref={inputRef}
                  placeholder={replyingTo ? "Sua resposta..." : "Comente algo..."}
                  value={text} 
                  maxlength={MAX_CHARS} 
                  onIonInput={e => setText(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                />
                <IonButton 
                  fill="clear" 
                  onClick={handleSend} 
                  disabled={!text || text.length === 0}
                >
                  <IonIcon slot="icon-only" icon={send} color="primary" />
                </IonButton>
            </div>
            
            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: text.length >= MAX_CHARS ? '#ff4961' : '#666', marginTop: '-5px', marginRight: '10px' }}>
              {text.length}/{MAX_CHARS}
            </div>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default MemeDetail;