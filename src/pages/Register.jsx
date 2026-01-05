import React, { useState } from 'react';
import { 
  IonContent, IonPage, IonInput, IonButton, IonIcon, 
  IonLoading, IonToast, IonLabel, IonButtons, IonBackButton, IonHeader, IonToolbar 
} from '@ionic/react';
import { checkmarkDoneOutline, personOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css';

const Register = () => {
  const history = useHistory();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', color: '' });

  const handleRegister = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      setMessage({ text: "Preencha todos os campos", color: "warning" });
      return;
    }
    setLoading(true);
    try {
      await api.post('/register', formData);
      setMessage({ text: "Conta criada! Faça login.", color: "success" });
      setTimeout(() => history.push(({
          pathname: '/verify-account',
          state: { email: formData.email } 
        })), 1500);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.detail || "Erro ao criar conta.", 
        color: "danger" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="auth-page">
      {/* Botão de Voltar Flutuante */}
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
            <h1>Crie sua conta</h1>
            <p>Junte-se à comunidade IDNOFunny 🚀</p>
          </div>

          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Usuário</IonLabel>
            <IonInput 
              className="custom-input"
              placeholder="Ex: gabiru"
              value={formData.username}
              onIonChange={e => setFormData({...formData, username: e.detail.value})}
            >
              <IonIcon slot="start" icon={personOutline} style={{ opacity: 0.5, marginRight: 10 }} />
            </IonInput>
          </div>

          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Email</IonLabel>
            <IonInput 
              className="custom-input"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onIonChange={e => setFormData({...formData, email: e.detail.value})}
            >
              <IonIcon slot="start" icon={mailOutline} style={{ opacity: 0.5, marginRight: 10 }} />
            </IonInput>
          </div>

          <div className="auth-input-group">
            <IonLabel color="medium" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Senha</IonLabel>
            <IonInput 
              className="custom-input"
              type="password"
              placeholder="Crie uma senha forte"
              value={formData.password}
              onIonChange={e => setFormData({...formData, password: e.detail.value})}
            >
              <IonIcon slot="start" icon={lockClosedOutline} style={{ opacity: 0.5, marginRight: 10 }} />
            </IonInput>
          </div>

          <IonButton className="auth-btn" expand="block" onClick={handleRegister}>
            Cadastrar
            <IonIcon slot="end" icon={checkmarkDoneOutline} />
          </IonButton>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '0.9rem' }}>
            Já tem uma conta? <span style={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => history.push('/login')}>Entrar</span>
          </p>

        </div>

        <IonLoading isOpen={loading} message="Criando conta..." />
        <IonToast isOpen={!!message.text} message={message.text} duration={3000} color={message.color} onDidDismiss={() => setMessage({ text: '', color: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default Register;