import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonIcon,
  IonLoading,
  useIonToast,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { cloudUploadOutline, imageOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import ReactImageEditor from 'toast-ui.react-image-editor';
import api from '../services/api';
import './Upload.css'; // Certifique-se de que este arquivo existe, mesmo que vazio por enquanto

// ErrorBoundary mínimo para capturar falhas do editor e permitir fallback seguro
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
    if (this.props && typeof this.props.onError === 'function') {
      try { this.props.onError(error, info); } catch (e) { /* swallow */ }
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // caller handles fallback (we already call onError)
    }
    return this.props.children;
  }
}

const Upload = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const [loading, setLoading] = useState(false);

  const [imageSrc, setImageSrc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [imageBlob, setImageBlob] = useState(null);

  // Limpa a URL temporária quando o componente desmonta ou a imagem muda
  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  // 1. Seleção de Arquivo
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Validação simples de tipo
      if (!file.type.startsWith('image/')) {
         presentToast({
            message: 'Por favor, selecione um arquivo de imagem válido.',
            duration: 3000,
            color: 'warning',
         });
         return;
      }

      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setIsEditorOpen(true);
      // Limpa o input para permitir selecionar a mesma imagem novamente se cancelar
      event.target.value = '';
    }
  };

  // 2. Escolher Editar ou Prosseguir
  const handleEditChoice = (edit) => {
    if (edit) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
      history.push('/upload-details');
    }
  };

  // 3. Salvar Edição
  const handleSave = (image) => {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = image;
    link.click();
    setIsEditing(false);
    history.push('/upload-details');
  };


  // 4. Enviar para API
  const handleUpload = async (blobToUpload) => {
    if (!blobToUpload) {
      presentToast({
        message: 'Nenhuma imagem pronta para envio.',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      // Cria um arquivo com nome fixo e tipo JPEG (o editor exporta JPEG/PNG)
      const fileForAPI = new File([blobToUpload], "meme-upload.jpg", { type: "image/jpeg" });

      // Adicione outros campos se seu backend exigir (titulo, categoria, etc)
      formData.append('file', fileForAPI);
      formData.append('title', 'Meme sem título'); // Título padrão ou implemente um input
      formData.append('category_id', '1'); // Categoria padrão ou implemente um select

      await api.post('/memes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      presentToast({
        message: 'Meme enviado com sucesso!',
        duration: 3000,
        color: 'success',
      });
      
      // Limpa tudo e volta para o feed
      closeEditor();
      history.push('/tabs/feed');

    } catch (error) {
      console.error('Erro no upload:', error);
       let errorMessage = 'Falha ao enviar o meme. Tente novamente.';

       if (error.response) {
          // Erro que veio do backend (ex: 400, 500)
          errorMessage = error.response.data.detail || errorMessage;
       } else if (error.request) {
           // Erro de rede (não conseguiu contatar o servidor)
           errorMessage = 'Erro de conexão. Verifique sua internet.';
       }

      presentToast({
        message: errorMessage,
        duration: 4000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- CSS IN-LINE PARA CORRIGIR OS PROBLEMAS ---
  // Isso é necessário porque precisamos sobrescrever estilos internos do editor
  const editorStyles = `
    /* --- CORREÇÃO 2 e 4: Ocultar qualquer botão/campo de "Cancelar" textual --- */
    /* Mantém apenas o botão de fechar (X) fornecido por 'withCloseButton' */
    .FIE_topbar-buttons-wrapper .FIE_cancel-button,
    .FIE_topbar-buttons-wrapper button[title*="Cancel"],
    .FIE_topbar-buttons-wrapper button[aria-label*="cancel" i],
    .FIE_cancel-button,
    button.FIE_cancel-button {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
    }

    /* Garante que o botão Salvar não fique espremido e seja clicável */
    .FIE_topbar-buttons-wrapper .FIE_save-button,
    .FIE_save-button,
    button.FIE_save-button {
      min-width: 80px;
      white-space: nowrap;
      z-index: 200000 !important;
    }

    /* Força visibilidade do botão de fechar (X) */
    .FIE_topbar-buttons-wrapper .FIE_close-button,
    .FIE_close-button,
    button.FIE_close-button {
      display: inline-block !important;
      z-index: 200001 !important;
    }

    /* Garantir que pontos de toque e cliques alcancem o editor (especialmente em mobile) */
    .FIE_editor, .FIE_root, .FIE_canvas, .FIE_content {
      pointer-events: auto !important;
      touch-action: manipulation !important;
    }

    /* Força que a barra superior tenha prioridade de toque (evita sobreposição por causa do layout) */
    .FIE_topbar-buttons-wrapper button {
      pointer-events: auto !important;
    }
  `;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/feed" />
          </IonButtons>
          <IonTitle>Criar Meme</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding upload-content">
        <style>{editorStyles}</style>

        <IonCard className="upload-card">
          <IonCardContent className="upload-card-content">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="file-upload"
              style={{ display: 'none' }}
            />
            {!isEditing && (
              <>
                <IonButton expand="block" color="primary" onClick={() => document.getElementById('file-upload').click()}>
                  <IonIcon icon={imageOutline} slot="start" />
                  Selecionar Imagem
                </IonButton>
                {imageSrc && (
                  <>
                    <IonButton expand="block" color="secondary" onClick={() => handleEditChoice(true)}>
                      Editar Imagem
                    </IonButton>
                    <IonButton expand="block" color="tertiary" onClick={() => handleEditChoice(false)}>
                      Prosseguir sem Editar
                    </IonButton>
                  </>
                )}
              </>
            )}

            <div className="upload-placeholder">
                <IonIcon icon={cloudUploadOutline} size="large" color="medium" />
                <p>Escolha uma imagem da sua galeria para começar a editar.</p>
            </div>
          </IonCardContent>
        </IonCard>

        <IonLoading isOpen={loading} message={'Processando e enviando...'} />

        {/* --- EDITOR DE IMAGEM --- */}
        {isEditing && imageSrc && (
          <ReactImageEditor
            includeUI={{
              loadImage: {
                path: imageSrc,
                name: 'Minha Imagem'
              },
              theme: '#333',
              menuBarPosition: 'bottom'
            }}
            onSave={handleSave}
            cssMaxWidth={700}
            cssMaxHeight={500}
        )}
      </IonContent>
    </IonPage>
  );
};

export default Upload;
