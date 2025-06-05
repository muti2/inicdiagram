import React from 'react';

const DataTable: React.FC<{ data: any; setData: (data: any) => void }> = () => {
  return (
    <div className="p-4 border border-gray-300 rounded bg-gray-50">
      <p>Tabulka dat (zatím placeholder)</p>
    </div>
  );
};

export default DataTable;
