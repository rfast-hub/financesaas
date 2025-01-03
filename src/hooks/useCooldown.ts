import { useState, useEffect } from 'react';

export const useCooldown = () => {
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const startCooldown = (seconds: number) => {
    setCooldownSeconds(seconds);
  };

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [cooldownSeconds]);

  return {
    cooldownSeconds,
    startCooldown,
    isInCooldown: cooldownSeconds > 0
  };
};