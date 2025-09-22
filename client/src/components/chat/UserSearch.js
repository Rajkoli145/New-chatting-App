import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';

const UserSearch = ({ users, searchQuery, onUserSelect }) => {
  const { startConversation, searchResults } = useChat();
  const { isUserOnline, getUserLastSeen } = useSocket();

  // Use search results if there's a query, otherwise show all users
  const displayUsers = searchQuery.trim() ? searchResults : users;

  const handleUserClick = async (user) => {
    const conversation = await startConversation(user.id);
    if (conversation) {
      onUserSelect();
    }
  };

  if (displayUsers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-2">
            {searchQuery ? 'No users found' : 'No users available'}
          </h3>
          <p className="text-dark-400 text-sm">
            {searchQuery 
              ? 'Try searching by name or phone number'
              : 'No other users have joined yet'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-1 p-2">
        {displayUsers.map((user) => {
          const isOnline = isUserOnline(user.id);
          const lastSeen = getUserLastSeen(user.id);

          return (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="p-3 rounded-lg cursor-pointer hover:bg-dark-700 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-dark-600 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-dark-800 ${
                    isOnline ? 'bg-green-500' : 'bg-dark-500'
                  }`}></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-white truncate">
                      {user.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {/* Language indicator */}
                      <div className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs font-medium">
                        {user.preferredLanguage.toUpperCase()}
                      </div>
                      {/* Online status indicator */}
                      <div className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-dark-500'
                      }`}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-dark-400 truncate">
                      {user.phone}
                    </p>
                    <span className="text-xs text-dark-500 ml-2">
                      {isOnline ? (
                        'Online'
                      ) : lastSeen ? (
                        `Last seen ${formatDistanceToNow(lastSeen)}`
                      ) : (
                        'Offline'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function for date formatting
const formatDistanceToNow = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

export default UserSearch;
