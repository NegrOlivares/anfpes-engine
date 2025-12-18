import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1); // Empezar visible inmediatamente

  useEffect(() => {
    // Fade out
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 1500);

    // Remove from DOM
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="splash-screen"
      style={{
        opacity,
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      <img src="/images/portada.png" alt="Cesante Manager" />
    </div>
  );
}
