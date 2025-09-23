import React, { useState, useEffect } from 'react';
import { Search, Settings, MessageCircle, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useSocket } from '../../contexts/SocketContext';
import ConversationList from './ConversationList';
import UserSearch from './UserSearch';

const Sidebar = ({ onProfileClick, onConversationSelect }) => {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'users'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { user, logout } = useAuth();
  const { conversations, users, searchUsers, unreadCount } = useChat();
  const { isConnected } = useSocket();

  // Handle search
  useEffect(() => {
    if (activeTab === 'users' && searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, activeTab, searchUsers]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col h-full bg-dark-800">
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-semibold truncate">{user?.name}</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 online-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs text-dark-300">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSearchToggle}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200"
            >
              {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
            <button
              onClick={onProfileClick}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mb-4 fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
              <input
                type="text"
                placeholder={activeTab === 'chats' ? 'Search conversations...' : 'Search users by name or phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => handleTabChange('chats')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'chats'
                ? 'bg-primary-600 text-white'
                : 'text-dark-300 hover:text-white hover:bg-dark-600'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chats</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'users'
                ? 'bg-primary-600 text-white'
                : 'text-dark-300 hover:text-white hover:bg-dark-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chats' ? (
          <ConversationList 
            conversations={conversations}
            searchQuery={searchQuery}
            onConversationSelect={onConversationSelect}
          />
        ) : (
          <UserSearch 
            users={users}
            searchQuery={searchQuery}
            onUserSelect={onConversationSelect}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700">
        <button
          onClick={logout}
          className="w-full py-2 px-4 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
