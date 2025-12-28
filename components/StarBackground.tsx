
import React, { useEffect, useState } from 'react';

const StarBackground: React.FC = () => {
  const [stars, setStars] = useState<{ top: string; left: string; size: string; duration: string }[]>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: 150 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3}px`,
      duration: `${2 + Math.random() * 5}s`,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="stars-container">
      {stars.map((star, i) => (
        <div
          key={i}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            // @ts-ignore
            '--duration': star.duration,
          }}
        />
      ))}
    </div>
  );
};

export default StarBackground;
