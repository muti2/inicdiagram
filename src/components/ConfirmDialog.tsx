import React from 'react';

interface ConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-medium mb-4">Potvrzení akce</h3>
        <p className="mb-6">Opravdu chcete pokračovat?</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Ne
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ano
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
