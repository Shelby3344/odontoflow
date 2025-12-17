import { ScheduleCalendar } from '../../components/schedule/ScheduleCalendar';

export function SchedulePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Agenda
      </h1>
      <div className="h-[calc(100vh-200px)]">
        <ScheduleCalendar />
      </div>
    </div>
  );
}
