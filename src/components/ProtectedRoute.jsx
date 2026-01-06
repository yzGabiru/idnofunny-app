import React from 'react';
import { Route, Redirect } from 'react-router-dom';

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return !!token && !!username;
  };

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: {
                message: "Você não está logado, logue ou crie uma conta!",
                from: props.location
              }
            }}
          />
        )
      }
    />
  );
};

export default ProtectedRoute;
