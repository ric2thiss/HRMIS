import api from '../axios';

/**
 * Update a user account
 * @param {number} userId - User ID to update
 * @param {Object} data - Update data
 * @param {string} data.firstName - User's first name
 * @param {string} [data.middleInitial] - User's middle initial (optional)
 * @param {string} data.lastName - User's last name
 * @param {string} data.email - User's email
 * @param {string} [data.password] - User's password (optional)
 * @param {number} data.positionId - Position ID
 * @param {number} data.roleId - Role ID
 * @param {number} data.projectId - Project ID
 * @param {number} [data.officeId] - Office ID (optional)
 * @param {number} [data.employmentTypeId] - Employment Type ID (optional)
 * @param {number[]} [data.specialCapabilityIds] - Optional array of special capability IDs
 * @returns {Promise<Object>} Updated user object
 */
const updateAccount = async (userId, { firstName, middleInitial, lastName, email, password, positionId, roleId, projectId, officeId, employmentTypeId, specialCapabilityIds }) => {
    await api.get('/sanctum/csrf-cookie');

    const payload = { 
        first_name: firstName,
        middle_initial: middleInitial || null,
        last_name: lastName,
        email, 
        position_id: positionId,
        role_id: roleId,
        project_id: projectId
    };
    
    // Include office_id if provided
    if (officeId !== undefined) {
        payload.office_id = officeId || null;
    }
    
    // Include employment_type_id if provided
    if (employmentTypeId !== undefined) {
        payload.employment_type_id = employmentTypeId;
    }
    
    if (password) {
        payload.password = password;
    }

    if (specialCapabilityIds !== undefined) {
        payload.special_capability_ids = specialCapabilityIds;
    }

    const res = await api.put(`/api/users/${userId}`, payload);

    return res.data.user;
};

export default updateAccount;
