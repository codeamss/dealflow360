import { useState } from 'react';
import { useAuth } from '../authContext.js';

const LoginForm = ({ onSuccess, switchToRegister }) => {
  const { login, portalLogin, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPortalLogin, setIsPortalLogin] = useState(false);
  const [quoteAccessToken, setQuoteAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      
      if (isPortalLogin) {
        result = await portalLogin(email, password, quoteAccessToken || null);
      } else {
        result = await login(email, password);
      }

      if (onSuccess) {
        onSuccess(result.user);
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setLoading(true);
    setError('');

    try {
      const result = await quickLogin(role);
      
      if (onSuccess) {
        onSuccess(result.user);
      }
    } catch (error) {
      setError(error.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {isPortalLogin ? 'Customer Portal Login' : 'Internal Login'}
      </h2>

      {/* Demo Quick Login Buttons */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-3 text-center">Quick Demo Login:</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => handleQuickLogin('Sales Rep')}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            Sales Rep
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('Sales Manager')}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
            disabled={loading}
          >
            Sales Manager
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('Finance')}
            className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition"
            disabled={loading}
          >
            Finance
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('Admin')}
            className="px-3 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 transition"
            disabled={loading}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('Customer')}
            className="px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition col-span-2"
            disabled={loading}
          >
            Customer Portal
          </button>
        </div>
      </div>

      <div className="border-t pt-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@company.com"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {isPortalLogin && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Quote Access Token (Optional)
              </label>
              <input
                type="text"
                value={quoteAccessToken}
                onChange={(e) => setQuoteAccessToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quote access token if available"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Only required for direct quote access without email/password
              </p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="portal-login"
                checked={isPortalLogin}
                onChange={(e) => setIsPortalLogin(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="portal-login" className="ml-2 block text-sm text-gray-700">
                Customer Portal Access
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Check this if you are a customer accessing your quotes
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={switchToRegister}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Register here
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Demo credentials: email: [role]@dealflow360.com, password: password123<br />
            Customer demo: email: contact@acmecorp.com, password: customer123
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;