import React from 'react';

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) {
    return null;
  }

  const getUsersText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing`;
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing`;
    } else {
      return `${users[0].userName} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <div className="flex items-center space-x-3 fade-in">
      <div className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-semibold">
          {users[0]?.userName?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
      
      <div className="bg-dark-700 rounded-2xl px-4 py-2">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-dark-300">{getUsersText()}</span>
          <div className="typing-dots ml-2">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
