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
    <div className="space-y-6">
      {Object.entries(grouped).map(([type, people]) => (
        <div key={type}>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">{type}</h4>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <Link
                key={person.id}
                to={`/person/${person.id}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated/50 hover:bg-bg-elevated transition-colors group"
              >
                {person.image && (
                  <img
                    src={person.image.medium}
                    alt={person.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-text-secondary group-hover:text-accent-violet transition-colors">
                  {person.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
