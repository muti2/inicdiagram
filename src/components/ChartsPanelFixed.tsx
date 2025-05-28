import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine,
  ScatterChart, Scatter 
} from 'recharts';

interface DataRecord {
  id: number;
  timestamp: string;
  value: number | null;
  unit: string;
}

interface ChartsPanelProps {
  data: DataRecord[] | null;
}

const ChartsPanel: React.FC<ChartsPanelProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter'>('line');
  const [timeRange, setTimeRange] = useState<'all' | 'day' | 'week' | 'month'>('all');
  
  // Formátování data pro osu X
  const formatDate = (date: Date): string => {
    // Kompaktnější formát pro lepší čitelnost
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Formátování data pro tooltip
  const formatTooltipDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('cs-CZ', options);
  };
  
  // Příprava dat pro grafy
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Filtrovat platná data (jen záznamy s platnou časovou značkou a hodnotou)
    const validData = data.filter(item => 
      item.timestamp && 
      !isNaN(new Date(item.timestamp).getTime()) && 
      item.value !== null && 
      !isNaN(item.value)
    );
    
    if (validData.length === 0) return [];
    
    // Seřadit podle času
    const sortedData = [...validData].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Filtrace dle zvoleného časového rozsahu
    let filteredData = sortedData;
    
    // Pokud je výběr jiný než "vše"
    if (timeRange !== 'all') {
      const now = new Date(); // Aktuální datum
      
      // Poslední datum v datech
      const lastDataDate = new Date(sortedData[sortedData.length - 1].timestamp);
      
      // Použij buď poslední datum v datech nebo aktuální datum, co je dříve
      const referenceDate = lastDataDate < now ? lastDataDate : now;
      const timeLimit = new Date(referenceDate);
      
      switch(timeRange) {
        case 'day':
          timeLimit.setDate(timeLimit.getDate() - 1);
          break;
        case 'week':
          timeLimit.setDate(timeLimit.getDate() - 7);
          break;
        case 'month':
          timeLimit.setMonth(timeLimit.getMonth() - 1);
          break;
      }
      
      filteredData = sortedData.filter(item => 
        new Date(item.timestamp).getTime() >= timeLimit.getTime()
      );
      
      // Pokud po filtraci nezbyly žádné záznamy, vrať aspoň nějaké data
      if (filteredData.length === 0) {
        // Vem posledních X záznamů podle časového rozsahu
        const recordCount = timeRange === 'day' ? 96 : (timeRange === 'week' ? 672 : 2880); // 15min intervaly
        filteredData = sortedData.slice(-Math.min(recordCount, sortedData.length));
      }
    }
    
    // Formátování dat pro Recharts
    return filteredData.map(item => ({
      time: new Date(item.timestamp),
      value: item.value,
      formattedTime: formatDate(new Date(item.timestamp)),
      unit: item.unit
    }));
  }, [data, timeRange]);
  
  // Výpočet statistik pro graf
  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, min: 0, max: 0 };
    
    const values = chartData.map(item => item.value as number);
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }, [chartData]);

  // Custom tooltip komponenta
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-700">{formatTooltipDate(new Date(payload[0].payload.time))}</p>
          <p className="text-blue-600">
            Hodnota: <span className="font-semibold">{payload[0].value.toFixed(2)}</span> {payload[0].payload.unit}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Funkce pro určení vhodného počtu bodů na grafu
  const getStepSize = (dataLength: number): number => {
    if (dataLength <= 100) return 1; // všechny body
    return Math.ceil(dataLength / 100); // max 100 bodů na grafu
  };
  
  // Vykreslení správného typu grafu
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          Nejsou k dispozici žádná platná data pro vykreslení grafu.
        </div>
      );
    }
    
    const stepSize = getStepSize(chartData.length);
    const sampledData = chartData.filter((_, index) => index % stepSize === 0);
    
    const unit = chartData[0]?.unit || '';
    
    // Společné vlastnosti XAxis
    const xAxisProps = {
      dataKey: "time",
      tickFormatter: (time: number) => formatDate(new Date(time)),
      angle: -30,
      textAnchor: "end",
      height: 80,
      tick: { fontSize: 10 },
      minTickGap: 15,
      interval: 0
    };
    
    // Společné vlastnosti Brush
    const brushProps = {
      dataKey: "time",
      height: 30,
      tickFormatter: (time: number) => formatDate(new Date(time))
    };
    
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={sampledData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis label={{ value: unit, angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={stats.avg} stroke="#8884d8" strokeDasharray="3 3" label="Průměr" />
              <Brush {...brushProps} stroke="#8884d8" /> 
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Spotřeba" 
                stroke="#8884d8" 
                dot={sampledData.length < 50}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sampledData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis label={{ value: unit, angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={stats.avg} stroke="#82ca9d" strokeDasharray="3 3" label="Průměr" />
              <Brush {...brushProps} stroke="#82ca9d" />
              <Bar dataKey="value" name="Spotřeba" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                {...xAxisProps}
                name="Čas"
                type="number"
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                dataKey="value" 
                name="Hodnota" 
                label={{ value: unit, angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Scatter name="Spotřeba" data={sampledData} fill="#FF8042" />
            </ScatterChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Vizualizace dat</h3>
          <p className="text-sm text-gray-600">
            {chartData.length > 0 
              ? `Zobrazeno ${chartData.length} záznamů.` 
              : 'Žádná data k zobrazení.'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center rounded-md overflow-hidden border border-gray-300">
            <button 
              className={`px-3 py-1.5 text-sm ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setChartType('line')}
            >
              Čárový
            </button>
            <button 
              className={`px-3 py-1.5 text-sm border-l border-gray-300 ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setChartType('bar')}
            >
              Sloupcový
            </button>
            <button 
              className={`px-3 py-1.5 text-sm border-l border-gray-300 ${chartType === 'scatter' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setChartType('scatter')}
            >
              Bodový
            </button>
          </div>
          
          <div className="flex items-center rounded-md overflow-hidden border border-gray-300 ml-2">
            <button 
              className={`px-3 py-1.5 text-sm ${timeRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setTimeRange('all')}
            >
              Vše
            </button>
            <button 
              className={`px-3 py-1.5 text-sm border-l border-gray-300 ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setTimeRange('month')}
            >
              Měsíc
            </button>
            <button 
              className={`px-3 py-1.5 text-sm border-l border-gray-300 ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setTimeRange('week')}
            >
              Týden
            </button>
            <button 
              className={`px-3 py-1.5 text-sm border-l border-gray-300 ${timeRange === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setTimeRange('day')}
            >
              Den
            </button>
          </div>
        </div>
      </div>
      
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <p className="text-sm font-medium text-gray-600">Minimální hodnota</p>
            <p className="text-xl font-semibold text-gray-800 mt-1">{stats.min.toFixed(2)} {chartData[0]?.unit}</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <p className="text-sm font-medium text-gray-600">Průměrná hodnota</p>
            <p className="text-xl font-semibold text-gray-800 mt-1">{stats.avg.toFixed(2)} {chartData[0]?.unit}</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <p className="text-sm font-medium text-gray-600">Maximální hodnota</p>
            <p className="text-xl font-semibold text-gray-800 mt-1">{stats.max.toFixed(2)} {chartData[0]?.unit}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
        {renderChart()}
      </div>
      
      {chartData.length > 0 && (
        <div className="text-sm text-gray-500 italic">
          <p>Tip: Použijte posuvník pod grafem pro zobrazení detailu vybraného časového úseku.</p>
        </div>
      )}
    </div>
  );
};

export default ChartsPanel;