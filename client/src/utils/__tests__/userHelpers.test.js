import { describe, it, expect } from 'vitest';
import { 
  getUserRole, 
  userHasRole, 
  isHROrAdmin, 
  hasSystemSettingsAccess 
} from '../userHelpers';

describe('userHelpers', () => {
  describe('getUserRole', () => {
    it('returns null when user is null or undefined', () => {
      expect(getUserRole(null)).toBe(null);
      expect(getUserRole(undefined)).toBe(null);
    });

    it('returns role name from belongsTo relationship', () => {
      const user = {
        role: { name: 'admin' }
      };
      expect(getUserRole(user)).toBe('admin');
    });

    it('returns role name from many-to-many relationship as fallback', () => {
      const user = {
        roles: [{ name: 'hr' }]
      };
      expect(getUserRole(user)).toBe('hr');
    });

    it('prioritizes belongsTo over many-to-many relationship', () => {
      const user = {
        role: { name: 'admin' },
        roles: [{ name: 'hr' }]
      };
      expect(getUserRole(user)).toBe('admin');
    });

    it('returns null when user has no role', () => {
      const user = {};
      expect(getUserRole(user)).toBe(null);
    });
  });

  describe('userHasRole', () => {
    it('returns false when user is null', () => {
      expect(userHasRole(null, 'admin')).toBe(false);
    });

    it('returns true when user has the specified role', () => {
      const user = {
        role: { name: 'admin' }
      };
      expect(userHasRole(user, 'admin')).toBe(true);
    });

    it('returns false when user does not have the specified role', () => {
      const user = {
        role: { name: 'employee' }
      };
      expect(userHasRole(user, 'admin')).toBe(false);
    });

    it('checks multiple roles (array)', () => {
      const user = {
        role: { name: 'hr' }
      };
      expect(userHasRole(user, ['admin', 'hr'])).toBe(true);
    });

    it('returns false when user role not in array', () => {
      const user = {
        role: { name: 'employee' }
      };
      expect(userHasRole(user, ['admin', 'hr'])).toBe(false);
    });
  });

  describe('isHROrAdmin', () => {
    it('returns true for admin user', () => {
      const user = {
        role: { name: 'admin' }
      };
      expect(isHROrAdmin(user)).toBe(true);
    });

    it('returns true for hr user', () => {
      const user = {
        role: { name: 'hr' }
      };
      expect(isHROrAdmin(user)).toBe(true);
    });

    it('returns false for employee user', () => {
      const user = {
        role: { name: 'employee' }
      };
      expect(isHROrAdmin(user)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(isHROrAdmin(null)).toBe(false);
    });
  });

  describe('hasSystemSettingsAccess', () => {
    it('returns false when user is null', () => {
      expect(hasSystemSettingsAccess(null)).toBe(false);
    });

    it('returns true for admin user', () => {
      const user = {
        role: { name: 'admin' }
      };
      expect(hasSystemSettingsAccess(user)).toBe(true);
    });

    it('returns true for hr user with access granted', () => {
      const user = {
        role: { name: 'hr' },
        has_system_settings_access: true
      };
      expect(hasSystemSettingsAccess(user)).toBe(true);
    });

    it('returns false for hr user without access granted', () => {
      const user = {
        role: { name: 'hr' },
        has_system_settings_access: false
      };
      expect(hasSystemSettingsAccess(user)).toBe(false);
    });

    it('returns false for employee user', () => {
      const user = {
        role: { name: 'employee' }
      };
      expect(hasSystemSettingsAccess(user)).toBe(false);
    });
  });
});

