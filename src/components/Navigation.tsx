import React from 'react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  data: any;
  setShowConfirm: (show: boolean) => void;
}

const navItems = [
  { id: 'upload', label: 'Nahrání', icon: '📤' },
  { id: 'validate', label: 'Validace', icon: '✓' },
  { id: 'data', label: 'Data', icon: '📋' },
  { id: 'analyze', label: 'Analýza', icon: '📊' },
  { id: 'charts', label: 'Grafy', icon: '📈' },
  { id: 'export', label: 'Export', icon: '💾' }
];

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, data, setShowConfirm }) => {
  return (
    <div className="p-2 md:p-4 border-b bg-gray-50">
      <div className="flex flex-wrap items-center">
        {navItems.map((item, index) => {
          const isAvailable = item.id === 'upload' || data;
          const isActive = activeTab === item.id;

          return (
            <React.Fragment key={item.id}>
              <button
                className={`flex items-center p-2 rounded-md ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'} ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                <span className="text-sm font-medium">{item.label}</span>
              </button>
              {index < navItems.length - 1 && <div className="mx-1 md:mx-2"></div>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;
