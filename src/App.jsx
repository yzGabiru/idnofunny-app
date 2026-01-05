import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

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

setupIonicReact();

const App = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/settings" component={Settings} exact={true} />
        <Route path="/forgot-password" component={ForgotPassword} exact={true} />
        <Route path="/reset-password" component={ResetPassword} exact={true} />
        <Route path="/verify-account" component={VerifyAccount} exact={true} />

        <Route exact path="/login">
          <Login />
        </Route>

        <Route exact path="/">
          <Redirect to="/login" />
        </Route>

        <Route exact path="/feed">
          <Feed />
        </Route>

        <Route exact path="/upload">
          <Upload />
        </Route>

        <Route path="/users/:username">
          <Profile />
        </Route>

        <Route exact path="/profile">
          <Profile />
        </Route>

        <Route path="/meme/:id">
          <MemeDetail />
        </Route>

        {/* --- NOVAS ROTAS --- */}
        <Route exact path="/register">
          <Register />
        </Route>

        <Route exact path="/verify">
          <Verify />
        </Route>

      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;