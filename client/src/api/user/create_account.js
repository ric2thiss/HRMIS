import api from '../axios';

/**
 * Create a new user account
 * @param {string} firstName - User's first name
 * @param {string} middleInitial - User's middle initial (optional)
 * @param {string} lastName - User's last name
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {number} positionId - Position ID to assign
 * @param {number} roleId - Role ID to assign
 * @param {number} projectId - Project ID to assign
 * @param {number} employmentTypeId - Employment type ID
 * @param {number[]} specialCapabilityIds - Optional array of special capability IDs (for JO employees)
 * @param {number} officeId - Optional office ID to assign
 * @returns {Promise<Object>} Created user object
 */
const createAccount = async (firstName, middleInitial, lastName, email, password, positionId, roleId, projectId, employmentTypeId, specialCapabilityIds = [], officeId = null) => {
    await api.get("/sanctum/csrf-cookie");

    const payload = { 
        first_name: firstName,
        middle_initial: middleInitial || null,
        last_name: lastName,
        email, 
        password, 
        position_id: positionId,
        role_id: roleId,
        project_id: projectId,
        employment_type_id: employmentTypeId
    };

    // Include office_id if provided
    if (officeId) {
        payload.office_id = officeId;
    }

    // Only include special_capability_ids if provided and not empty
    if (specialCapabilityIds && specialCapabilityIds.length > 0) {
        payload.special_capability_ids = specialCapabilityIds;
    }

    const res = await api.post(
        '/api/register',
        payload,
        { withCredentials: true }
    );

    return res.data.user;
};

export default createAccount;
