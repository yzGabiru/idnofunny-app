import React, { useState } from 'react';
import { 
  IonContent, IonPage, IonInput, IonButton, IonIcon, 
  IonLoading, IonToast, IonLabel 
} from '@ionic/react';
import { lockClosedOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css';

const ResetPassword = () => {
  const history = useHistory();
  const location = useLocation(); // Para ler o ?token= da URL
  
  // Pega o token da URL
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', color: '' });

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ text: "As senhas não coincidem", color: "warning" });
      return;
    }
    if (!token) {
      setMessage({ text: "Link inválido ou sem token", color: "danger" });
      return;
    }

    setLoading(true);
    try {
      // Envia o token e a nova senha para o backend
      await api.post('/reset-password', { token, new_password: newPassword });
      
      setMessage({ text: "Senha alterada! Redirecionando...", color: "success" });
      setTimeout(() => history.push('/login'), 2000);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || "Erro ao resetar senha.", 
        color: "danger" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="auth-page">
      <IonContent>
        <div className="auth-container auth-animate">
          <div className="auth-header">
            <h1>Nova Senha</h1>
            <p>Escolha uma senha nova e segura.</p>
          </div>

          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Nova Senha</IonLabel>
            <IonInput 
              className="custom-input"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onIonChange={e => setNewPassword(e.detail.value)}
            >
              <IonIcon slot="start" icon={lockClosedOutline} style={{ opacity: 0.5, marginRight: 10 }} />
            </IonInput>
          </div>

          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Confirmar Senha</IonLabel>
            <IonInput 
              className="custom-input"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onIonChange={e => setConfirmPassword(e.detail.value)}
            >
              <IonIcon slot="start" icon={lockClosedOutline} style={{ opacity: 0.5, marginRight: 10 }} />
            </IonInput>
          </div>

          <IonButton className="auth-btn" expand="block" onClick={handleReset}>
            Salvar Senha
            <IonIcon slot="end" icon={checkmarkDoneOutline} />
          </IonButton>
        </div>

        <IonLoading isOpen={loading} message="Salvando..." />
        <IonToast isOpen={!!message.text} message={message.text} duration={3000} color={message.color} onDidDismiss={() => setMessage({ text: '', color: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;