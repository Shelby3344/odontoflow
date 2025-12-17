import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Odontogram, OdontogramData } from '../../components/odontogram/Odontogram';
import { Card } from '../../components/ui/Card';

export function OdontogramPage() {
  const { id } = useParams();
  const [data, setData] = useState<OdontogramData>({});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Odontograma
      </h1>
      <Card>
        <Odontogram data={data} onChange={setData} />
      </Card>
    </div>
  );
}
