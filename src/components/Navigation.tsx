import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './user/UserMenu';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  data: any;
  setShowConfirm: (show: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

const navItems = [
  { id: 'upload', label: 'Nahrání', icon: '📤' },
  { id: 'validate', label: 'Validace', icon: '✓' },
  { id: 'data', label: 'Data', icon: '📋' },
  { id: 'analyze', label: 'Analýza', icon: '📊' },
  { id: 'charts', label: 'Grafy', icon: '📈' },
  { id: 'export', label: 'Export', icon: '💾' }
];

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, data, setShowConfirm, darkMode, setDarkMode }) => {
  const { currentUser } = useAuth();

  return (
    <div className="p-2 md:p-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl">🏠</span>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white hidden md:block">
              Inicdiagram
            </h1>
          </Link>
        </div>

        {/* Navigation Items - Only show if user is authenticated */}
        {currentUser && (
          <div className="flex flex-wrap items-center">
            {navItems.map((item, index) => {
              const isAvailable = item.id === 'upload' || data;
              const isActive = activeTab === item.id;

              return (
                <React.Fragment key={item.id}>
                  <button
                    className={`flex items-center p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'} ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    onClick={() => {
                      if (!isAvailable) return;
                      if (item.id === 'upload' && data) {
                        setShowConfirm(true);
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    disabled={!isAvailable}
                    title={item.label}
                  >
                    <span className="text-lg mr-1">{item.icon}</span>
                    <span className="text-sm font-medium hidden sm:block">{item.label}</span>
                  </button>
                  {index < navItems.length - 1 && <div className="mx-1 md:mx-2"></div>}
                </React.Fragment>
              );
            })}
          </div>
        )}
        
        {/* Right Side - Dark Mode Toggle + User Menu */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
          >
            <span className="text-xl">
              {darkMode ? '☀️' : '🌙'}
            </span>
          </button>

          {/* User Menu or Login Button */}
          {currentUser ? (
            <UserMenu />
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Přihlásit
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Registrace
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
