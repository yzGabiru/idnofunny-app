import React, { useState } from 'react';
import { 
  IonContent, IonPage, IonInput, IonButton, IonIcon, 
  IonLoading, IonToast, IonLabel, IonHeader, IonToolbar, IonButtons, IonBackButton 
} from '@ionic/react';
import { keyOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css';

const VerifyAccount = () => {
  const history = useHistory();
  const location = useLocation();
  
  // Tenta pegar o email que veio do redirecionamento do Cadastro
  const emailFromRegister = location.state?.email || '';

  const [email, setEmail] = useState(emailFromRegister);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', color: '' });

  const handleVerify = async () => {
    if (!code || !email) {
      setMessage({ text: "Código e Email são obrigatórios", color: "warning" });
      return;
    }
    setLoading(true);
    try {
      // Chama a rota de verificação do backend
      await api.post('/verify', { email, code });
      
      setMessage({ text: "Conta ativada! Pode entrar.", color: "success" });
      setTimeout(() => history.push('/login'), 1500);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || "Código inválido.", 
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
            <IonBackButton defaultHref="/register" color="light" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="auth-container auth-animate">
          <div className="auth-header">
            <h1>Verificar Conta</h1>
            <p>Digite o código enviado para seu email 📧</p>
          </div>

          {/* Campo de Email (Caso o usuário tenha recarregado a página) */}
          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Email</IonLabel>
            <IonInput 
              className="custom-input"
              value={email}
              readonly={!!emailFromRegister} // Trava se veio do cadastro
              onIonChange={e => setEmail(e.detail.value)}
            />
          </div>

          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Código de Ativação</IonLabel>
            <IonInput 
              className="custom-input"
              type="text"
              placeholder="Ex: 123456"
              value={code}
              maxlength={6}
              onIonChange={e => setCode(e.detail.value)}
            >
              <IonIcon slot="start" icon={keyOutline} style={{ opacity: 0.5, marginRight: 10 }} />
            </IonInput>
          </div>

          <IonButton className="auth-btn" expand="block" onClick={handleVerify}>
            Ativar Conta
            <IonIcon slot="end" icon={checkmarkDoneOutline} />
          </IonButton>
        </div>

        <IonLoading isOpen={loading} message="Validando..." />
        <IonToast isOpen={!!message.text} message={message.text} duration={3000} color={message.color} onDidDismiss={() => setMessage({ text: '', color: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default VerifyAccount;