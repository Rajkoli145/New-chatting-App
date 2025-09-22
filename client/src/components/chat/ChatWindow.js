import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Smile } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ onBackClick, showBackButton = false }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { user } = useAuth();
  const { activeConversation, sendMessage, getConversationMessages } = useChat();
  const { isUserOnline, startTyping, stopTyping, getTypingUsers } = useSocket();

  const messages = getConversationMessages(activeConversation?.id);
  const typingUsers = getTypingUsers(activeConversation?.id);
  const isRecipientOnline = isUserOnline(activeConversation?.participant?.id);

  // Handle typing indicators
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(activeConversation?.id, activeConversation?.participant?.id);
    } else if (!message.trim() && isTyping) {
      setIsTyping(false);
      stopTyping(activeConversation?.id, activeConversation?.participant?.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    if (message.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(activeConversation?.id, activeConversation?.participant?.id);
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, activeConversation, startTyping, stopTyping]);

  // Cleanup typing on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        stopTyping(activeConversation?.id, activeConversation?.participant?.id);
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !activeConversation) return;

    const messageText = message.trim();
    setMessage('');
    setIsTyping(false);
    stopTyping(activeConversation.id, activeConversation.participant.id);

    // Send message
    await sendMessage(activeConversation.participant.id, messageText);
    
    // Focus back on input
    messageInputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!activeConversation) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-800">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200 md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="relative">
            <div className="w-10 h-10 bg-dark-600 rounded-full flex items-center justify-center">
              {activeConversation.participant.avatar ? (
                <img 
                  src={activeConversation.participant.avatar} 
                  alt={activeConversation.participant.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold">
                  {activeConversation.participant.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800 ${
              isRecipientOnline ? 'bg-green-500' : 'bg-dark-500'
            }`}></div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white truncate">
              {activeConversation.participant.name}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-dark-400">
                {isRecipientOnline ? 'Online' : 'Offline'}
              </span>
              <span className="text-xs text-dark-500">•</span>
              <span className="text-xs text-dark-500">
                Speaks {activeConversation.participant.preferredLanguage.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages}
          currentUserId={user?.id}
          participant={activeConversation.participant}
        />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2">
          <TypingIndicator users={typingUsers} />
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-dark-700 bg-dark-800">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={messageInputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${activeConversation.participant.name}...`}
                className="w-full px-4 py-3 pr-12 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32"
                rows="1"
                style={{
                  minHeight: '48px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
              />
              <button
                type="button"
                className="absolute right-3 bottom-3 p-1 text-dark-400 hover:text-white transition-colors duration-200"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Translation Notice */}
        <div className="mt-2 text-xs text-dark-500 text-center">
          Messages are automatically translated to {activeConversation.participant.preferredLanguage.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
