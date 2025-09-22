import React, { useEffect, useRef } from 'react';
import { formatMessageTime, formatChatDate, shouldShowDateSeparator } from '../../utils/dateUtils';
import { Check, CheckCheck, Globe } from 'lucide-react';

const MessageList = ({ messages, currentUserId, participant }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-dark-400" />
          </div>
          <h3 className="text-white font-medium mb-2">Start your conversation</h3>
          <p className="text-dark-400 text-sm mb-4">
            Send a message to {participant.name} and it will be automatically translated to their preferred language.
          </p>
          <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
            <p className="text-xs text-dark-400">
              🌍 Your messages will appear in your language<br/>
              📱 {participant.name} will see them in {participant.preferredLanguage.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-1"
    >
      {messages.map((message, index) => {
        const isOwn = message.sender.id === currentUserId;
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
        const showAvatar = !isOwn && (!messages[index + 1] || messages[index + 1].sender.id !== message.sender.id);

        return (
          <div key={message.id}>
            {/* Date Separator */}
            {showDateSeparator && (
              <div className="flex items-center justify-center my-4">
                <div className="bg-dark-700 px-3 py-1 rounded-full">
                  <span className="text-xs text-dark-300 font-medium">
                    {formatChatDate(message.createdAt)}
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            <div className={`flex items-end space-x-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {/* Avatar for received messages */}
              {!isOwn && (
                <div className={`w-8 h-8 rounded-full flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                  {participant.avatar ? (
                    <img 
                      src={participant.avatar} 
                      alt={participant.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'order-1' : 'order-2'}`}>
                <div className={`relative px-4 py-2 rounded-2xl message-bubble ${
                  isOwn 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-dark-700 text-white'
                }`}>
                  {/* Message Content */}
                  <div className="space-y-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.displayText || message.translatedText || message.originalText}
                    </p>
                    
                    {/* Translation indicator */}
                    {message.isTranslated && !isOwn && (
                      <div className="flex items-center space-x-1 text-xs text-dark-400">
                        <Globe className="w-3 h-3" />
                        <span>Translated from {message.senderLanguage.toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  {/* Message Info */}
                  <div className={`flex items-center justify-end space-x-1 mt-1 ${
                    isOwn ? 'text-primary-200' : 'text-dark-400'
                  }`}>
                    <span className="text-xs">
                      {formatMessageTime(message.createdAt)}
                    </span>
                    
                    {/* Message Status for own messages */}
                    {isOwn && (
                      <div className="flex items-center">
                        {message.isDelivered ? (
                          message.isRead ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : (
                            <CheckCheck className="w-3 h-3" />
                          )
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Original text tooltip for translated messages */}
                {message.isTranslated && isOwn && message.originalText !== message.translatedText && (
                  <div className="mt-1 text-xs text-dark-500 text-right">
                    Original: {message.originalText}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
