import React from 'react';
import { StatusBadge } from '../ui/Badge';
import './AppointmentsList.css';

export interface Appointment {
  id: string;
  time: string;
  end_time: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  risk_score?: 'low' | 'medium' | 'high';
}

interface AppointmentsListProps {
  appointments: Appointment[];
  loading?: boolean;
  onAppointmentClick?: (appointment: Appointment) => void;
}

const typeLabels: Record<string, string> = {
  consultation: 'Consulta',
  cleaning: 'Limpeza',
  restoration: 'Restauração',
  extraction: 'Extração',
  root_canal: 'Canal',
  whitening: 'Clareamento',
  orthodontics: 'Ortodontia',
  implant: 'Implante',
};

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  appointments,
  loading = false,
  onAppointmentClick
}) => {
  if (loading) {
    return (
      <div className="appointments-list">
        {[1, 2, 3].map(i => (
          <div key={i} className="appointment-item appointment-skeleton">
            <div className="skeleton skeleton-time" />
            <div className="skeleton-content">
              <div className="skeleton skeleton-name" />
              <div className="skeleton skeleton-type" />
            </div>
            <div className="skeleton skeleton-badge" />
          </div>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="appointments-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <p>Nenhum agendamento para hoje</p>
      </div>
    );
  }

  return (
    <div className="appointments-list">
      {appointments.map(apt => (
        <div
          key={apt.id}
          className={`appointment-item ${apt.status === 'completed' ? 'appointment-completed' : ''}`}
          onClick={() => onAppointmentClick?.(apt)}
        >
          <div className="appointment-time">
            <span className="time-start">{apt.time}</span>
            <span className="time-end">{apt.end_time}</span>
          </div>
          
          <div className="appointment-info">
            <div className="appointment-patient">
              <span className="patient-name">{apt.patient_name}</span>
              {apt.risk_score === 'high' && (
                <span className="risk-indicator" title="Alto risco de falta">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </span>
              )}
            </div>
            <span className="appointment-type">{typeLabels[apt.type] || apt.type}</span>
          </div>

          <div className="appointment-status">
            <StatusBadge status={apt.status} />
          </div>

          <button className="appointment-action" onClick={e => { e.stopPropagation(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default AppointmentsList;
