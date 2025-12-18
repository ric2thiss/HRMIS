import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveAnnouncements } from '../../api/announcement/announcement';

function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnnouncements();
    
    // Load dismissed announcements from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    setDismissedIds(dismissed);
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await getActiveAnnouncements();
      const activeAnnouncements = response.announcements || [];
      setAnnouncements(activeAnnouncements);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const handleView = (id) => {
    // Dismiss when viewing
    handleDismiss(id);
    navigate(`/announcements/${id}`);
  };

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(
    (announcement) => !dismissedIds.includes(announcement.id)
  );

  // Don't render anything if loading or no visible announcements
  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 mb-3">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className="bg-blue-50 border-l-3 border-blue-500 px-3 py-2 rounded flex items-center justify-between gap-3"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-medium text-blue-900 truncate">
              {announcement.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => handleView(announcement.id)}
              className="px-2 py-1 text-xs font-medium text-blue-600 rounded transition-colors"
              title="View announcement"
            >
              View
            </button>
            <button
              onClick={() => handleDismiss(announcement.id)}
              className="p-1 text-gray-400 rounded transition-colors"
              title="Dismiss"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AnnouncementBanner;

