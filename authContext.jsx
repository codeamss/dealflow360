import { createContext, useContext, useState, useEffect } from 'react';

// Mock fallback data for when backend is unreachable
const mockUsers = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex@dealflow360.com",
    role: "Sales Rep",
    token: "mock_token_sales_rep"
  },
  {
    id: 2,
    name: "Sarah Chen",
    email: "sarah@dealflow360.com",
    role: "Sales Manager",
    token: "mock_token_sales_manager"
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    email: "michael@dealflow360.com",
    role: "Finance",
    token: "mock_token_finance"
  },
  {
    id: 4,
    name: "Admin User",
    email: "admin@dealflow360.com",
    role: "Admin",
    token: "mock_token_admin"
  },
  {
    id: 5,
    name: "Acme Corporation",
    email: "contact@acmecorp.com",
    role: "Customer",
    token: "mock_token_customer"
  }
];

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

  // Check if user is logged in on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('dealflow360_user');
    const storedToken = localStorage.getItem('dealflow360_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock authentication functions for demo
  const mockLogin = (email, password, role = null) => {
    let mockUser;
    
    if (role) {
      // Login by role (demo quick-switch)
      mockUser = mockUsers.find(u => u.role === role);
    } else {
      // Login by email/password
      mockUser = mockUsers.find(u => u.email === email);
      
      // Check password (demo passwords are "password123" for internal, "customer123" for customers)
      const isCustomer = email.includes('customer') || email.includes('acme');
      const correctPassword = isCustomer ? 'customer123' : 'password123';
      
      if (password !== correctPassword) {
        throw new Error('Invalid credentials');
      }
    }

    if (!mockUser) {
      throw new Error('User not found');
    }

    const userData = {
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role
    };

    localStorage.setItem('dealflow360_user', JSON.stringify(userData));
    localStorage.setItem('dealflow360_token', mockUser.token);
    setUser(userData);
    setUseMock(true);

    return { 
      access_token: mockUser.token,
      token_type: 'bearer',
      user: userData 
    };
  };

  const mockRegister = (name, email, password, role) => {
    // Check if user already exists
    if (mockUsers.some(u => u.email === email)) {
      throw new Error('Email already registered');
    }

    const newUser = {
      id: mockUsers.length + 1,
      name,
      email,
      role,
      token: `mock_token_${role.toLowerCase().replace(' ', '_')}_${Date.now()}`
    };

    mockUsers.push(newUser);

    const userData = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    localStorage.setItem('dealflow360_user', JSON.stringify(userData));
    localStorage.setItem('dealflow360_token', newUser.token);
    setUser(userData);
    setUseMock(true);

    return { 
      access_token: newUser.token,
      token_type: 'bearer',
      user: userData 
    };
  };

  // Real authentication functions
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      localStorage.setItem('dealflow360_user', JSON.stringify(data.user));
      localStorage.setItem('dealflow360_token', data.access_token);
      setUser(data.user);
      setUseMock(false);

      return data;
    } catch (error) {
      console.warn('Backend login failed, falling back to mock:', error.message);
      return mockLogin(email, password);
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      
      localStorage.setItem('dealflow360_user', JSON.stringify(data.user));
      localStorage.setItem('dealflow360_token', data.access_token);
      setUser(data.user);
      setUseMock(false);

      return data;
    } catch (error) {
      console.warn('Backend registration failed, falling back to mock:', error.message);
      return mockRegister(name, email, password, role);
    }
  };

  const portalLogin = async (email, password, quoteAccessToken = null) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/portal-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, quote_access_token: quoteAccessToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Portal login failed');
      }

      const data = await response.json();
      
      localStorage.setItem('dealflow360_user', JSON.stringify(data.user));
      localStorage.setItem('dealflow360_token', data.access_token);
      setUser(data.user);
      setUseMock(false);

      return data;
    } catch (error) {
      console.warn('Backend portal login failed, falling back to mock:', error.message);
      return mockLogin(email, password, 'Customer');
    }
  };

  const logout = () => {
    localStorage.removeItem('dealflow360_user');
    localStorage.removeItem('dealflow360_token');
    setUser(null);
    setUseMock(false);
  };

  const getToken = () => {
    return localStorage.getItem('dealflow360_token');
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const getUserRole = () => {
    return user?.role;
  };

  const isInternalUser = () => {
    const internalRoles = ['Sales Rep', 'Sales Manager', 'Finance', 'Admin'];
    return internalRoles.includes(user?.role);
  };

  const isCustomer = () => {
    return user?.role === 'Customer';
  };

  const getRedirectPath = () => {
    if (!user) return '/login';
    
    if (isCustomer()) {
      // Customers go to their portal - for demo, redirect to quote #1001
      return '/portal/quote/1001';
    } else {
      // Internal users go to pipeline
      return '/pipeline';
    }
  };

  const quickLogin = (role) => {
    let email, password;
    
    switch(role) {
      case 'Sales Rep':
        email = 'alex@dealflow360.com';
        password = 'password123';
        break;
      case 'Sales Manager':
        email = 'sarah@dealflow360.com';
        password = 'password123';
        break;
      case 'Finance':
        email = 'michael@dealflow360.com';
        password = 'password123';
        break;
      case 'Admin':
        email = 'admin@dealflow360.com';
        password = 'password123';
        break;
      case 'Customer':
        email = 'contact@acmecorp.com';
        password = 'customer123';
        break;
      default:
        throw new Error('Invalid role for quick login');
    }
    
    return mockLogin(email, password, role);
  };

  const value = {
    user,
    loading,
    useMock,
    login,
    register,
    portalLogin,
    logout,
    getToken,
    isAuthenticated,
    getUserRole,
    isInternalUser,
    isCustomer,
    getRedirectPath,
    quickLogin,
    mockUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for making authenticated API requests
export const useAuthenticatedFetch = () => {
  const { getToken, useMock } = useAuth();

  return async (url, options = {}) => {
    const token = getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !useMock) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('API request failed:', error.message);
      throw error;
    }
  };
};