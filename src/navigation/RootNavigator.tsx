import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector } from '../store';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { socketService } from '../services/socket';

const RootNavigator: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const userId = useAppSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (isAuthenticated && accessToken && userId) {
      socketService.connect(accessToken, userId);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, accessToken, userId]);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
