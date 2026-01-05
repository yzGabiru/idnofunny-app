import React, { useState } from 'react';
import { 
  IonContent, IonPage, IonHeader, IonToolbar, IonTitle, 
  IonItem, IonLabel, IonInput, IonButton, IonLoading, IonToast
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import api from '../services/api';

const Verify = () => {
  const history = useHistory();
  const location = useLocation();
  
  // Tenta pegar o email que veio da tela anterior, se não tiver, fica vazio
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setIsError(false);
    setMessage('');

    try {
      await api.post('/verify', { email, code });
      setMessage("Conta verificada com sucesso! Faça login.");
      
      // Espera 2 segundos para o usuário ler e manda para o login
      setTimeout(() => {
        history.push('/login');
      }, 2000);

    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.detail || "Código inválido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Verificar Email</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ marginTop: '50px', marginBottom: '30px' }}>
          <h2>Quase lá! 🔐</h2>
          <p>Enviamos um código de 6 dígitos para o seu email. Digite-o abaixo para ativar sua conta.</p>
        </div>

        <IonItem>
          <IonLabel position="floating">Email</IonLabel>
          <IonInput value={email} onIonChange={e => setEmail(e.detail.value)} />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Código de Verificação</IonLabel>
          <IonInput type="number" placeholder="Ex: 123456" value={code} onIonChange={e => setCode(e.detail.value)} />
        </IonItem>

        <IonButton expand="block" onClick={handleVerify} style={{ marginTop: '30px' }}>
          Ativar Conta
        </IonButton>

        <IonLoading isOpen={loading} message={'Verificando...'} />
        <IonToast 
          isOpen={!!message} 
          message={message} 
          duration={2000} 
          color={isError ? "danger" : "success"}
          onDidDismiss={() => setMessage('')} 
        />

      </IonContent>
    </IonPage>
  );
};

export default Verify;