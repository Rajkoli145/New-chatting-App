import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import { formatDistanceToNow } from '../../utils/dateUtils';

const ConversationList = ({ conversations, searchQuery, onConversationSelect }) => {
  const { selectConversation, activeConversation } = useChat();
  const { isUserOnline, getUserLastSeen } = useSocket();

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    if (!conversation?.participant) return false;
    
    const query = searchQuery.toLowerCase();
    const participantName = conversation.participant?.name?.toLowerCase() || '';
    const participantPhone = conversation.participant?.phone || '';
    const lastMessageText = conversation.lastMessage?.text?.toLowerCase() || '';
    
    return participantName.includes(query) || 
           participantPhone.includes(query) || 
           lastMessageText.includes(query);
  });

  const handleConversationClick = (conversation) => {
    selectConversation(conversation);
    onConversationSelect();
  };

  if (filteredConversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-2">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </h3>
          <p className="text-dark-400 text-sm">
            {searchQuery 
              ? 'Try a different search term'
              : 'Start a conversation by searching for users in the Users tab'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-1 p-2">
        {filteredConversations.map((conversation) => {
          if (!conversation?.participant) return null;
          
          const isActive = activeConversation?.id === conversation.id;
          const isOnline = isUserOnline(conversation.participant.id);
          const lastSeen = getUserLastSeen(conversation.participant.id);
          const hasUnreadMessages = conversation.lastMessage && 
                                   !conversation.lastMessage.isRead && 
                                   conversation.lastMessage.sender !== conversation.participant.id;

          return (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'hover:bg-dark-700 text-dark-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-dark-600 rounded-full flex items-center justify-center">
                    {conversation.participant?.avatar ? (
                      <img 
                        src={conversation.participant.avatar} 
                        alt={conversation.participant?.name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {conversation.participant?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 ${
                    isActive ? 'border-primary-600' : 'border-dark-800'
                  } ${isOnline ? 'bg-green-500' : 'bg-dark-500'}`}></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium truncate ${
                      isActive ? 'text-white' : 'text-white'
                    }`}>
                      {conversation.participant?.name || 'Unknown User'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {conversation.lastMessage && (
                        <span className={`text-xs ${
                          isActive ? 'text-primary-200' : 'text-dark-400'
                        }`}>
                          {formatDistanceToNow(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                      {hasUnreadMessages && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {conversation.lastMessage ? (
                        <p className={`text-sm truncate ${
                          isActive ? 'text-primary-200' : 'text-dark-400'
                        }`}>
                          {conversation.lastMessage.text}
                        </p>
                      ) : (
                        <p className={`text-sm italic ${
                          isActive ? 'text-primary-200' : 'text-dark-500'
                        }`}>
                          No messages yet
                        </p>
                      )}
                    </div>

                    {/* Language indicator */}
                    <div className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                      isActive 
                        ? 'bg-primary-700 text-primary-200' 
                        : 'bg-dark-600 text-dark-300'
                    }`}>
                      {conversation.participant?.preferredLanguage?.toUpperCase() || 'EN'}
                    </div>
                  </div>

                  {/* Online status text */}
                  <div className="mt-1">
                    <span className={`text-xs ${
                      isActive ? 'text-primary-300' : 'text-dark-500'
                    }`}>
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

export default ConversationList;
