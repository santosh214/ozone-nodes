interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    expiresIn: string;
  };
}

interface UserData {
  username: string;
  role: string;
}

interface DecodedToken {
  username: string;
  role: string;
  type: string;
  iat: number;
  exp: number;
}

class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user_data';

  // Store token and user data
  setAuthData(accessToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    
    // Decode token to get user info
    try {
      const decoded = this.decodeToken(accessToken);
      const userData: UserData = {
        username: decoded.username,
        role: decoded.role
      };
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
      
      // Set expiration time
      const expirationTime = new Date(decoded.exp * 1000).toISOString();
      localStorage.setItem('token_expires_at', expirationTime);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  // Get stored access token
  getAccessToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;

    // Check if token is expired
    if (this.isTokenExpired()) {
      this.clearAuthData();
      return null;
    }

    return token;
  }

  // Get user data
  getUserData(): UserData | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired();
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;

    return new Date() >= new Date(expiresAt);
  }

  // Decode JWT token
  private decodeToken(token: string): DecodedToken {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  // Clear all auth data
  clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('token_expires_at');
  }

  // Get authorization header for API calls
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Login user
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://ozone-nodes-backend.ozonescan.com/api/v1'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data: LoginResponse = await response.json();
    
    if (data.success && data.data.accessToken) {
      this.setAuthData(data.data.accessToken);
    }

    return data;
  }

  // Logout method
  logout(): void {
    this.clearAuthData();
  }
}

export const authService = new AuthService();
export type { LoginResponse, UserData, DecodedToken };
