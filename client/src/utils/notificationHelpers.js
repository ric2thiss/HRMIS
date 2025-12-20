/**
 * Get redirect URL based on notification entity type and ID
 * @param {string} entityType - The entity type (e.g., 'pds', 'leave', 'announcement')
 * @param {number} entityId - The entity ID
 * @returns {string|null} The redirect URL or null if no redirect is available
 */
export const getNotificationRedirectUrl = (entityType, entityId) => {
  if (!entityType || !entityId) {
    return null;
  }

  switch (entityType) {
    case 'pds':
      return `/my-pds`;
    case 'leave':
      return `/leave-application/${entityId}/track`;
    case 'announcement':
      return `/announcements/${entityId}`;
    default:
      return null;
  }
};

