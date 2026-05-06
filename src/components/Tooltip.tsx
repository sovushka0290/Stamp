import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  children: ReactNode;
  content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="border-b border-dashed border-slate-500 cursor-help">
        {children}
      </span>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none font-sans"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
