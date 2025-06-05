import React from 'react';

interface ConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Potvrzení akce</h3>
        <p className="mb-6 text-gray-700 dark:text-gray-300">Opravdu chcete pokračovat?</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Ne
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Ano
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
