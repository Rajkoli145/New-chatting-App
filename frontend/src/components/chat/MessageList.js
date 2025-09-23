import React, { useEffect, useRef, useState } from 'react';
import { formatMessageTime, formatChatDate, shouldShowDateSeparator } from '../../utils/dateUtils';
import { Check, CheckCheck, Globe, ChevronDown } from 'lucide-react';

const MessageList = ({ messages, currentUserId, participant }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const lastMessageCountRef = useRef(0);

  // Check if user is near the bottom of the chat
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Handle scroll events to show/hide scroll button
  const handleScroll = () => {
    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowScrollButton(false);
    }
  };

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (messages && messages.length > 0 && lastMessageCountRef.current === 0) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }, 100);
    }
  }, [messages]);

  // Auto-scroll logic: only for new messages when user is at bottom or it's their own message
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const isNewMessage = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;
    
    if (isNewMessage) {
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage?.sender?.id === currentUserId;
      const userAtBottom = isNearBottom();
      
      // Auto-scroll if it's user's own message OR user is already at bottom
      if (isOwnMessage || userAtBottom) {
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      }
    }
  }, [messages, currentUserId]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-dark-400" />
          </div>
          <h3 className="text-white font-medium mb-2">Start your conversation</h3>
          <p className="text-dark-400 text-sm mb-4">
            Send a message to {participant.name} and it will be automatically translated based on each person's preferred language.
          </p>
          <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
            <p className="text-xs text-dark-400">
              🌍 You'll see all messages in your preferred language<br/>
              📱 {participant?.name || 'User'} will see all messages in their preferred language<br/>
              🔄 Messages are translated automatically based on your language settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div 
        ref={messagesContainerRef}
        className="h-full overflow-y-auto p-4 space-y-1 scroll-smooth"
        onScroll={handleScroll}
        style={{ maxHeight: '100%' }}
      >
      {messages.map((message, index) => {
        const isOwn = message.sender.id === currentUserId;
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
        const showAvatar = !isOwn && (!messages[index + 1] || messages[index + 1].sender.id !== message.sender.id);

        return (
          <div key={`${message.id}-${index}`}>
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
                        {participant?.name?.charAt(0)?.toUpperCase() || '?'}
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
                    {!isOwn && message.senderLanguage && (
                      <div className="flex items-center space-x-1 text-xs text-dark-400">
                        <Globe className={`w-3 h-3 ${!message.isTranslated && message.senderLanguage !== message.recipientLanguage ? 'animate-spin' : ''}`} />
                        <span>
                          {message.isTranslated && message.translatedText !== message.originalText 
                            ? `Translated from ${message?.senderLanguage?.toUpperCase() || 'Unknown'}`
                            : message.senderLanguage !== message.recipientLanguage 
                              ? 'Translating...'
                              : `In ${message?.senderLanguage?.toUpperCase() || 'Unknown'}`
                          }
                        </span>
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
                        {message.isOptimistic ? (
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : message.isDelivered ? (
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
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={scrollToBottom}
            className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200 flex items-center justify-center"
            title="Scroll to bottom"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageList;
