import { format, addDays, isToday } from 'date-fns';

export default function DatePicker({ selectedDate, onDateChange }) {
  const dates = [];
  for (let i = -3; i <= 3; i++) {
    dates.push(addDays(new Date(), i));
  }

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
      {dates.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const isSelected = dateStr === selectedDate;
        const today = isToday(date);

        return (
          <button
            key={dateStr}
            onClick={() => onDateChange(dateStr)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-center transition-all min-w-[80px] ${
              isSelected
                ? 'bg-accent-violet text-white shadow-lg shadow-accent-violet/25'
                : 'glass hover:bg-bg-elevated/90'
            }`}
          >
            <p className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
              {today ? 'Today' : format(date, 'EEE')}
            </p>
            <p className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-text-primary'}`}>
              {format(date, 'MMM d')}
            </p>
          </button>
        );
      })}
    </div>
  );
}
