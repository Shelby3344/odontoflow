import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';

export function PatientDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Detalhes do Paciente
      </h1>
      <Card>
        <p className="text-gray-500">ID: {id}</p>
        <p className="text-gray-500 mt-4">Página em desenvolvimento...</p>
      </Card>
    </div>
  );
}
