import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonInput, IonButton, IonIcon,
  IonLoading, IonToast, IonLabel
} from '@ionic/react';
import { logInOutline, personAddOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css'; // <--- Importando CSS Novo

const Login = () => {
  const history = useHistory();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  // Detecta se foi redirecionado de uma rota protegida - apenas uma vez na montagem
  useEffect(() => {
    if (location.state?.message) {
      setWarningMessage(location.state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // 1. Pega o Token (Formato URLSearchParams para x-www-form-urlencoded)
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      
      const res = await api.post('/token', params);
      localStorage.setItem('token', res.data.access_token);
      
      // 2. Pega o Usuário
      const userRes = await api.get('/users/me');
      localStorage.setItem('username', userRes.data.username);
      
      history.push('/feed');
      window.location.reload(); 
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('Usuário ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="auth-page">
      <IonContent>
        <div className="auth-container auth-animate">
          
          <div className="auth-header">
            <h1>IDNO<span style={{ color: '#007aff' }}>Funny</span></h1>
            <p>Bem-vindo de volta! 👋</p>
          </div>

          {/* INPUT USUÁRIO */}
          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Usuário</IonLabel>
            <IonInput 
              className="custom-input"
              value={username} 
              onIonChange={e => setUsername(e.detail.value)} 
              placeholder="Digite seu @usuário"
            >
              <IonIcon slot="start" icon={mailOutline} style={{ opacity: 0.5, marginRight: 10 }} />
            </IonInput>
          </div>

          {/* INPUT SENHA */}
          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Senha</IonLabel>
            <IonInput 
              className="custom-input"
              type="password" 
              value={password} 
              onIonChange={e => setPassword(e.detail.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
            >
              <IonIcon slot="start" icon={lockClosedOutline} style={{ opacity: 0.5, marginRight: 10 }} />
            </IonInput>
          </div>

          {/* ESQUECI MINHA SENHA */}
          <div className="auth-link" onClick={() => history.push('/forgot-password')}>
            Esqueci minha senha
          </div>

          {/* BOTÕES */}
          <IonButton className="auth-btn" expand="block" onClick={handleLogin}>
            Entrar
            <IonIcon slot="end" icon={logInOutline} />
          </IonButton>

          <IonButton className="auth-btn-outline" expand="block" fill="outline" routerLink="/register">
            Criar Conta
            <IonIcon slot="end" icon={personAddOutline} />
          </IonButton>

        </div>

        <IonLoading isOpen={loading} message="Entrando..." />
        <IonToast isOpen={!!error} message={error} duration={3000} color="danger" onDidDismiss={() => setError('')} />
        <IonToast
          isOpen={!!warningMessage}
          message={warningMessage}
          duration={4000}
          color="warning"
          onDidDismiss={() => setWarningMessage('')}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;