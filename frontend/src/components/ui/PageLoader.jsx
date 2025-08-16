import React from 'react';
import { motion } from 'framer-motion';
import { FaFutbol } from 'react-icons/fa';

const PageLoader = ({ 
  message = "Loading...", 
  showIcon = true,
  size = "md"
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'text-4xl',
          text: 'text-lg',
          container: 'min-h-[200px]'
        };
      case 'lg':
        return {
          icon: 'text-8xl',
          text: 'text-2xl',
          container: 'min-h-screen'
        };
      default:
        return {
          icon: 'text-6xl',
          text: 'text-xl',
          container: 'min-h-[400px]'
        };
    }
  };

  const classes = getSizeClasses();

  return (
    <div className={`${classes.container} flex items-center justify-center`}>
      <div className="text-center">
        {showIcon && (
          <motion.div
            className={`${classes.icon} text-grass-400 mx-auto mb-4`}
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            <FaFutbol />
          </motion.div>
        )}
        
        <motion.p 
          className={`${classes.text} text-white/70 font-medium`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          {message}
        </motion.p>

        {/* Loading dots */}
        <div className="flex justify-center space-x-2 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-grass-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
