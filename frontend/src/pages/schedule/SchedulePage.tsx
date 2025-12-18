import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const HOURS = Array.from({ length: 20 }, (_, i) => i + 8); // 8h às 18h

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-gray-100 border-gray-300 text-gray-700',
  confirmed: 'bg-purple-100 border-purple-300 text-purple-700',
  waiting: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  in_progress: 'bg-blue-100 border-blue-300 text-blue-700',
  completed: 'bg-green-100 border-green-300 text-green-700',
  cancelled: 'bg-red-100 border-red-300 text-red-700 opacity-50',
  no_show: 'bg-red-100 border-red-300 text-red-700',
};

export function SchedulePage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('week');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(d => d.getDay() !== 0 && d.getDay() !== 6);

  // Buscar agendamentos
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await api.get('/schedule/appointments', {
        params: {
          start_date: format(weekStart, 'yyyy-MM-dd'),
          end_date: format(weekEnd, 'yyyy-MM-dd'),
        },
      });
      return response.data.data;
    },
  });

  // Mutations para ações
  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.post(`/schedule/appointments/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Consulta confirmada');
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => api.post(`/schedule/appointments/${id}/check-in`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Check-in realizado');
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => api.post(`/schedule/appointments/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Atendimento iniciado');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/schedule/appointments/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Atendimento finalizado');
    },
  });

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    if (!appointments) return [];
    return appointments.filter((apt: any) => {
      const aptDate = new Date(apt.start_time);
      return isSameDay(aptDate, date) && aptDate.getHours() === hour;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'scheduled': return { label: 'Confirmar', action: confirmMutation };
      case 'confirmed': return { label: 'Check-in', action: checkInMutation };
      case 'waiting': return { label: 'Iniciar', action: startMutation };
      case 'in_progress': return { label: 'Finalizar', action: completeMutation };
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Agenda
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={clsx(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                view === 'day' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300'
              )}
            >
              Dia
            </button>
            <button
              onClick={() => setView('week')}
              className={clsx(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                view === 'week' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300'
              )}
            >
              Semana
            </button>
          </div>
          <Button onClick={() => setShowNewAppointment(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateWeek('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
        >
          Hoje
        </button>
        <button
          onClick={() => navigateWeek('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Calendário */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="w-20 p-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hora
                </th>
                {weekDays.map((day) => (
                  <th 
                    key={day.toISOString()} 
                    className={clsx(
                      'p-3 text-center text-xs font-medium uppercase',
                      isSameDay(day, new Date()) 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' 
                        : 'text-gray-500'
                    )}
                  >
                    <div>{format(day, 'EEE', { locale: ptBR })}</div>
                    <div className="text-lg font-bold">{format(day, 'dd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {HOURS.map((hour) => (
                <tr key={hour} className="divide-x divide-gray-200 dark:divide-gray-700">
                  <td className="p-2 text-sm text-gray-500 text-center bg-gray-50 dark:bg-gray-800">
                    {hour.toString().padStart(2, '0')}:00
                  </td>
                  {weekDays.map((day) => {
                    const slotAppointments = getAppointmentsForSlot(day, hour);
                    
                    return (
                      <td 
                        key={`${day.toISOString()}-${hour}`}
                        className={clsx(
                          'p-1 h-20 align-top cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                          isSameDay(day, new Date()) && 'bg-primary-50/30 dark:bg-primary-900/10'
                        )}
                        onClick={() => {
                          if (slotAppointments.length === 0) {
                            setSelectedSlot({ date: day, time: `${hour}:00` });
                            setShowNewAppointment(true);
                          }
                        }}
                      >
                        {slotAppointments.map((apt: any) => (
                          <div
                            key={apt.id}
                            className={clsx(
                              'p-2 rounded-lg border text-xs mb-1 cursor-pointer',
                              STATUS_COLORS[apt.status] || STATUS_COLORS.scheduled
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Abrir modal de detalhes
                            }}
                          >
                            <div className="font-medium truncate">{apt.patient_name}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span>{format(new Date(apt.start_time), 'HH:mm')}</span>
                              {apt.ai_risk_score > 0.5 && (
                                <ExclamationTriangleIcon className="w-3 h-3 text-yellow-600" title="Alto risco de falta" />
                              )}
                            </div>
                            {/* Ação rápida */}
                            {getNextAction(apt.status) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  getNextAction(apt.status)?.action.mutate(apt.id);
                                }}
                                className="mt-1 w-full py-1 bg-white/50 rounded text-xs font-medium hover:bg-white/80"
                              >
                                {getNextAction(apt.status)?.label}
                              </button>
                            )}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        {[
          { status: 'scheduled', label: 'Agendado' },
          { status: 'confirmed', label: 'Confirmado' },
          { status: 'waiting', label: 'Aguardando' },
          { status: 'in_progress', label: 'Em Atendimento' },
          { status: 'completed', label: 'Concluído' },
          { status: 'no_show', label: 'Não Compareceu' },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2">
            <div className={clsx('w-4 h-4 rounded border', STATUS_COLORS[status])} />
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Sugestões da IA */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Sugestões Inteligentes
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              ⚠️ Risco de Faltas
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              3 pacientes com alto risco de não comparecer amanhã
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              📊 Ocupação
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Taxa de ocupação da semana: 75%
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              ✅ Encaixes Disponíveis
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              5 horários disponíveis para encaixes hoje
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SchedulePage;
