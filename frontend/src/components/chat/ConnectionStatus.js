import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus = ({ isConnected }) => {
  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">
          Disconnected from chat server. Trying to reconnect...
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
