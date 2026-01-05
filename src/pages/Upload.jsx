import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSelect, IonSelectOption,
  IonLoading, IonToast, IonModal
} from '@ionic/react';
import { 
  cloudUploadOutline, imageOutline, timeOutline, colorWandOutline, 
  arrowForwardOutline, trashOutline 
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';
import api from '../services/api';

import '../styles/Upload.css';

const Upload = () => {
  const history = useHistory();
  
  // Steps: 'upload' (pick/confirm) | 'editor' | 'details' (form)
  const [step, setStep] = useState('upload');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) { console.error("Erro categorias", error); }
    };
    fetchCategories();
    checkCooldown();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  // Sync step with modal state
  useEffect(() => {
    setIsEditorOpen(step === 'editor');
  }, [step]);

  const checkCooldown = () => {
    const lastPostTime = localStorage.getItem('last_post_time');
    if (lastPostTime) {
      const diff = (Date.now() - parseInt(lastPostTime)) / 1000;
      if (diff < 60) setTimeLeft(Math.ceil(60 - diff));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStep('upload');
    const input = document.getElementById('fileInput');
    if(input) input.value = '';
  };

  // Editor Save Handler
  const handleEditorSave = (editedImageObject) => {
    fetch(editedImageObject.imageBase64)
      .then(res => res.blob())
      .then(blob => {
        const fileForAPI = new File([blob], "meme-edited.jpg", { type: "image/jpeg" });
        setSelectedFile(fileForAPI);
        setPreviewUrl(URL.createObjectURL(blob));
        setIsEditorOpen(false);
        setStep('details');
      })
      .catch(err => {
        console.error("Erro ao processar imagem editada", err);
        setMessage("Erro ao salvar edição.");
      });
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !categoryId) {
      setMessage("Preencha título, categoria e escolha uma imagem!");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category_id', categoryId);
    formData.append('tags', tags);
    formData.append('file', selectedFile);

    try {
      await api.post('/memes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage("Meme postado com sucesso! 🚀");
      localStorage.setItem('last_post_time', Date.now().toString());
      setTimeout(() => { history.push('/feed'); window.location.href = '/feed'; }, 1000);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        setTimeLeft(60);
        setMessage(`Calma! Aguarde 60s para postar de novo.`);
      } else {
        setMessage("Erro ao postar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderUploadStep = () => (
    <div className="upload-container">
      {/* Aviso de Cooldown */}
      {timeLeft > 0 && (
        <div style={{ background: '#ffc409', color: '#000', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IonIcon icon={timeOutline} size="large" />
          <div>
            <strong>Limite de posts!</strong>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Aguarde <b>{timeLeft}s</b>.</p>
          </div>
        </div>
      )}

      <input type="file" id="fileInput" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={timeLeft > 0} />
      
      {/* PREVIEW AREA */}
      <div 
        className="image-preview-area" 
        onClick={() => !selectedFile && !timeLeft && document.getElementById('fileInput').click()}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="preview-img" />
        ) : (
          <div className="upload-placeholder">
            <IonIcon icon={imageOutline} style={{ fontSize: '48px', marginBottom: '10px' }} />
            <p>Toque para escolher uma imagem</p>
          </div>
        )}
      </div>

      {/* ACTIONS (Only if file selected) */}
      {selectedFile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <IonButton 
              expand="block" 
              color="secondary" 
              style={{ flex: 1 }}
              onClick={() => setStep('editor')}
            >
              <IonIcon slot="start" icon={colorWandOutline} />
              Editar
            </IonButton>
            <IonButton 
              expand="block" 
              color="primary" 
              style={{ flex: 1 }}
              onClick={() => setStep('details')}
            >
              Próximo
              <IonIcon slot="end" icon={arrowForwardOutline} />
            </IonButton>
          </div>
          
          <IonButton 
            expand="block" 
            color="medium" 
            fill="outline"
            onClick={handleClearFile}
          >
            <IonIcon slot="start" icon={trashOutline} />
            Trocar Imagem
          </IonButton>
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="upload-container">
      <div className="image-preview-area" style={{ height: '200px', minHeight: 'auto', marginBottom: '20px' }}>
        <img src={previewUrl} alt="Final Preview" className="preview-img" />
      </div>

      <IonItem className="custom-item" lines="none">
        <IonLabel position="stacked">Título</IonLabel>
        <IonInput value={title} placeholder="Seja criativo..." onIonChange={e => setTitle(e.detail.value)} />
      </IonItem>

      <IonItem className="custom-item" lines="none">
        <IonLabel position="stacked">Categoria</IonLabel>
        <IonSelect value={categoryId} placeholder="Selecione..." onIonChange={e => setCategoryId(e.detail.value)}>
          {categories.map(cat => <IonSelectOption key={cat.id} value={cat.id}>{cat.name}</IonSelectOption>)}
        </IonSelect>
      </IonItem>

      <IonItem className="custom-item" lines="none">
        <IonLabel position="stacked">Hashtags</IonLabel>
        <IonInput placeholder="Ex: humor, brasil, gato" value={tags} onIonChange={e => setTags(e.detail.value)} />
      </IonItem>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <IonButton 
            color="medium" 
            fill="outline" 
            style={{ flex: 1 }}
            onClick={() => setStep('upload')}
        >
            Voltar
        </IonButton>
        <IonButton 
            color="primary" 
            style={{ flex: 2 }}
            onClick={handleUpload}
            disabled={loading}
        >
            <IonIcon slot="start" icon={cloudUploadOutline} />
            {loading ? "Enviando..." : "Publicar Meme"}
        </IonButton>
      </div>
    </div>
  );

  return (
    <IonPage>
      {/* Esconde o Header principal se o editor estiver aberto */}
      {!isEditorOpen && (
        <IonHeader>
            <IonToolbar>
            <IonButtons slot="start"><IonBackButton defaultHref="/feed" /></IonButtons>
            <IonTitle>
                {step === 'details' ? 'Detalhes do Meme' : 'Novo Meme'}
            </IonTitle>
            </IonToolbar>
        </IonHeader>
      )}

      <IonContent className="upload-content" scrollY={!isEditorOpen}>
        {step === 'upload' && renderUploadStep()}
        {step === 'details' && renderDetailsStep()}
        
        {/* EDITOR EM FULLSCREEN MODAL */}
        <IonModal 
            isOpen={isEditorOpen} 
            onDidDismiss={() => setStep('upload')} 
            className="editor-modal"
            canDismiss={false}
        >
          <div className="editor-wrapper">
             
             {/* NOVO BOTÃO CANCELAR (Substituindo o X) */}
             <div className="editor-top-left">
                <IonButton 
                  className="cancel-btn-custom"
                  fill="solid" 
                  onClick={() => setStep('upload')}
                >
                  Cancelar
                </IonButton>
             </div>

             {previewUrl && (
               <FilerobotImageEditor
                  source={previewUrl}
                  onSave={(editedImageObject, designState) => handleEditorSave(editedImageObject)}
                  // onClose está vazio pois usamos nosso botão Cancelar personalizado
                  onClose={() => {}} 
                  tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FILTERS, TABS.FINETUNE]}
                  defaultTabId={TABS.ADJUST}
                  defaultToolId={TOOLS.CROP}
                  Crop={{
                    presetsItems: [
                      { titleKey: 'Square', descriptionKey: '1:1', ratio: 1, selected: true },
                      { titleKey: 'Portrait', descriptionKey: '4:5', ratio: 4/5 },
                      { titleKey: 'Landscape', descriptionKey: '16:9', ratio: 16/9 },
                    ],
                  }}
                  Text={{ text: 'Digite seu texto...' }}
                  translations={{
                    save: 'Salvar',
                    cancel: 'Cancelar',
                    crop: 'Recortar',
                  }}
                  theme={{
                      palette: {
                        'bg-primary': '#000000',
                        'bg-secondary': '#1a1a1a',
                        'bg-active': '#2c2c2c',
                        'accent-primary': '#3880ff', 
                        'accent-active': '#3880ff',
                        'icons-primary': '#ffffff',
                        'icons-secondary': '#aaaaaa',
                        'borders-primary': '#333333',
                        'borders-secondary': '#444444',
                        'light': '#ffffff',
                        'dark': '#000000',
                        'txt-primary': '#ffffff',
                        'txt-secondary': '#cccccc',
                        'error': '#ff4d4d',
                      },
                      typography: {
                          fontFamily: 'Inter, sans-serif'
                      }
                  }}
                />
             )}
          </div>
        </IonModal>

        <IonLoading isOpen={loading} message={'Enviando meme...'} />
        <IonToast isOpen={!!message} message={message} duration={3000} onDidDismiss={() => setMessage('')} />

      </IonContent>
    </IonPage>
  );
};

export default Upload;