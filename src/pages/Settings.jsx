import React, { useState } from 'react';
import { 
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonAlert, IonToast, IonLoading
} from '@ionic/react';
import { trashOutline, chevronForwardOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import api from '../services/api';

const Settings = () => {
  const history = useHistory();
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', color: '' });

  const handleDeleteAccount = () => {
    setShowAlert(true);
  };

  const executeDelete = async (password) => {
    setLoading(true);
    try {
      await api.delete('/users/me', { data: { password } });
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error(error);
      setToast({ 
        show: true, 
        msg: error.response?.data?.detail || "Erro ao deletar conta. Verifique sua senha.", 
        color: 'danger' 
      });
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/feed" />
          </IonButtons>
          <IonTitle>Configurações</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList style={{ marginTop: '20px' }}>
          
          {/* Item de Deletar Conta */}
          <IonItem button onClick={handleDeleteAccount} lines="full">
            <IonIcon slot="start" icon={trashOutline} color="danger" />
            <IonLabel color="danger">
              <h2>Deletar Conta</h2>
              <p>Esta ação é irreversível</p>
            </IonLabel>
            <IonIcon slot="end" icon={chevronForwardOutline} />
          </IonItem>

        </IonList>

        {/* Alerta de Confirmação com Senha */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Cuidado!'}
          message={'Para sua segurança, digite sua senha para confirmar a exclusão. Seus memes continuarão visíveis, mas seu nome será removido.'}
          inputs={[
            {
              name: 'password',
              type: 'password',
              placeholder: 'Sua senha atual'
            }
          ]}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: () => console.log('Cancelado')
            },
            {
              text: 'Excluir',
              role: 'destructive',
              handler: (data) => {
                if (data.password) {
                  executeDelete(data.password);
                } else {
                  setToast({ show: true, msg: "Senha obrigatória", color: "warning" });
                  return false; // Mantém o alerta aberto
                }
              }
            }
          ]}
        />

        <IonLoading isOpen={loading} message="Apagando seus dados..." />
        <IonToast 
          isOpen={toast.show} 
          message={toast.msg} 
          color={toast.color} 
          duration={3000} 
          onDidDismiss={() => setToast({ ...toast, show: false })} 
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;