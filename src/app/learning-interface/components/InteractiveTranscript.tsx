interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
  startTime: number;
}

interface InteractiveTranscriptProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

const InteractiveTranscript = ({ segments, currentTime, onSeek }: InteractiveTranscriptProps) => {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-foreground">Interaktiv Transkript</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Matnda qidirish..."
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => {
          const isActive = currentTime >= segment.startTime && currentTime < segment.startTime + 15;
          return (
            <button
              key={segment.id}
              onClick={() => onSeek(segment.startTime)}
              className={`w-full text-left p-3 rounded-md transition-smooth ${
                isActive
                  ? 'bg-primary/10 border-l-4 border-primary' :'hover:bg-muted border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className={`text-xs font-data flex-shrink-0 mt-0.5 ${
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}>
                  {segment.timestamp}
                </span>
                <p className={`text-sm leading-relaxed ${
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {segment.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveTranscript;