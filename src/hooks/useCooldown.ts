import { useState, useCallback } from 'react';

export const useCooldown = (initialCooldown = 60) => {
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isInCooldown, setIsInCooldown] = useState(false);

  const startCooldown = useCallback((seconds: number = initialCooldown) => {
    setCooldownSeconds(seconds);
    setIsInCooldown(true);

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsInCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialCooldown]);

  return {
    cooldownSeconds,
    isInCooldown,
    startCooldown
  };
};