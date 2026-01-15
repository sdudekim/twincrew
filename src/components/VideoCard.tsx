import React, { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface VideoCardProps {
  src: string;
  className?: string;
  gradientClasses: string;
  id?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ src, className, gradientClasses, id }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [src]);

  return (
    <div 
      id={id}
      className={`w-40 h-60 ${gradientClasses} rounded-3xl border border-white/25 backdrop-blur-sm overflow-hidden flex-shrink-0 shadow-lg relative ${className || ''}`}
    >
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Skeleton className="w-full h-full rounded-3xl" />
        </div>
      )}
      
      {hasError ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white/70 p-4">
            <div className="text-sm opacity-75">Video unavailable</div>
          </div>
        </div>
      ) : (
        <video 
          ref={videoRef}
          className="w-full h-full object-cover rounded-3xl"
          autoPlay 
          loop 
          muted 
          playsInline
          preload="metadata"
          style={{ display: isLoading ? 'none' : 'block' }}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default VideoCard;