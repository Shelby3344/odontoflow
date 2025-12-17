import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  eachHourOfInterval,
  isSameDay,
  isToday,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  setHours,
  setMinutes,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { scheduleService } from '../../services/api';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

type ViewMode = 'day' | 'week' | 'month';

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  professional_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
}

interface ScheduleCalendarProps {
  professionalId?: string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (date: Date) => void;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 border-blue-300 text-blue-800',
  confirmed: 'bg-green-100 border-green-300 text-green-800',
  waiting: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  in_progress: 'bg-purple-100 border-purple-300 text-purple-800',
  completed: 'bg-gray-100 border-gray-300 text-gray-600',
  cancelled: 'bg-red-100 border-red-300 text-red-800 line-through',
  no_show: 'bg-red-200 border-red-400 text-red-900',
};

const WORK_HOURS = { start: 8, end: 20 };

export function ScheduleCalendar({
  professionalId,
  onAppointmentClick,
  onSlotClick,
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const dateRange = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return { start: currentDate, end: currentDate };
      case 'week':
        return {
          start: startOfWeek(currentDate, { locale: ptBR }),
          end: endOfWeek(currentDate, { locale: ptBR }),
        };
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
    }
  }, [currentDate, viewMode]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', professionalId, dateRange.start, dateRange.end],
    queryFn: async () => {
      const response = await scheduleService.getAppointments({
        professional_id: professionalId,
        start_date: format(dateRange.start, 'yyyy-MM-dd'),
        end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });
      return response.data.data as Appointment[];
    },
  });

  const navigate = (direction: 'prev' | 'next') => {
    const modifier = direction === 'prev' ? -1 : 1;
    
    switch (viewMode) {
      case 'day':
        setCurrentDate((d) => addDays(d, modifier));
        break;
      case 'week':
        setCurrentDate((d) => addWeeks(d, modifier));
        break;
      case 'month':
        setCurrentDate((d) => addMonths(d, modifier));
        break;
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const hours = useMemo(() => {
    const start = setMinutes(setHours(new Date(), WORK_HOURS.start), 0);
    const end = setMinutes(setHours(new Date(), WORK_HOURS.end), 0);
    return eachHourOfInterval({ start, end });
  }, []);

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => 
      isSameDay(parseISO(apt.start_time), day)
    );
  };

  const getAppointmentPosition = (appointment: Appointment) => {
    const start = parseISO(appointment.start_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const top = ((startHour - WORK_HOURS.start) / (WORK_HOURS.end - WORK_HOURS.start)) * 100;
    const height = (appointment.duration / 60 / (WORK_HOURS.end - WORK_HOURS.start)) * 100;
    
    return { top: `${top}%`, height: `${height}%` };
  };

  const renderTitle = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
      case 'week':
        return `${format(dateRange.start, "d 'de' MMM", { locale: ptBR })} - ${format(dateRange.end, "d 'de' MMM", { locale: ptBR })}`;
      case 'month':
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('prev')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('next')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {renderTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                viewMode === mode
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              )}
            >
              {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'month' ? (
          // Month View
          <div className="grid grid-cols-7 h-full">
            {/* Day headers */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
              >
                {day}
              </div>
            ))}
            
            {/* Days */}
            {days.map((day) => {
              const dayAppointments = getAppointmentsForDay(day);
              
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onSlotClick?.(day)}
                  className={clsx(
                    'min-h-[100px] p-2 border-b border-r border-gray-200 dark:border-gray-700 cursor-pointer',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                    !isSameDay(day, currentDate) && day.getMonth() !== currentDate.getMonth() && 'bg-gray-50 dark:bg-gray-900'
                  )}
                >
                  <span
                    className={clsx(
                      'inline-flex items-center justify-center w-7 h-7 text-sm rounded-full',
                      isToday(day) && 'bg-primary-600 text-white font-semibold',
                      !isToday(day) && 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  
                  <div className="mt-1 space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick?.(apt);
                        }}
                        className={clsx(
                          'px-2 py-0.5 text-xs rounded truncate cursor-pointer',
                          STATUS_COLORS[apt.status]
                        )}
                      >
                        {format(parseISO(apt.start_time), 'HH:mm')} {apt.patient_name}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                        +{dayAppointments.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Day/Week View
          <div className="flex h-full">
            {/* Time column */}
            <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
              {hours.map((hour) => (
                <div
                  key={hour.toISOString()}
                  className="h-16 text-xs text-gray-500 dark:text-gray-400 text-right pr-2 pt-1"
                >
                  {format(hour, 'HH:mm')}
                </div>
              ))}
            </div>

            {/* Days columns */}
            <div className={clsx('flex-1 grid', viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1')}>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                >
                  {/* Day header */}
                  <div
                    className={clsx(
                      'sticky top-0 z-10 p-2 text-center border-b border-gray-200 dark:border-gray-700',
                      'bg-white dark:bg-gray-800'
                    )}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format(day, 'EEE', { locale: ptBR })}
                    </div>
                    <div
                      className={clsx(
                        'inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full',
                        isToday(day) && 'bg-primary-600 text-white',
                        !isToday(day) && 'text-gray-900 dark:text-gray-100'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="relative" style={{ height: `${hours.length * 64}px` }}>
                    {/* Hour lines */}
                    {hours.map((hour) => (
                      <div
                        key={hour.toISOString()}
                        onClick={() => {
                          const slotDate = new Date(day);
                          slotDate.setHours(hour.getHours(), 0, 0, 0);
                          onSlotClick?.(slotDate);
                        }}
                        className="h-16 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                      />
                    ))}

                    {/* Appointments */}
                    {getAppointmentsForDay(day).map((apt) => {
                      const position = getAppointmentPosition(apt);
                      
                      return (
                        <div
                          key={apt.id}
                          onClick={() => onAppointmentClick?.(apt)}
                          style={{ top: position.top, height: position.height }}
                          className={clsx(
                            'absolute left-1 right-1 px-2 py-1 rounded-lg border cursor-pointer',
                            'overflow-hidden transition-transform hover:scale-[1.02]',
                            STATUS_COLORS[apt.status]
                          )}
                        >
                          <div className="text-xs font-medium truncate">
                            {apt.patient_name}
                          </div>
                          <div className="text-xs opacity-75">
                            {format(parseISO(apt.start_time), 'HH:mm')} - {format(parseISO(apt.end_time), 'HH:mm')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )}
    </div>
  );
}
