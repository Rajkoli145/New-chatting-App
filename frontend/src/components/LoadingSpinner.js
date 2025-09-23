import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900">
      <div className="flex flex-col items-center space-y-4">
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className="w-full h-full border-4 border-dark-600 border-t-primary-500 rounded-full"></div>
        </div>
        {text && (
          <p className="text-dark-300 text-sm font-medium">{text}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
