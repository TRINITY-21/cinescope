import { Link } from 'react-router-dom';

export default function CrewList({ crew }) {
  if (!crew || crew.length === 0) return <p className="text-text-secondary">No crew information available.</p>;

  const grouped = {};
  crew.forEach(({ type, person }) => {
    if (!grouped[type]) grouped[type] = [];
    if (!grouped[type].find((p) => p.id === person.id)) {
      grouped[type].push(person);
    }
  });

  return (
    <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
      {Object.entries(grouped).map(([type, people]) => (
        <div key={type} className="py-5 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 md:gap-8">
          <p className="text-meta uppercase tracking-widest text-text-muted font-semibold md:pt-1">
            {type}
            <span className="ml-2 font-mono tabular-nums text-text-muted/60 normal-case tracking-normal">
              {String(people.length).padStart(2, '0')}
            </span>
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {people.map((person, i) => (
              <Link
                key={person.id}
                to={`/person/${person.id}`}
                className="inline-flex items-center gap-2 group"
              >
                {person.image && (
                  <img
                    src={person.image.medium}
                    alt={person.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-white/[0.06] group-hover:ring-white/30 transition-all"
                  />
                )}
                <span className="text-body-sm text-white group-hover:text-accent-peach transition-colors">
                  {person.name}
                </span>
                {i < people.length - 1 && (
                  <span className="text-text-muted/40 ml-1">·</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
