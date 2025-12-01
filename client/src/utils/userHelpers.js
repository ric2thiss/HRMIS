/**
 * Get user's primary role name
 * Checks both belongsTo (user.role.name) and many-to-many (user.roles[0].name) relationships
 * @param {Object} user - User object
 * @returns {string|null} Role name or null
 */
export const getUserRole = (user) => {
  if (!user) return null;
  
  // Check belongsTo relationship first (new schema)
  if (user.role?.name) {
    return user.role.name;
  }
  
  // Fallback to many-to-many relationship (backward compatibility)
  if (user.roles?.[0]?.name) {
    return user.roles[0].name;
  }
  
  return null;
};

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {string|string[]} roleNames - Role name(s) to check
 * @returns {boolean}
 */
export const userHasRole = (user, roleNames) => {
  const userRole = getUserRole(user);
  if (!userRole) return false;
  
  const rolesToCheck = Array.isArray(roleNames) ? roleNames : [roleNames];
  return rolesToCheck.includes(userRole);
};

/**
 * Check if user is HR or Admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isHROrAdmin = (user) => {
  return userHasRole(user, ['hr', 'admin']);
};

/**
 * Check if user has access to system settings
 * Admin always has access, HR only if granted by admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const hasSystemSettingsAccess = (user) => {
  if (!user) return false;
  
  const role = getUserRole(user);
  
  // Admin always has access
  if (role === 'admin') {
    return true;
  }
  
  // HR only has access if granted by admin
  if (role === 'hr') {
    return user.has_system_settings_access === true;
  }
  
  return false;
};

