/**
 * Construct image URL - handle both full URLs and relative paths
 * @param {string} imagePath - The image path from the database
 * @returns {string|null} - The full image URL or null if no path provided
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // If it's already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    try {
      const url = new URL(imagePath);
      // If it's localhost without a port, add the port from baseUrl
      if (url.hostname === 'localhost' && !url.port) {
        const baseUrlObj = new URL(cleanBaseUrl);
        if (baseUrlObj.port) {
          url.port = baseUrlObj.port;
          return url.toString();
        }
      }
      return imagePath;
    } catch (e) {
      // If URL parsing fails, fall through to relative path handling
    }
  }
  
  // Storage::url() returns paths like "/storage/announcements/..."
  // We need to prepend the base URL - use the same base URL as axios
  // Ensure the path starts with / if it doesn't already
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  // Combine base URL with path
  return `${cleanBaseUrl}${cleanPath}`;
};

