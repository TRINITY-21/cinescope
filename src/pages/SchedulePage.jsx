import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useApiQuery } from '../hooks/useApiQuery';
import { endpoints } from '../api/endpoints';
import Container from '../components/ui/Container';
import Loader from '../components/ui/Loader';
import DatePicker from '../components/schedule/DatePicker';
import ScheduleTimeline from '../components/schedule/ScheduleTimeline';

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [country, setCountry] = useState('US');

  const { data: episodes, isLoading } = useApiQuery(
    endpoints.schedule(country, selectedDate)
  );

  useEffect(() => {
    document.title = 'Schedule — CineScope';
    return () => { document.title = 'CineScope'; };
  }, []);

  const filteredEpisodes = episodes?.filter((ep) => ep.show?.image) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pt-20 sm:pt-24 pb-8 sm:pb-12"
    >
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">TV Schedule</h1>
            <p className="text-text-secondary mt-1">See what's airing today and this week</p>
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="glass-subtle border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent-violet/50 focus:shadow-glow-violet w-fit transition-all"
          >
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="JP">Japan</option>
          </select>
        </div>

        <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

        <div className="mt-8">
          {isLoading ? (
            <Loader />
          ) : (
            <ScheduleTimeline episodes={filteredEpisodes} />
          )}
        </div>
      </Container>
    </motion.div>
  );
}
