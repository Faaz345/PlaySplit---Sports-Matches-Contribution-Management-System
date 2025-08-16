import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaFutbol, 
  FaRunning, 
  FaTshirt, 
  FaHandPaper,
  FaCarrot as FaCone,
  FaStopwatch,
  FaAward,
  FaFlag
} from 'react-icons/fa';

const FloatingElements = () => {
  const elements = [
    { icon: FaFutbol, size: 60, color: '#22c55e' },
    { icon: FaRunning, size: 45, color: '#84cc16' },
    { icon: FaTshirt, size: 50, color: '#65a30d' },
    { icon: FaHandPaper, size: 40, color: '#4d7c0f' },
    { icon: FaCone, size: 35, color: '#f97316' },
    { icon: FaStopwatch, size: 42, color: '#06b6d4' },
    { icon: FaAward, size: 48, color: '#f59e0b' },
    { icon: FaFlag, size: 38, color: '#ef4444' },
  ];


  const getFloatAnimation = (index) => ({
    y: [0, -20, 0],
    rotate: [0, 10, -10, 0],
    scale: [1, 1.1, 1],
    transition: {
      duration: 6 + (index * 0.5),
      repeat: Infinity,
      ease: "easeInOut",
      delay: index * 0.8
    }
  });

  const getInitialPosition = (index) => {
    // Distribute elements around the screen edges
    const positions = [
      { x: '10%', y: '20%' },
      { x: '85%', y: '15%' },
      { x: '15%', y: '70%' },
      { x: '80%', y: '65%' },
      { x: '5%', y: '45%' },
      { x: '90%', y: '40%' },
      { x: '25%', y: '10%' },
      { x: '70%', y: '85%' },
    ];
    return positions[index] || { x: '50%', y: '50%' };
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((Element, index) => {
        const position = getInitialPosition(index);
        const IconComponent = Element.icon;
        
        return (
          <motion.div
            key={index}
            className="absolute opacity-10 hover:opacity-20 transition-opacity duration-500"
            style={{
              left: position.x,
              top: position.y,
              color: Element.color,
              fontSize: `${Element.size}px`
            }}
            animate={getFloatAnimation(index)}
            whileHover={{
              scale: 1.3,
              opacity: 0.3,
              rotate: 360,
              transition: { duration: 0.5 }
            }}
          >
            <IconComponent />
          </motion.div>
        );
      })}

      {/* Animated background gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-grass-500/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-400/5 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.1, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-400/3 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
      />

      {/* Football field lines pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="field-lines" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <rect width="200" height="200" fill="none" />
              <path d="M0 100 L200 100" stroke="currentColor" strokeWidth="1" />
              <path d="M100 0 L100 200" stroke="currentColor" strokeWidth="1" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#field-lines)" />
        </svg>
      </div>
    </div>
  );
};

export default FloatingElements;
