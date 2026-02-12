export default function Loader({ fullScreen = false }) {
  const dots = (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-accent-violet animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2.5 h-2.5 rounded-full bg-accent-violet animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2.5 h-2.5 rounded-full bg-accent-violet animate-bounce" />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
        {dots}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-20">{dots}</div>;
}
