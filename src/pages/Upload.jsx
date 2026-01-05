import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonButton, IonIcon, IonLoading, useIonToast, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption
} from '@ionic/react';
import { 
  cloudUploadOutline, createOutline, arrowForwardOutline, checkmarkDoneOutline, closeOutline, timeOutline 
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import FabricImageEditor from '../components/ImageEditor/FabricImageEditor'; 
import api from '../services/api';
import './Upload.css';

const RATE_LIMIT_SECONDS = 60; // 60 segundos entre uploads

const Upload = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  
  const [step, setStep] = useState('select'); 
  const [imageSrc, setImageSrc] = useState(null);
  const [finalBlob, setFinalBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [title, setTitle] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [categories, setCategories] = useState([]); // State for categories
  const [loading, setLoading] = useState(false);

  // Rate Limiting States
  const [timeLeft, setTimeLeft] = useState(0);

  // Fetch Categories on Mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        presentToast("Erro ao carregar categorias. Usando padrão.", 2000, "warning");
        // Fallback or empty list - component will handle it
      }
    };
    fetchCategories();
  }, []);

  // Check rate limit on mount and when entering details
  useEffect(() => {
    const checkRateLimit = () => {
      const lastUpload = localStorage.getItem('lastUploadTime');
      if (lastUpload) {
        const diff = Math.floor((Date.now() - parseInt(lastUpload)) / 1000);
        if (diff < RATE_LIMIT_SECONDS) {
          setTimeLeft(RATE_LIMIT_SECONDS - diff);
        } else {
          setTimeLeft(0);
        }
      }
    };
    checkRateLimit();
    // Check periodically if blocked
    const interval = setInterval(checkRateLimit, 1000);
    return () => clearInterval(interval);
  }, []);

  // Formats seconds into MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Cleanups
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) URL.revokeObjectURL(imageSrc);
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [imageSrc, previewUrl]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        presentToast("Selecione uma imagem válida", 2000, "warning");
        return;
      }
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setStep('decision');
      e.target.value = '';
    }
  };

  const handleSkipEdit = async () => {
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      setFinalBlob(blob);
      setPreviewUrl(imageSrc); // Use the same URL for preview
      setStep('details');
    } catch (e) {
      console.error(e);
      presentToast("Erro ao processar imagem", 2000, "danger");
    }
  };

  const handleEditorSave = (editedBlob) => {
    setFinalBlob(editedBlob);
    setPreviewUrl(URL.createObjectURL(editedBlob));
    setStep('details');
  };

  const handlePost = async () => {
    if (timeLeft > 0) {
      presentToast(`Aguarde ${formatTime(timeLeft)} para postar novamente.`, 2000, "warning");
      return;
    }
    if (!title.trim()) {
      presentToast("O meme precisa de um título!", 2000, "warning");
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', finalBlob, 'meme_upload.jpg');
      formData.append('title', title);
      formData.append('category_id', categoryId);
      formData.append('hashtags', hashtags); 

      await api.post('/memes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update rate limit timestamp
      localStorage.setItem('lastUploadTime', Date.now().toString());

      presentToast("Meme enviado com sucesso! 🚀", 3000, "success");
      history.push('/feed');
      
      // Reset
      setStep('select');
      setImageSrc(null);
      setFinalBlob(null);
      setTitle('');
      setHashtags('');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Erro ao enviar.";
      presentToast(msg, 3000, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {step === 'select' ? (
              <IonBackButton defaultHref="/feed" />
            ) : (
              <IonButton onClick={() => setStep('select')}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            )}
          </IonButtons>
          <IonTitle>
            {step === 'select' && 'Novo Meme'}
            {step === 'decision' && 'Editar?'}
            {step === 'edit' && 'Editor'}
            {step === 'details' && 'Detalhes'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding upload-content">
        
        {/* STEP 1: SELECT */}
        {step === 'select' && (
           <div className="upload-container">
             <div className="upload-placeholder">
               <IonIcon icon={cloudUploadOutline} size="large" />
               <p>Selecione uma imagem da galeria</p>
               <input 
                 type="file" 
                 accept="image/*" 
                 id="file-input" 
                 hidden 
                 onChange={handleFileChange} 
               />
               <IonButton onClick={() => document.getElementById('file-input').click()}>
                 Escolher Imagem
               </IonButton>
             </div>
           </div>
        )}

        {/* STEP 2: DECISION */}
        {step === 'decision' && imageSrc && (
          <div className="upload-container" style={{ textAlign: 'center' }}>
            <img src={imageSrc} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '10px' }} />
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <IonButton fill="outline" onClick={handleSkipEdit}>
                <IonIcon icon={arrowForwardOutline} slot="start" />
                Não Editar
              </IonButton>
              <IonButton onClick={() => setStep('edit')}>
                <IonIcon icon={createOutline} slot="start" />
                Editar
              </IonButton>
            </div>
          </div>
        )}

        {/* STEP 4: DETAILS */}
        {step === 'details' && previewUrl && (
           <div className="upload-container">
             <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img 
                  src={previewUrl} 
                  alt="Final" 
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '10px', border: '1px solid #333' }} 
                />
             </div>

             <IonItem className="custom-input">
               <IonLabel position="stacked">Título</IonLabel>
               <IonInput 
                 placeholder="Quando você..." 
                 value={title} 
                 onIonChange={e => setTitle(e.detail.value)} 
               />
             </IonItem>

             <IonItem className="custom-input">
               <IonLabel position="stacked">Categoria</IonLabel>
               <IonSelect value={categoryId} onIonChange={e => setCategoryId(e.detail.value)}>
                 {categories.length > 0 ? (
                   categories.map((cat) => (
                     <IonSelectOption key={cat.id} value={cat.id.toString()}>
                       {cat.name}
                     </IonSelectOption>
                   ))
                 ) : (
                   <IonSelectOption value="1">Carregando...</IonSelectOption>
                 )}
               </IonSelect>
             </IonItem>

             <IonItem className="custom-input">
               <IonLabel position="stacked">Hashtags</IonLabel>
               <IonInput 
                 placeholder="#humor #dev (opcional)" 
                 value={hashtags} 
                 onIonChange={e => setHashtags(e.detail.value)} 
               />
             </IonItem>

             {/* POST BUTTON WITH TIMER */}
             <IonButton 
               expand="block" 
               onClick={handlePost} 
               style={{ marginTop: '30px' }}
               disabled={timeLeft > 0 || loading}
               color={timeLeft > 0 ? "medium" : "primary"}
             >
               {timeLeft > 0 ? (
                 <>
                   <IonIcon icon={timeOutline} slot="start" />
                   Aguarde {formatTime(timeLeft)}
                 </>
               ) : (
                 <>
                   <IonIcon icon={checkmarkDoneOutline} slot="start" />
                   Postar
                 </>
               )}
             </IonButton>
           </div>
        )}

      </IonContent>

      {/* STEP 3: CUSTOM EDITOR - Rendered outside IonContent to avoid z-index/scroll issues */}
      {step === 'edit' && imageSrc && (
          <div style={{ 
            height: '100%', 
            width: '100%', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: 20000, 
            background: '#000',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <FabricImageEditor
              imageUrl={imageSrc}
              onSave={handleEditorSave}
              onCancel={() => setStep('decision')}
            />
          </div>
      )}

      <IonLoading isOpen={loading} message="Enviando..." />
    </IonPage>
  );
};

export default Upload;
