'use client';

import { useState, useEffect } from 'react';

interface ClockTimerProps {
  endTime: Date | string;
  className?: string;
  size?: number;
}

export function ClockTimer({ endTime, className = "", size = 32 }: ClockTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime);
      const now = new Date();
      const difference = end.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
      
      setIsExpired(false);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="-6 -6 36 36" 
        width={size} 
        height={size} 
        fill={isExpired ? "#EF4444" : "#10B981"} 
        style={{ opacity: 1, transform: "rotate(180deg)" }}
      >
        <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z"/>
        <rect width="2" height="7" x="11" y="6" rx="1">
          <animateTransform 
            attributeName="transform" 
            dur="9s" 
            repeatCount="indefinite" 
            type="rotate" 
            values="0 12 12;360 12 12"
          />
        </rect>
        <rect width="2" height="9" x="11" y="11" rx="1">
          <animateTransform 
            attributeName="transform" 
            dur="0.75s" 
            repeatCount="indefinite" 
            type="rotate" 
            values="0 12 12;360 12 12"
          />
        </rect>
      </svg>
      <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-emerald-600'}`}>
        {timeLeft}
      </span>
    </div>
  );
}