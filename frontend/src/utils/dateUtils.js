// Date utility functions for the chat application

export const formatDistanceToNow = (date) => {
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
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}w ago`;
  }
};

export const formatMessageTime = (date) => {
  const messageDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

  const timeString = messageDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (messageDay.getTime() === today.getTime()) {
    return timeString;
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return `Yesterday ${timeString}`;
  } else if (now - messageDate < 7 * 24 * 60 * 60 * 1000) {
    return `${messageDate.toLocaleDateString('en-US', { weekday: 'short' })} ${timeString}`;
  } else {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: now.getFullYear() !== messageDate.getFullYear() ? 'numeric' : undefined
    });
  }
};

export const formatChatDate = (date) => {
  const messageDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

  if (messageDay.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else if (now - messageDate < 7 * 24 * 60 * 60 * 1000) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return messageDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: now.getFullYear() !== messageDate.getFullYear() ? 'numeric' : undefined
    });
  }
};

export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const shouldShowDateSeparator = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;
  return !isSameDay(currentMessage.createdAt, previousMessage.createdAt);
};
