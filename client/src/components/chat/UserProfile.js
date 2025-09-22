import React, { useState } from 'react';
import { X, User, Phone, Globe, Edit2, Save, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' }
];

const UserProfile = ({ user, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    preferredLanguage: user?.preferredLanguage || 'en'
  });
  const [isSaving, setIsSaving] = useState(false);

  const { updateProfile, logout } = useAuth();

  const handleSave = async () => {
    if (!editData.name.trim()) return;

    setIsSaving(true);
    try {
      await updateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: user?.name || '',
      preferredLanguage: user?.preferredLanguage || 'en'
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getLanguageName = (code) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : (code?.toUpperCase() || 'Unknown');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-3xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-dark-700 hover:bg-dark-600 p-2 rounded-full border-2 border-dark-800 transition-colors duration-200">
                <Edit2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              ) : (
                <div className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
                  {user?.name}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <div className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-400">
                {user?.phone}
                <span className="ml-2 text-xs text-dark-500">(Cannot be changed)</span>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Preferred Language
              </label>
              {isEditing ? (
                <select
                  value={editData.preferredLanguage}
                  onChange={(e) => setEditData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-dark-700">
                      {lang.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white">
                  {getLanguageName(user?.preferredLanguage)}
                </div>
              )}
              <p className="mt-1 text-xs text-dark-400">
                Messages will be automatically translated to this language
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isEditing ? (
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={!editData.name.trim() || isSaving}
                  className="flex-1 flex items-center justify-center py-2 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-center py-2 px-4 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors duration-200"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-2 px-4 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
