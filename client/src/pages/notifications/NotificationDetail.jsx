import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AppLayout from '../../components/Layout/AppLayout';
import LoadingScreen from '../../components/Loading/LoadingScreen';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import { getNotification, markAsRead, deleteNotification } from '../../api/notification/notification';
import { useNotificationStore } from '../../stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { getNotificationRedirectUrl } from '../../utils/notificationHelpers';

function NotificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const showError = useNotificationStore((state) => state.showError);
  const showSuccess = useNotificationStore((state) => state.showSuccess);
  
  const [notification, setNotification] = useState(null);
  const [loadingNotification, setLoadingNotification] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user && id) {
      loadNotification();
    }
  }, [user, id]);

  const loadNotification = async () => {
    try {
      setLoadingNotification(true);
      const response = await getNotification(id);
      setNotification(response.notification);
      
      // Mark as read if unread
      if (response.notification && !response.notification.is_read) {
        try {
          await markAsRead(id);
          setNotification(prev => ({
            ...prev,
            is_read: true,
            read_at: new Date().toISOString(),
          }));
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    } catch (error) {
      console.error('Error loading notification:', error);
      showError('Failed to load notification');
      navigate('/notifications');
    } finally {
      setLoadingNotification(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteNotification(id);
        showSuccess('Notification deleted');
        navigate('/notifications');
      } catch (error) {
        console.error('Error deleting notification:', error);
        showError('Failed to delete notification');
      }
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = "w-12 h-12";
    switch (type) {
      case 'success':
        return (
          <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-green-600`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="flex-shrink-0 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-red-600`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-yellow-600`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-blue-600`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const formatFullDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (loading || !user) {
    return <LoadingScreen />;
  }

  if (loadingNotification) {
    return (
      <AppLayout user={user} logout={logout} loading={loading} title="Notification">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner text="Loading notification..." />
        </div>
      </AppLayout>
    );
  }

  if (!notification) {
    return (
      <AppLayout user={user} logout={logout} loading={loading} title="Notification">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <p className="text-gray-600">Notification not found</p>
          <button
            onClick={() => navigate('/notifications')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Notifications
          </button>
        </div>
      </AppLayout>
    );
  }

  const redirectUrl = getNotificationRedirectUrl(notification.entity_type, notification.entity_id);

  return (
    <AppLayout user={user} logout={logout} loading={loading} title="Notification">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4 flex-1">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {notification.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span>{formatFullDate(notification.created_at)}</span>
                  <span className="text-gray-400">•</span>
                  <span>{formatTime(notification.created_at)}</span>
                  {notification.is_read && notification.read_at && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-green-600">Read {formatTime(notification.read_at)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete notification"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                {notification.message}
              </p>
            </div>
          </div>

          {/* Entity Information */}
          {notification.entity_type && notification.entity_id && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Related to:</p>
              <p className="font-semibold text-gray-900 capitalize">
                {notification.entity_type}
                {redirectUrl && (
                  <Link
                    to={redirectUrl}
                    className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details →
                  </Link>
                )}
              </p>
            </div>
          )}

          {/* Additional Data */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Additional Information:</p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(notification.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Notifications
            </button>
            {redirectUrl && (
              <Link
                to={redirectUrl}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                View Related Item
              </Link>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default NotificationDetail;

