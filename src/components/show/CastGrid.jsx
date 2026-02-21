import CastCard from './CastCard';

export default function CastGrid({ cast }) {
  if (!cast || cast.length === 0) return <p className="text-text-secondary">No cast information available.</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {cast.map(({ person, character }, index) => (
        <CastCard key={`${person.id}-${index}`} person={person} character={character} />
      ))}
    </div>
  );
}
