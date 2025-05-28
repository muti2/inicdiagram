export interface DataRecord {
  id: number;
  timestamp: string;
  value: number;
  unit: string;
}

export function generateSampleData(): DataRecord[] {
  const data: DataRecord[] = [];
  const startDate = new Date(2023, 0, 1);

  for (let day = 0; day < 2; day++) {
    for (let hour = 0; hour < 24; hour++) {
      for (let quarter = 0; quarter < 4; quarter++) {
        const timestamp = new Date(startDate);
        timestamp.setDate(startDate.getDate() + day);
        timestamp.setHours(hour, quarter * 15, 0, 0);

        const skipRecord = day === 1 &&
          ((hour === 3 && quarter === 2) ||
            (hour === 10 && quarter === 1) ||
            (hour === 15 && quarter === 3));

        if (!skipRecord) {
          const isDuplicate = day === 1 &&
            ((hour === 5 && quarter === 0) ||
              (hour === 18 && quarter === 2));

          const isExtreme = day === 1 &&
            ((hour === 8 && quarter === 1) ||
              (hour === 20 && quarter === 3));

          let value = Math.round(100 + Math.random() * 50);

          if (isExtreme) {
            value = value * 5;
          }

          data.push({
            id: data.length + 1,
            timestamp: timestamp.toISOString(),
            value: value,
            unit: 'kWh'
          });

          if (isDuplicate) {
            data.push({
              id: data.length + 1,
              timestamp: timestamp.toISOString(),
              value: Math.round(value * 0.9),
              unit: 'kWh'
            });
          }
        }
      }
    }
  }

  return data;
}
