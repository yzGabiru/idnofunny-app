import React, { useState } from 'react';
import { 
  IonContent, IonPage, IonInput, IonButton, IonIcon, 
  IonLoading, IonToast, IonLabel, IonButtons, IonBackButton, IonHeader, IonToolbar 
} from '@ionic/react';
import { mailOutline, sendOutline } from 'ionicons/icons';
import api from '../services/api'; // Importe a API
import '../styles/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', color: '' });

  const handleRecover = async () => {
    if (!email) {
      setToast({ show: true, msg: "Digite seu email", color: "warning" });
      return;
    }
    setLoading(true);
    
    try {
      // Chama a rota que criamos no backend
      await api.post(`/password-recovery/${email}`);
      
      setToast({ 
        show: true, 
        msg: "Verifique seu email (ou o console do servidor) para o link!", 
        color: "success" 
      });
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setToast({ 
        show: true, 
        msg: "Erro ao solicitar recuperação.", 
        color: "danger" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="auth-page">
      <IonHeader className="ion-no-border">
        <IonToolbar color="transparent">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" color="light" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="auth-container auth-animate">
          <div className="auth-header">
            <h1>Recuperar Senha</h1>
            <p>Enviaremos um link mágico para você. 🧙‍♂️</p>
          </div>

          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Email cadastrado</IonLabel>
            <IonInput 
              className="custom-input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onIonChange={e => setEmail(e.detail.value)}
            >
              <IonIcon slot="start" icon={mailOutline} style={{ opacity: 0.5, marginRight: 10 }} />
            </IonInput>
          </div>

          <IonButton className="auth-btn" expand="block" onClick={handleRecover}>
            Enviar Link
            <IonIcon slot="end" icon={sendOutline} />
          </IonButton>
        </div>

        <IonLoading isOpen={loading} message="Enviando..." />
        <IonToast isOpen={toast.show} message={toast.msg} duration={3000} color={toast.color} onDidDismiss={() => setToast({ ...toast, show: false })} />
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;