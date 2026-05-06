import { useState, useEffect } from 'react';

interface ScrambleTextProps {
  text: string;
  duration?: number;
  className?: string;
}

export function ScrambleText({ text, duration = 1500, className = "" }: ScrambleTextProps) {
  const chars = '0123456789ABCDEFabcdef';
  const [output, setOutput] = useState('');

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const fraction = Math.min(progress / duration, 1);

      if (fraction === 1) {
        setOutput(text);
      } else {
        const scrambled = text.split('').map((char, index) => {
          if (char === ' ') return ' ';
          // Reveal character progressively from left to right
          const startReveal = index / text.length;
          if (fraction > startReveal + 0.1) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        
        setOutput(scrambled);
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [text, duration]);

  return <span className={className}>{output}</span>;
}
