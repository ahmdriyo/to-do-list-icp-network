import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Interface untuk LoadingStates
interface LoadingStates {
  login: boolean;
}

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    login: false,
  });

  /**
   * Handle login process
   */
  const handleLogin = async (): Promise<void> => {
    try {
      setLoadingStates(prev => ({ ...prev, login: true }));
      await login();
    } catch (error) {
      console.error('Login error:', error);
      // Toast notification bisa ditambahkan di sini
    } finally {
      setLoadingStates(prev => ({ ...prev, login: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        {/* Theme Toggle Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleDarkMode}
            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              To-Do List App
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-1">
              Powered by Internet Computer (ICP)
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tugas Anda disimpan di blockchain dengan aman
            </p>
          </div>

          {/* Features List */}
          <div className="mb-8 space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span className="text-green-500 mr-3">🔐</span>
              Login aman dengan Internet Identity
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span className="text-blue-500 mr-3">💬</span>
              Tambahkan komentar di setiap tugas
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span className="text-purple-500 mr-3">🌙</span>
              Mode gelap dan terang
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span className="text-orange-500 mr-3">📱</span>
              Responsive untuk semua perangkat
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loadingStates.login}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loadingStates.login ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Menghubungkan ke Internet Identity...
              </>
            ) : (
              <>
                <span className="mr-3">🔐</span>
                Login dengan Internet Identity
              </>
            )}
          </button>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Internet Identity adalah sistem otentikasi yang aman dan terdesentralisasi. 
              Data Anda akan tersimpan dengan aman di blockchain Internet Computer.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Belum punya Internet Identity?{' '}
              <a 
                href="https://identity.ic0.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Buat di sini
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 To-Do List App - Built with React + Internet Computer
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
