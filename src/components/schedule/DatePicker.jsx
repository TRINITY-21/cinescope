import { addDays, format, isToday } from 'date-fns';
import HorizontalScroll from '../ui/HorizontalScroll';

export default function DatePicker({ selectedDate, onDateChange }) {
  const dates = [];
  for (let i = -3; i <= 3; i++) {
    dates.push(addDays(new Date(), i));
  }

  return (
    <HorizontalScroll gapClass="gap-2" className="py-2" showButtons={false}>
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
                ? 'bg-accent-peach text-white shadow-lg shadow-accent-peach/25'
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
    </HorizontalScroll>
  );
}
