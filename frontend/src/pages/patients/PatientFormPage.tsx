import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const patientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  document: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zipcode: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    values: patient ? {
      name: patient.name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      whatsapp: patient.whatsapp || '',
      birth_date: patient.birth_date || '',
      gender: patient.gender || '',
      document: '',
      address_street: patient.address_street || '',
      address_number: patient.address_number || '',
      address_neighborhood: patient.address_neighborhood || '',
      address_city: patient.address_city || '',
      address_state: patient.address_state || '',
      address_zipcode: patient.address_zipcode || '',
    } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: PatientFormData) => api.post('/patients', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Paciente cadastrado com sucesso');
      navigate(`/patients/${response.data.data.id}`);
    },
    onError: () => {
      toast.error('Erro ao cadastrar paciente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PatientFormData) => api.put(`/patients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      toast.success('Paciente atualizado com sucesso');
      navigate(`/patients/${id}`);
    },
    onError: () => {
      toast.error('Erro ao atualizar paciente');
    },
  });

  const onSubmit = (data: PatientFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingPatient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados Pessoais */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Dados Pessoais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nome Completo *"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="CPF"
              {...register('document')}
            />
            <Input
              label="Telefone"
              {...register('phone')}
            />
            <Input
              label="WhatsApp"
              {...register('whatsapp')}
            />
            <Input
              label="Data de Nascimento"
              type="date"
              {...register('birth_date')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gênero
              </label>
              <select
                {...register('gender')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Endereço */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Endereço
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CEP"
              {...register('address_zipcode')}
            />
            <div />
            <div className="md:col-span-2">
              <Input
                label="Rua"
                {...register('address_street')}
              />
            </div>
            <Input
              label="Número"
              {...register('address_number')}
            />
            <Input
              label="Bairro"
              {...register('address_neighborhood')}
            />
            <Input
              label="Cidade"
              {...register('address_city')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                {...register('address_state')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="">Selecione</option>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Paciente'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PatientFormPage;
