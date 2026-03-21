import { useState, useEffect } from 'react';
import { authService, type UserData } from '../services/authService';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = () => {
      const isAuth = authService.isAuthenticated();
      const user = authService.getUserData();
      
      setIsAuthenticated(isAuth);
      setUserData(user);
      setLoading(false);
    };

    checkAuthStatus();

    // Optional: Check auth status periodically
    const interval = setInterval(checkAuthStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);
      if (response.success) {
        setIsAuthenticated(true);
        setUserData(authService.getUserData());
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserData(null);
  };

  const getAuthHeaders = () => {
    return authService.getAuthHeader();
  };

  return {
    isAuthenticated,
    userData,
    loading,
    login,
    logout,
    getAuthHeaders
  };
};
