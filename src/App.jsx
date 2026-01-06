import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Componentes */
import ProtectedRoute from './components/ProtectedRoute';

/* Páginas */
import Login from './pages/Login';
import Feed from './pages/Feed';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import MemeDetail from './pages/MemeDetail';
import Settings from './pages/Settings';
import Register from './pages/Register';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyAccount from './pages/VerifyAccount';

/* CSS ... */
import '@ionic/react/css/palettes/dark.class.css';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';

setupIonicReact();

const App = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Rotas Públicas */}
        <Route exact path="/login">
          <Login />
        </Route>

        <Route exact path="/register">
          <Register />
        </Route>

        <Route exact path="/verify">
          <Verify />
        </Route>

        <Route path="/forgot-password" component={ForgotPassword} exact={true} />
        <Route path="/reset-password" component={ResetPassword} exact={true} />
        <Route path="/verify-account" component={VerifyAccount} exact={true} />

        {/* Rotas Protegidas */}
        <ProtectedRoute exact path="/feed" component={Feed} />
        <ProtectedRoute exact path="/upload" component={Upload} />
        <ProtectedRoute exact path="/profile" component={Profile} />
        <ProtectedRoute path="/users/:username" component={Profile} />
        <ProtectedRoute path="/settings" component={Settings} />
        <ProtectedRoute path="/meme/:id" component={MemeDetail} />

        {/* Redirecionamento padrão */}
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>

      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;