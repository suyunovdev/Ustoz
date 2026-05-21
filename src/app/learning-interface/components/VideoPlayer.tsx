'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  onToggleSidebar: () => void;
}

const VideoPlayer = ({
  videoUrl,
  title,
  currentTime,
  onTimeUpdate,
  playbackSpeed,
  onSpeedChange,
  onToggleSidebar,
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState('1080p');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const qualities = ['360p', '480p', '720p', '1080p'];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  return (
    <div className="relative aspect-video bg-black group">
      {/* Video Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Icon name="PlayCircleIcon" size={80} className="text-white opacity-50 mx-auto" />
          <p className="text-white text-sm">Video Player (Demo)</p>
          <p className="text-white text-xs opacity-70">{title}</p>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md bg-black/50 hover:bg-black/70 transition-smooth"
          >
            <Icon name="Bars3Icon" size={20} className="text-white" />
          </button>
          <h3 className="text-white font-medium text-sm">{title}</h3>
          <div className="w-10" />
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-primary hover:bg-primary/90 transition-smooth"
          >
            <Icon
              name={isPlaying ? 'PauseIcon' : 'PlayIcon'}
              size={32}
              className="text-primary-foreground"
              variant="solid"
            />
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: '35%' }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-md hover:bg-white/10 transition-smooth"
              >
                <Icon
                  name={isPlaying ? 'PauseIcon' : 'PlayIcon'}
                  size={20}
                  className="text-white"
                  variant="solid"
                />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-md hover:bg-white/10 transition-smooth"
                >
                  <Icon
                    name={isMuted || volume === 0 ? 'SpeakerXMarkIcon' : 'SpeakerWaveIcon'}
                    size={20}
                    className="text-white"
                  />
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <span className="text-white text-sm font-data">6:24 / 18:20</span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Speed Control */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-smooth text-white text-sm font-data"
                >
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-card rounded-md shadow-warm-lg overflow-hidden">
                    {speeds.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          onSpeedChange(speed);
                          setShowSpeedMenu(false);
                        }}
                        className={`block w-full px-4 py-2 text-sm text-left transition-smooth ${
                          speed === playbackSpeed
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality Control */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-smooth text-white text-sm"
                >
                  {quality}
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-card rounded-md shadow-warm-lg overflow-hidden">
                    {qualities.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q);
                          setShowQualityMenu(false);
                        }}
                        className={`block w-full px-4 py-2 text-sm text-left transition-smooth ${
                          q === quality
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-md hover:bg-white/10 transition-smooth"
              >
                <Icon
                  name={isFullscreen ? 'ArrowsPointingInIcon' : 'ArrowsPointingOutIcon'}
                  size={20}
                  className="text-white"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;