import React from 'react';

interface ValidationPanelProps {
  validationResults: any;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ validationResults }) => {
  console.log('ValidationPanel obdržel:', validationResults);
  console.log('ValidationPanel obdržel:', validationResults);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Validace dat</h2>

      {/* Zobrazit zelený box pouze pokud validace existuje, valid je true a počet záznamů > 0 */}
      {validationResults && validationResults.valid && validationResults.stats && validationResults.stats.totalRecords > 0 ? (
        <div className="p-4 rounded-lg mb-4 border border-green-200 bg-green-50 text-green-800">
          <p className="font-medium flex items-center"><span className="mr-2">✅</span>Data jsou validní</p>
          <ul className="mt-2 text-sm space-y-1">
            {validationResults.messages.map((msg: string, i: number) => (
              <li key={i}>• {msg}</li>
            ))}
          </ul>
        </div>
      ) : validationResults && (!validationResults.valid || (validationResults.stats && validationResults.stats.totalRecords === 0)) ? (
        <div className="p-4 rounded-lg mb-4 border border-red-300 bg-red-50 text-red-800">
          <p className="font-medium flex items-center"><span className="mr-2">❌</span>Data nejsou validní</p>
          <ul className="mt-2 text-sm space-y-1">
            {validationResults.messages.map((msg: string, i: number) => (
              <li key={i}>• {msg}</li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-sm font-medium">
              Chcete-li opravit problémy s daty, přejděte do sekce <span className="text-blue-600 font-semibold">Data</span>, kde můžete upravit jednotlivé záznamy.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Celkem záznamů</p>
            <p className="text-lg font-semibold text-gray-800">{validationResults.stats.totalRecords}</p>
          </div>
          <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
            <span>Očekáváno: {validationResults.stats.expectedRecords}</span>
            <span className="text-red-600 font-medium">Chybí: {validationResults.stats.missingRecords}</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${(validationResults.stats.totalRecords / validationResults.stats.expectedRecords) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Zobrazit strukturální chyby, pokud existují */}
        {validationResults.stats.structuralErrors > 0 && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 shadow-sm">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">Strukturální chyby</p>
              <p className="text-lg font-semibold text-red-700">{validationResults.stats.structuralErrors}</p>
            </div>
            <div className="mt-1 flex justify-between items-center text-xs text-red-600">
              <span>Chyby ve struktuře dat</span>
              <span className="font-medium">Kritické</span>
            </div>
          </div>
        )}

        <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Chybějící hodnoty</p>
            <p className="text-lg font-semibold text-gray-800">{validationResults.stats.missingValues}</p>
          </div>
          <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
            <span>Z celkového počtu záznamů</span>
            <span className="text-green-600 font-medium">OK</span>
          </div>
        </div>
        
        {/* Display multiple years warning if detected */}
        {validationResults.stats.differentYears > 1 && (
          <div className="p-4 border border-amber-300 rounded-lg bg-amber-50 shadow-sm">
            <div className="flex justify-between items-center">
              <p className="text-sm text-amber-700">Roky v datech</p>
              <p className="text-lg font-semibold text-amber-700">{validationResults.stats.differentYears}</p>
            </div>
            <div className="mt-1 flex justify-between items-center text-xs text-amber-600">
              <span>Data obsahují záznamy z více let</span>
              <span className="font-medium">Varování</span>
            </div>
            {validationResults.stats.years && (
              <div className="mt-2 text-xs text-amber-700">
                Roky: {validationResults.stats.years.join(', ')}
              </div>
            )}
          </div>
        )}

        <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Roční pokrytí</p>
            <p className="text-lg font-semibold text-gray-800">
              {Math.round((validationResults.stats.totalRecords / validationResults.stats.expectedRecords) * 100)}%
            </p>
          </div>
          <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
            <span>Kompletní diagram: {validationResults.stats.expectedRecords} záznamů</span>
            <span className="text-red-600 font-medium">{validationResults.stats.totalRecords === validationResults.stats.expectedRecords ? 'Úplné' : 'Neúplné'}</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full"
              style={{ width: `${(validationResults.stats.totalRecords / validationResults.stats.expectedRecords) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Další detaily o chybách */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Neplatné hodnoty</p>
            <p className="text-lg font-semibold text-gray-800">{validationResults.stats.invalidValues || 0}</p>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Neplatné timestamp:</span>
              <span className={validationResults.stats.invalidTimestamps > 0 ? "text-red-600" : "text-green-600"}>
                {validationResults.stats.invalidTimestamps || 0}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Neplatné jednotky:</span>
              <span className={validationResults.stats.invalidUnits > 0 ? "text-red-600" : "text-green-600"}>
                {validationResults.stats.invalidUnits || 0}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Duplicitní záznamy:</span>
              <span className={validationResults.stats.duplicateTimestamps > 0 ? "text-red-600" : "text-green-600"}>
                {validationResults.stats.duplicateTimestamps || 0}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Extrémní hodnoty (&gt;3σ):</span>
              <span className={validationResults.stats.extremeValues > 0 ? "text-red-600" : "text-green-600"}>
                {validationResults.stats.extremeValues || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationPanel;
