import React from 'react';
import { motion } from 'framer-motion';
import { FaFutbol } from 'react-icons/fa';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'text-grass-400', 
  showText = true, 
  text = 'Loading...',
  type = 'spin' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  if (type === 'football') {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <motion.div
          className={`${sizeClasses[size]} ${color}`}
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
            scale: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <FaFutbol className="w-full h-full" />
        </motion.div>
        {showText && (
          <motion.p 
            className={`${textSizes[size]} ${color} font-medium`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 bg-grass-400 rounded-full`}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          ))}
        </div>
        {showText && (
          <p className={`${textSizes[size]} ${color} font-medium`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <motion.div
          className={`${sizeClasses[size]} bg-grass-400 rounded-full`}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {showText && (
          <p className={`${textSizes[size]} ${color} font-medium`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`${sizeClasses[size]} relative`}>
        <motion.div
          className={`absolute inset-0 border-2 border-transparent border-t-grass-400 border-r-grass-400 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className={`absolute inset-1 border-2 border-transparent border-b-grass-300 border-l-grass-300 rounded-full`}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {showText && (
        <motion.p 
          className={`${textSizes[size]} ${color} font-medium`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
