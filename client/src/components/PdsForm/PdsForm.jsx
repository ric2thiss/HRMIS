import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { getMyPds, createPds, updatePds, submitPds } from '../../api/pds/pds';

// --- INITIAL STATE DEFINITION ---
// This large object holds the data for ALL form fields (approx 100+).
const initialFormData = {
    // I. PERSONAL INFORMATION (Items 1-21) - Revised 2025
    surname: '', firstName: '', middleName: '', nameExtension: '',
    dateOfBirth: '', placeOfBirth: '', sex: '', civilStatus: '', civilStatusOthers: '',
    height: '', weight: '', bloodType: '',
    umidIdNo: '', pagIbigIdNo: '', philhealthNo: '', philSysNumber: '', tinNo: '', agencyEmployeeNo: '',
    citizenship: 'Filipino', dualCitizenshipType: '', dualCitizenshipCountry: '',
    resHouseNo: '', resStreet: '', resSubdivision: '', resBarangay: '', resCity: '', resProvince: '', resZipCode: '',
    sameAsResidential: false, // For Q18
    permHouseNo: '', permStreet: '', permSubdivision: '', permBarangay: '', permCity: '', permProvince: '', permZipCode: '',
    telephoneNo: '', mobileNo: '', emailAddress: '',

    // II. FAMILY BACKGROUND (Q22 - Q25)
    spouseSurname: '', spouseFirstName: '', spouseMiddleName: '', spouseExtension: '',
    spouseOccupation: '', spouseEmployer: '', spouseBusinessAddress: '', spouseTelephone: '',
    children: [{ name: '', dob: '' }], // Dynamic List Example
    fatherSurname: '', fatherFirstName: '', fatherMiddleName: '', fatherExtension: '',
    motherSurname: '', motherFirstName: '', motherMiddleName: '',

    // III. EDUCATIONAL BACKGROUND (Q26) - Using an array of objects
    education: [
        { level: 'ELEMENTARY', school: '', course: '', from: '', to: '', units: '', year: '', honors: '' },
        { level: 'SECONDARY', school: '', course: '', from: '', to: '', units: '', year: '', honors: '' },
        { level: 'VOCATIONAL / TRADE COURSE', school: '', course: '', from: '', to: '', units: '', year: '', honors: '' },
        { level: 'COLLEGE', school: '', course: '', from: '', to: '', units: '', year: '', honors: '' },
        { level: 'GRADUATE STUDIES', school: '', course: '', from: '', to: '', units: '', year: '', honors: '' },
    ],

    // IV. CIVIL SERVICE ELIGIBILITY (Q27) - Dynamic List Example
    eligibility: [{ name: '', rating: '', date: '', place: '', license: '', validity: '' }],

    // V. WORK EXPERIENCE (Item 28) - Dynamic List
    workExperience: [{ from: '', to: '', position: '', company: '', status: '', govt: '' }],

    // VI. VOLUNTARY WORK (Q29) - Dynamic List Example
    voluntaryWork: [{ organization: '', from: '', to: '', hours: '', position: '' }],

    // VII. LEARNING & DEVELOPMENT (Q30) - Dynamic List Example
    training: [{ title: '', from: '', to: '', hours: '', type: '', sponsor: '' }],

    // VIII. OTHER INFORMATION (Q31-Q33)
    skillsAndHobbies: '', distinctions: '', membership: '',

    // IX. YES/NO QUESTIONS (Q34 - Q40)
    q34a: '', q34aDetails: '', q34b: '', q34bDetails: '',
    q35a: '', q35aDetails: '', q35b: '', q35bDetails: '',
    q36: '', q36Details: '',
    q37: '', q37Details: '',
    q38a: '', q38aDetails: '', q38b: '', q38bDetails: '',
    q39: '', q39Details: '',
    q40a: '', q40aDetails: '', q40b: '', q40bDetails: '', q40c: '', q40cDetails: '',

    // X. REFERENCES (Q41)
    refName1: '', refAddress1: '', refTel1: '',
    refName2: '', refAddress2: '', refTel2: '',
    refName3: '', refAddress3: '', refTel3: '',

    // XI. DECLARATION (Q42)
    govtIdType: '', govtIdNumber: '', govtIdIssuePlaceDate: '', dateAccomplished: '',
    photo: '', // Base64 encoded 2x2 photo
    signature: '', // Base64 encoded signature
    personAdministeringOath: '',
};


// --- MAIN COMPONENT ---
const PdsForm = ({ initialData, readOnly = false, onSave }) => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const [activeTab, setActiveTab] = useState('personal');
    const [formData, setFormData] = useState(initialData || initialFormData);
    const [pds, setPds] = useState(null); // Current PDS from server
    const [loading, setLoading] = useState(!initialData);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Update formData when initialData changes
    useEffect(() => {
        if (initialData) {
            // Merge initialData with initialFormData to ensure all fields exist
            const mergedData = {
                ...initialFormData,
                ...initialData,
                // Preserve arrays if they exist in initialData, otherwise use defaults
                education: initialData.education || initialFormData.education,
                eligibility: initialData.eligibility || initialFormData.eligibility,
                workExperience: initialData.workExperience || initialFormData.workExperience,
                voluntaryWork: initialData.voluntaryWork || initialFormData.voluntaryWork,
                training: initialData.training || initialFormData.training,
                children: initialData.children || initialFormData.children,
            };
            console.log('PdsForm - Setting formData with initialData:', {
                hasPhoto: !!mergedData.photo,
                hasSignature: !!mergedData.signature,
                photoLength: mergedData.photo?.length || 0,
                signatureLength: mergedData.signature?.length || 0,
                photoPreview: mergedData.photo ? mergedData.photo.substring(0, 50) + '...' : 'none',
                signaturePreview: mergedData.signature ? mergedData.signature.substring(0, 50) + '...' : 'none',
                initialDataKeys: initialData ? Object.keys(initialData) : 'no initialData',
            });
            setFormData(mergedData);
            setLoading(false);
            return;
        }
        
        const loadPds = async () => {
            try {
                setLoading(true);
                const existingPds = await getMyPds();
                if (existingPds) {
                    setPds(existingPds);
                    // Load form data from existing PDS
                    if (existingPds.form_data) {
                        const mergedData = {
                            ...initialFormData,
                            ...existingPds.form_data,
                        };
                        setFormData(mergedData);
                    }
                }
            } catch (err) {
                console.error('Error loading PDS:', err);
                showError('Failed to load PDS data');
            } finally {
                setLoading(false);
            }
        };
        loadPds();
    }, [showError, initialData]);

    // Check if form is editable
    const isEditable = !readOnly && (!pds || pds.status === 'draft' || pds.status === 'declined');
    const isApproved = pds?.status === 'approved';
    const isPending = pds?.status === 'pending';
    const isDeclined = pds?.status === 'declined';

    // Optimized Change Handler: Only re-created if dependencies change (none here)
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        
        // Handle field arrays (e.g., eligibility, workExperience, children)
        if (name.includes('-')) {
            const [arrayName, index, fieldName] = name.split('-');
            setFormData(prevData => {
                const newArray = [...prevData[arrayName]];
                newArray[index][fieldName] = value;
                return { ...prevData, [arrayName]: newArray };
            });
        } else {
            // Handle regular fields
            setFormData(prevData => ({
                ...prevData,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    }, []);

    // Handle image upload (photo and signature)
    const handleImageUpload = useCallback((e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError('Please upload an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showError('Image size must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prevData => ({
                ...prevData,
                [fieldName]: reader.result // Store as base64
            }));
        };
        reader.onerror = () => {
            showError('Failed to read image file');
        };
        reader.readAsDataURL(file);
    }, [showError]);

    const tabs = [
        { id: 'personal', name: 'Personal Information' },
        { id: 'family-education', name: 'Family & Education' },
        { id: 'eligibility-work', name: 'Eligibility & Work Experience' },
        { id: 'voluntary-training', name: 'Voluntary Work & L&D' },
        { id: 'affidavit-reference', name: 'Affidavit & References' },
    ];
    
    const currentIndex = tabs.findIndex(t => t.id === activeTab);

    // Handle "Same as Residential" logic
    const handleAddressCheck = useCallback((e) => {
        const isChecked = e.target.checked;
        
        // Use a functional update to safely access the latest formData
        setFormData(prevData => {
            let newFormData = { ...prevData, sameAsResidential: isChecked };

            if (isChecked) {
                newFormData.permHouseNo = prevData.resHouseNo;
                newFormData.permStreet = prevData.resStreet;
                newFormData.permSubdivision = prevData.resSubdivision;
                newFormData.permBarangay = prevData.resBarangay;
                newFormData.permCity = prevData.resCity;
                newFormData.permProvince = prevData.resProvince;
                newFormData.permZipCode = prevData.resZipCode;
            } else {
                // Clear permanent address fields if unchecked
                newFormData.permHouseNo = '';
                newFormData.permStreet = '';
                newFormData.permSubdivision = '';
                newFormData.permBarangay = '';
                newFormData.permCity = '';
                newFormData.permProvince = '';
                newFormData.permZipCode = '';
            }
            return newFormData;
        });

    }, []); // Empty dependency array as it uses functional update of setFormData

    // Save PDS (create or update)
    const handleSave = async () => {
        try {
            setSaving(true);
            if (pds) {
                // Update existing PDS
                const updated = await updatePds(pds.id, formData);
                setPds(updated);
                showSuccess('PDS saved successfully');
            } else {
                // Create new PDS
                const created = await createPds(formData);
                setPds(created);
                showSuccess('PDS created successfully');
            }
            if (onSave) onSave();
        } catch (err) {
            console.error('Error saving PDS:', err);
            showError(err.response?.data?.message || 'Failed to save PDS');
        } finally {
            setSaving(false);
        }
    };

    // Submit PDS for approval
    const handleSubmit = async () => {
        if (!pds) {
            showError('Please save the PDS first before submitting');
            return;
        }

        if (!window.confirm('Are you sure you want to submit this PDS for approval? You will not be able to edit it until it is reviewed.')) {
            return;
        }

        try {
            setSubmitting(true);
            const updated = await submitPds(pds.id);
            setPds(updated);
            showSuccess('PDS submitted for approval successfully');
        } catch (err) {
            console.error('Error submitting PDS:', err);
            showError(err.response?.data?.message || 'Failed to submit PDS');
        } finally {
            setSubmitting(false);
        }
    };

    // Print PDS (for approved PDS)
    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="p-4 bg-white shadow-xl rounded-xl text-center">
                <p className="text-gray-600">Loading PDS...</p>
            </div>
        );
    }

    return (
        <div className={`p-4 bg-white ${readOnly ? 'shadow-none' : 'shadow-xl'} rounded-xl w-full overflow-x-auto pds-form-container`}>
            {/* Official Form Header - Only visible when printing */}
            <div className="pds-official-header hidden print-block">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold uppercase mb-2">PERSONAL DATA SHEET</h1>
                    <div className="flex justify-between items-start text-sm">
                        <div>
                            <span className="font-semibold">CS Form No. 212</span>
                            <span className="ml-2">Revised 2025</span>
                        </div>
                        <div className="text-right">
                            <div className="mb-1">
                                <span className="font-medium">1. CS ID No.</span>
                                <span className="ml-2 text-xs">(Do not fill up. For CSC use only)</span>
                            </div>
                            <div className="border-b-2 border-black w-32 inline-block"></div>
                        </div>
                    </div>
                </div>
                <div className="border-t-2 border-b-2 border-black py-2 mb-4 text-xs">
                    <p className="font-bold mb-1">WARNING: Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.</p>
                    <p className="mb-1"><strong>READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS) BEFORE ACCOMPLISHING THE PDS FORM.</strong></p>
                    <p>Print legibly if accomplished through own handwriting. Tick appropriate box(es) and use separate sheet if necessary. Indicate N/A if not applicable. DO NOT ABBREVIATE.</p>
                </div>
            </div>

            {/* Status Banner */}
            {pds && (
                <div className={`mb-4 p-4 rounded-lg border-l-4 ${
                    isApproved ? 'bg-green-50 border-green-500' :
                    isPending ? 'bg-yellow-50 border-yellow-500' :
                    isDeclined ? 'bg-red-50 border-red-500' :
                    'bg-blue-50 border-blue-500'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-800">
                                Status: <span className="uppercase">{pds.status}</span>
                            </h3>
                            {isDeclined && pds.hr_comments && (
                                <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700">HR Comments:</p>
                                    <p className="text-sm text-gray-600 mt-1">{pds.hr_comments}</p>
                                </div>
                            )}
                            {isPending && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Your PDS is pending review. You cannot edit it until it is reviewed.
                                </p>
                            )}
                            {isApproved && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Your PDS has been approved. You can view and print it.
                                </p>
                            )}
                        </div>
                        {isApproved && (
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Print PDS
                            </button>
                        )}
                    </div>
                </div>
            )}

            <p className="text-xs text-red-600 font-medium mb-4">
                WARNING: Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.
            </p>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-print">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        type="button" 
                        className={`
                            px-4 py-2 text-sm font-medium transition-colors duration-200 
                            ${activeTab === tab.id 
                                ? 'border-b-2 border-blue-600 text-blue-600 font-bold' 
                                : 'text-gray-500 hover:text-gray-700'
                            }
                        `}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Tab Content - Show active tab in normal view, all sections in print/PDF */}
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                
                {/* 1. PERSONAL INFORMATION */}
                <div className={`pds-section space-y-6 ${activeTab === 'personal' ? '' : 'hidden'} print-show`}>
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">I. PERSONAL INFORMATION</h2>
                        
                        {/* 1. CS ID No. (For CSC Use Only) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <label htmlFor="cs-id-no" className="text-sm font-medium text-gray-700">1. CS ID No. (Do not fill up. For CSC use only)</label>
                            <input type="text" id="cs-id-no" disabled className="p-2 border border-dashed border-gray-400 bg-gray-100 rounded-md text-sm" placeholder="CSC Use Only" />
                        </div>
                        
                        {/* 2. Name Fields - CONNECTED TO STATE */}
                        <h3 className="text-lg font-semibold text-gray-700 mt-6 border-b pb-1">2. Name</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
                            <div className="min-w-0">
                                <label htmlFor="surname" className="block text-sm font-medium text-gray-700">SURNAME</label>
                                <input type="text" id="surname" name="surname" value={formData.surname || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md min-w-0" required />
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">FIRST NAME</label>
                                <input type="text" id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md min-w-0" required />
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">MIDDLE NAME</label>
                                <input type="text" id="middleName" name="middleName" value={formData.middleName || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md min-w-0" />
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="nameExtension" className="block text-sm font-medium text-gray-700">NAME EXTENSION (JR., SR.)</label>
                                <input type="text" id="nameExtension" name="nameExtension" value={formData.nameExtension || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md min-w-0" placeholder="e.g., JR., SR., III" />
                            </div>
                        </div>

                        {/* 3-6, 16. */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t min-w-0">
                            {/* 3. Date of Birth */}
                            <div className="min-w-0">
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">3. DATE OF BIRTH (dd/mm/yyyy)</label>
                                <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md min-w-0" required />
                            </div>
                            {/* 4. Place of Birth */}
                            <div className="min-w-0">
                                <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700">4. PLACE OF BIRTH</label>
                                <input type="text" id="placeOfBirth" name="placeOfBirth" value={formData.placeOfBirth || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md min-w-0" required />
                            </div>
                            {/* 5. Sex */}
                            <div className="min-w-0">
                                <label className="block text-sm font-medium text-gray-700">5. SEX AT BIRTH</label>
                                <div className="flex space-x-4 mt-2">
                                    <label className="inline-flex items-center"><input type="radio" name="sex" value="Male" checked={formData.sex === 'Male'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600" required/><span className="ml-2 text-sm text-gray-700">Male</span></label>
                                    <label className="inline-flex items-center"><input type="radio" name="sex" value="Female" checked={formData.sex === 'Female'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600"/><span className="ml-2 text-sm text-gray-700">Female</span></label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-4 border-t min-w-0">
                            {/* 6. Civil Status */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">6. CIVIL STATUS</label>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {['Single', 'Married', 'Widowed', 'Separated'].map(status => (
                                        <label key={status} className="flex items-center space-x-2">
                                            <input type="radio" name="civilStatus" value={status} checked={formData.civilStatus === status} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600" required/>
                                            <span>{status}</span>
                                        </label>
                                    ))}
                                    <div className="col-span-2">
                                        <label className="flex items-center space-x-2">
                                            <input type="radio" name="civilStatus" value="Other/s" checked={formData.civilStatus === 'Other/s'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600"/>
                                            <span>Other/s:</span>
                                            <input type="text" name="civilStatusOthers" value={formData.civilStatusOthers || ''} onChange={handleChange} placeholder="Specify" className="ml-2 flex-1 p-1 border border-gray-300 rounded-md shadow-sm text-sm" disabled={formData.civilStatus !== 'Other/s'} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* 16. Citizenship */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">16. CITIZENSHIP</label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 text-sm text-gray-700">
                                        <input type="radio" name="citizenship" value="Filipino" checked={formData.citizenship === 'Filipino'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600" required/>
                                        <span>Filipino</span>
                                    </label>
                                    <div>
                                        <label className="flex items-center space-x-2 text-sm text-gray-700">
                                            <input type="radio" name="citizenship" value="Dual Citizenship" checked={formData.citizenship === 'Dual Citizenship'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600"/>
                                            <span>Dual Citizenship</span>
                                        </label>
                                        {formData.citizenship === 'Dual Citizenship' && (
                                            <div className="ml-6 mt-2 space-y-1">
                                                <label className="flex items-center space-x-2 text-xs">
                                                    <input type="radio" name="dualCitizenshipType" value="by birth" checked={formData.dualCitizenshipType === 'by birth'} onChange={handleChange} className="form-radio h-3 w-3 text-blue-600"/>
                                                    <span>by birth</span>
                                                </label>
                                                <label className="flex items-center space-x-2 text-xs">
                                                    <input type="radio" name="dualCitizenshipType" value="by naturalization" checked={formData.dualCitizenshipType === 'by naturalization'} onChange={handleChange} className="form-radio h-3 w-3 text-blue-600"/>
                                                    <span>by naturalization</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {formData.citizenship === 'Dual Citizenship' && (
                                    <div className="mt-3 p-3 border border-dashed rounded-md bg-gray-50">
                                        <p className="text-xs font-semibold mb-2">Pls. indicate country:</p>
                                        <input 
                                            type="text" id="dualCitizenshipCountry" name="dualCitizenshipCountry" 
                                            value={formData.dualCitizenshipCountry || ''} onChange={handleChange} 
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" 
                                            placeholder="Country" 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 7-15 IDs and Measurements */}
                        <h3 className="text-lg font-semibold text-gray-700 mt-6 border-b pb-1">Measurements & ID Numbers</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            <div><label htmlFor="height" className="block text-sm font-medium text-gray-700">7. HEIGHT (m)</label><input type="number" step="0.01" id="height" name="height" value={formData.height || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="weight" className="block text-sm font-medium text-gray-700">8. WEIGHT (kg)</label><input type="number" step="0.1" id="weight" name="weight" value={formData.weight || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div>
                                <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">9. BLOOD TYPE</label>
                                <select id="bloodType" name="bloodType" value={formData.bloodType || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    <option value="">Select</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                            <div className="md:col-span-2"><label htmlFor="umidIdNo" className="block text-sm font-medium text-gray-700">10. UMID ID NO.</label><input type="text" id="umidIdNo" name="umidIdNo" value={formData.umidIdNo || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            
                            <div><label htmlFor="pagIbigIdNo" className="block text-sm font-medium text-gray-700">11. PAG-IBIG ID NO.</label><input type="text" id="pagIbigIdNo" name="pagIbigIdNo" value={formData.pagIbigIdNo || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="philhealthNo" className="block text-sm font-medium text-gray-700">12. PHILHEALTH NO.</label><input type="text" id="philhealthNo" name="philhealthNo" value={formData.philhealthNo || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="philSysNumber" className="block text-sm font-medium text-gray-700">13. PhilSys Number (PSN):</label><input type="text" id="philSysNumber" name="philSysNumber" value={formData.philSysNumber || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="tinNo" className="block text-sm font-medium text-gray-700">14. TIN NO.</label><input type="text" id="tinNo" name="tinNo" value={formData.tinNo || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="agencyEmployeeNo" className="block text-sm font-medium text-gray-700">15. AGENCY EMPLOYEE NO.</label><input type="text" id="agencyEmployeeNo" name="agencyEmployeeNo" value={formData.agencyEmployeeNo || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                        </div>

                        {/* 17-18 Addresses - PASSING STATE/HANDLER */}
                        <h3 className="text-lg font-semibold text-gray-700 mt-6 border-b pb-1">17. & 18. Addresses</h3>
                        <AddressForm 
                            sectionTitle="17. RESIDENTIAL ADDRESS" prefix="res" required={true} 
                            formData={formData} handleChange={handleChange} handleAddressCheck={handleAddressCheck}
                        />
                        <AddressForm 
                            sectionTitle="18. PERMANENT ADDRESS" prefix="perm" required={false} 
                            formData={formData} handleChange={handleChange} handleAddressCheck={handleAddressCheck}
                        />
                        
                        {/* 19-21 Contact Details */}
                        <h3 className="text-lg font-semibold text-gray-700 mt-6 border-b pb-1">19-21. Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                            <div className="min-w-0"><label htmlFor="telephoneNo" className="block text-sm font-medium text-gray-700">19. TELEPHONE NO.</label><input type="tel" id="telephoneNo" name="telephoneNo" value={formData.telephoneNo || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md min-w-0" /></div>
                            <div className="min-w-0"><label htmlFor="mobileNo" className="block text-sm font-medium text-gray-700">20. MOBILE NO.</label><input type="tel" id="mobileNo" name="mobileNo" value={formData.mobileNo || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md min-w-0" required /></div>
                            <div className="min-w-0"><label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">21. E-MAIL ADDRESS (if any)</label><input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md min-w-0" /></div>
                        </div>
                    </div>

                {/* 2. FAMILY BACKGROUND & EDUCATION */}
                <div className={`pds-section space-y-8 ${activeTab === 'family-education' ? '' : 'hidden'} print-show`}>
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">II. FAMILY BACKGROUND</h2>
                        
                        {/* 22. Spouse's Information */}
                        <SpouseForm formData={formData} handleChange={handleChange} />

                        {/* 23. Children's Information (Dynamic List) */}
                        <ChildrenList formData={formData} handleChange={handleChange} setFormData={setFormData} />
                        
                        {/* 24. Father's Information */}
                        <ParentForm title="24. FATHER'S NAME" prefix="father" formData={formData} handleChange={handleChange} />
                        
                        {/* 25. Mother's Information */}
                        <ParentForm title="25. MOTHER'S MAIDEN NAME" prefix="mother" isMaiden={true} formData={formData} handleChange={handleChange} />

                        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 pt-4 print-section-header">III. EDUCATIONAL BACKGROUND</h2>
                        
                        {/* 26. Educational Background (Dynamic List for each level) */}
                        <EducationalBackgroundList formData={formData} handleChange={handleChange} />
                    </div>
            
                {/* 3. ELIGIBILITY & WORK EXPERIENCE */}
                <div className={`pds-section space-y-4 ${activeTab === 'eligibility-work' ? '' : 'hidden'} print-show`}>
                        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 print-section-header">IV. CIVIL SERVICE ELIGIBILITY</h2>
                        <EligibilityList formData={formData} handleChange={handleChange} setFormData={setFormData} />

                        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 pt-4 print-section-header">V. WORK EXPERIENCE</h2>
                        <WorkExperienceList formData={formData} handleChange={handleChange} setFormData={setFormData} />
                    </div>

                {/* 4. VOLUNTARY WORK, L&D, & OTHER INFO */}
                <div className={`pds-section space-y-4 ${activeTab === 'voluntary-training' ? '' : 'hidden'} print-show`}>
                        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 print-section-header">VI. VOLUNTARY WORK</h2>
                        <VoluntaryWorkList formData={formData} handleChange={handleChange} setFormData={setFormData} />

                        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 pt-4 print-section-header">VII. LEARNING AND DEVELOPMENT (L&D) INTERVENTIONS/TRAINING</h2>
                        <TrainingList formData={formData} handleChange={handleChange} setFormData={setFormData} />

                        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 pt-4 print-section-header">VIII. OTHER INFORMATION</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* 31. Special Skills and Hobbies */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">31. SPECIAL SKILLS and HOBBIES (List all)</label>
                                <textarea name="skillsAndHobbies" rows="5" value={formData.skillsAndHobbies} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
                            </div>
                            {/* 32. Non-Academic Distinctions / Recognition */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">32. NON-ACADEMIC DISTINCTIONS / RECOGNITION (Write in full)</label>
                                <textarea name="distinctions" rows="5" value={formData.distinctions} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
                            </div>
                            {/* 33. Membership in Association/Organization */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">33. MEMBERSHIP IN ASSOCIATION/ORGANIZATION (Write in full)</label>
                                <textarea name="membership" rows="5" value={formData.membership} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
                            </div>
                        </div>
                    </div>

                {/* 5. AFFIDAVIT & REFERENCES */}
                <div className={`pds-section space-y-4 ${activeTab === 'affidavit-reference' ? '' : 'hidden'} print-show`}>
                        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 print-section-header">IX. YES/NO QUESTIONS</h2>
                        <div className="space-y-6">
                            <YesNoQuestion number="34.a" question="Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be apppointed, within the third degree?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="34.b" question="within the fourth degree (for Local Government Unit - Career Employees)?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="35.a" question="Have you ever been found guilty of any administrative offense?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="35.b" question="Have you been criminally charged before any court?" formData={formData} handleChange={handleChange} hasDateAndStatus={true} />
                            <YesNoQuestion number="36" question="Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="37" question="Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="38.a" question="Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="38.b" question="Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="39" question="Have you acquired the status of an immigrant or permanent resident of another country?" detailLabel="If YES, give details (country):" formData={formData} handleChange={handleChange} />
                            
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-gray-700 border-b pb-1 mb-3">40. Pursuant to: (a) Indigenous People's Act (RA 8371); (b) Magna Carta for Disabled Persons (RA 7277, as amended); and (c) Expanded Solo Parents Welfare Act (RA 11861), please answer the following items:</h3>
                                <YesNoQuestion number="40.a" question="Are you a member of any indigenous group?" detailLabel="If YES, please specify:" formData={formData} handleChange={handleChange} />
                                <YesNoQuestion number="40.b" question="Are you a person with disability?" detailLabel="If YES, please specify ID No:" formData={formData} handleChange={handleChange} />
                                <YesNoQuestion number="40.c" question="Are you a solo parent?" detailLabel="If YES, please specify ID No:" formData={formData} handleChange={handleChange} />
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 pt-4 print-section-header">X. REFERENCES</h2>
                        {/* 41. References */}
                        <ReferencesList formData={formData} handleChange={handleChange} />

                        <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 pt-4 print-section-header">XI. DECLARATION</h2>
                        {/* 42. Declaration and Oath */}
                        <DeclarationAndOath formData={formData} handleChange={handleChange} handleImageUpload={handleImageUpload} isEditable={isEditable} />
                    </div>
            </form>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t no-print">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab(tabs[currentIndex - 1].id)}
                            disabled={currentIndex === 0 || !isEditable}
                            type="button" 
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50"
                        >
                            &larr; Previous Section
                        </button>
                        <button
                            onClick={() => setActiveTab(tabs[currentIndex + 1].id)}
                            disabled={currentIndex === tabs.length - 1 || !isEditable}
                            type="button"
                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 disabled:opacity-50"
                        >
                            Next Section &rarr;
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        {isEditable && (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    type="button"
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : pds ? 'Save Changes' : 'Save Draft'}
                                </button>
                                {pds && (pds.status === 'draft' || pds.status === 'declined') && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || saving}
                                        type="button"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit for Approval'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            
            {/* Print Styles - Official Form Format */}
            <style>{`
                /* Print-specific styles */
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .pds-official-header {
                        display: block !important;
                    }
                    .pds-form-container {
                        padding: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }
                    .pds-section {
                        display: block !important;
                        page-break-inside: avoid;
                        margin-bottom: 15px;
                        padding-bottom: 15px;
                        border-bottom: 1px solid #000;
                    }
                    .pds-section:last-child {
                        border-bottom: none;
                    }
                    .print-show {
                        display: block !important;
                    }
                    /* Hide input borders and make them look like filled fields */
                    .pds-section input[type="text"],
                    .pds-section input[type="date"],
                    .pds-section input[type="number"],
                    .pds-section input[type="email"],
                    .pds-section input[type="tel"],
                    .pds-section select,
                    .pds-section textarea {
                        border: none !important;
                        border-bottom: 1px solid #000 !important;
                        background: transparent !important;
                        padding: 2px 4px !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        appearance: none !important;
                        -webkit-appearance: none !important;
                    }
                    .pds-section input[disabled] {
                        border-bottom: 1px dashed #666 !important;
                    }
                    /* Style section headers */
                    .pds-section h2 {
                        background: #e5e7eb !important;
                        padding: 8px !important;
                        margin: 15px 0 10px 0 !important;
                        border: 1px solid #000 !important;
                        font-weight: bold !important;
                        text-transform: uppercase !important;
                    }
                    .pds-section h3 {
                        font-weight: bold !important;
                        margin-top: 10px !important;
                        margin-bottom: 5px !important;
                        border-bottom: 1px solid #ccc !important;
                        padding-bottom: 3px !important;
                    }
                    /* Make labels more form-like */
                    .pds-section label {
                        font-weight: normal !important;
                        font-size: 11px !important;
                    }
                    /* Radio buttons - show as checked/unchecked */
                    .pds-section input[type="radio"] {
                        margin-right: 4px !important;
                    }
                    
                    /* Checkbox rendering for Yes/No questions */
                    .yes-no-question .print-checkbox {
                        display: inline-block !important;
                        font-size: 12px;
                        margin-right: 4px;
                    }
                    
                    .yes-no-question input[type="radio"] {
                        display: none !important;
                    }
                    
                    .yes-no-question .yes-label,
                    .yes-no-question .no-label {
                        display: inline-flex !important;
                        align-items: center;
                    }
                    
                    /* Tables in print */
                    .pds-section table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        font-size: 10px !important;
                        margin-bottom: 10px;
                    }
                    
                    .pds-section table th,
                    .pds-section table td {
                        border: 1px solid #000 !important;
                        padding: 4px 6px !important;
                    }
                    
                    .pds-section table th {
                        background: #f0f0f0 !important;
                        font-weight: bold !important;
                        font-size: 9px !important;
                    }
                    
                    /* Grid layouts for print */
                    .pds-section .grid {
                        display: grid !important;
                        gap: 8px !important;
                    }
                    
                    /* Page breaks for 4-page structure */
                    @page {
                        size: A4;
                        margin: 1.5cm;
                    }
                    
                    /* Force page break before Section IV (Civil Service Eligibility) */
                    h2:contains("IV. CIVIL SERVICE ELIGIBILITY") {
                        page-break-before: always;
                    }
                    
                    /* Force page break before Section VI (Voluntary Work) */
                    h2:contains("VI. VOLUNTARY WORK") {
                        page-break-before: always;
                    }
                    
                    /* Force page break before Section IX (Yes/No Questions) */
                    h2:contains("IX. YES/NO QUESTIONS") {
                        page-break-before: always;
                    }
                }
                
                /* PDF mode styles (for html2canvas) */
                .pdf-mode .pds-official-header {
                    display: block !important;
                }
                .pdf-mode .pds-section {
                    display: block !important;
                    margin-bottom: 15px;
                }
                .pdf-mode .print-show {
                    display: block !important;
                }
                .pdf-mode .yes-no-question input[type="radio"] {
                    display: none !important;
                }
                .pdf-mode .yes-no-question .print-checkbox {
                    display: inline-block !important;
                }
            `}</style>
            {/* Optional: Display formData for debugging */}
            {/* <pre className="mt-4 text-xs bg-gray-100 p-2">{JSON.stringify(formData, null, 2)}</pre> */}
        </div>
    );
};


// --- HELPER COMPONENTS (MEMOIZED FOR PERFORMANCE) ---

const AddressForm = React.memo(({ sectionTitle, prefix, required, formData, handleChange, handleAddressCheck }) => (
    <div className="p-3 border rounded-md bg-gray-50">
        <label className="block text-sm font-bold text-gray-700 mb-2">{sectionTitle}</label>
        {prefix === 'perm' && (
             <div className="flex items-center space-x-2 mb-3">
                <input 
                    type="checkbox" id="sameAsResidential" name="sameAsResidential" 
                    checked={formData.sameAsResidential} 
                    onChange={handleAddressCheck} // <-- Special Handler
                    className="form-checkbox h-4 w-4 text-blue-600" 
                />
                <label htmlFor="sameAsResidential" className="text-sm font-medium text-gray-700">Same as Residential Address</label>
            </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Use bracket notation for dynamic field names */}
            {['HouseNo', 'Street', 'Subdivision', 'Barangay', 'City', 'Province'].map(field => {
                const name = `${prefix}${field}`;
                const label = field.replace(/([A-Z])/g, ' $1').toUpperCase();
                return (
                    <div key={name}>
                        <label className="block text-xs font-medium text-gray-600">{label}</label>
                        <input 
                            type="text" name={name} 
                            value={formData[name]} onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" 
                            {...(required || prefix === 'perm' && !formData.sameAsResidential && ['HouseNo', 'Barangay', 'City', 'Province'].includes(field) ? { required: true } : {})}
                            disabled={prefix === 'perm' && formData.sameAsResidential}
                        />
                    </div>
                );
            })}
            <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600">ZIP CODE</label>
                <input 
                    type="text" name={`${prefix}ZipCode`} 
                    value={formData[`${prefix}ZipCode`]} onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" 
                    {...(required ? { required: true } : {})} 
                    disabled={prefix === 'perm' && formData.sameAsResidential}
                />
            </div>
        </div>
    </div>
));

const SpouseForm = React.memo(({ formData, handleChange }) => (
    <div className="p-4 border rounded-md bg-white shadow-sm space-y-3">
        <h3 className="text-lg font-semibold text-gray-700">22. SPOUSE'S INFORMATION (if married)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Surname', 'FirstName', 'MiddleName', 'Extension'].map(field => {
                const name = `spouse${field}`;
                const label = field.replace(/([A-Z])/g, ' $1').toUpperCase();
                return (
                    <div key={name}>
                        <label className="block text-sm font-medium text-gray-700">{label}</label>
                        <input type="text" name={name} value={formData[name]} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                );
            })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700">OCCUPATION</label><input type="text" name="spouseOccupation" value={formData.spouseOccupation} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
            <div><label className="block text-sm font-medium text-gray-700">EMPLOYER/BUSINESS NAME</label><input type="text" name="spouseEmployer" value={formData.spouseEmployer} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">BUSINESS ADDRESS</label><input type="text" name="spouseBusinessAddress" value={formData.spouseBusinessAddress} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
        <div><label className="block text-sm font-medium text-gray-700">TELEPHONE NO.</label><input type="tel" name="spouseTelephone" value={formData.spouseTelephone} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
    </div>
));

const ParentForm = React.memo(({ title, prefix, isMaiden = false, formData, handleChange }) => (
    <div className="p-4 border rounded-md bg-white shadow-sm space-y-3">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Surname', 'FirstName', 'MiddleName'].map(field => {
                const name = `${prefix}${field}`;
                const label = field.replace(/([A-Z])/g, ' $1').toUpperCase();
                return (
                    <div key={name}>
                        <label className="block text-sm font-medium text-gray-700">{label}</label>
                        <input type="text" name={name} value={formData[name]} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                );
            })}
            {prefix === 'father' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">NAME EXTENSION</label>
                    <input type="text" name="fatherExtension" value={formData.fatherExtension} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
            )}
        </div>
    </div>
));

const ChildrenList = React.memo(({ formData, handleChange, setFormData }) => {
    const addChild = () => {
        setFormData(prevData => ({
            ...prevData,
            children: [...prevData.children, { name: '', dob: '' }]
        }));
    };

    return (
        <div className="p-4 border rounded-md bg-white shadow-sm space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">23. NAME of CHILDREN (Write full name and list all)</h3>
            
            {formData.children.map((child, index) => (
                <div key={index} className="border p-3 rounded-md space-y-2">
                    <h4 className="font-medium text-gray-700">Child #{index + 1}</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">FULL NAME</label>
                            <input 
                                type="text" name={`children-${index}-name`} 
                                value={child.name} onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">DATE OF BIRTH (dd/mm/yyyy)</label>
                            <input 
                                type="date" name={`children-${index}-dob`} 
                                value={child.dob} onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm" 
                            />
                        </div>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addChild} className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">Add Child</button>
        </div>
    );
});

const EducationalBackgroundList = React.memo(({ formData, handleChange }) => {
    const eduLevels = formData.education;
    return (
        <div className="p-4 border rounded-md bg-white shadow-sm overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">26. EDUCATIONAL BACKGROUND</h3>
            <p className="text-sm text-gray-500 mb-4">Fill in details for each level. Indicate N/A if not applicable.</p>
            
            <table className="min-w-full divide-y divide-gray-200 text-sm border border-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">26.</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">LEVEL</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">NAME OF SCHOOL (Write in full)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">BASIC EDUCATION/DEGREE/COURSE (Write in full)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300" colSpan="2">PERIOD OF ATTENDANCE</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">HIGHEST LEVEL/ UNITS EARNED (if not graduated)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">YEAR GRADUATED</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">SCHOLARSHIP/ ACADEMIC HONORS RECEIVED</th>
                    </tr>
                    <tr className="bg-gray-50">
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">From</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">To</th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {eduLevels.map((item, index) => (
                        <tr key={item.level} className="text-xs">
                            <td className="px-3 py-2 border border-gray-300 text-center">{index + 1}</td>
                            <td className="px-3 py-2 border border-gray-300 whitespace-nowrap font-medium text-gray-900">{item.level}</td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`education-${index}-school`} value={item.school || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`education-${index}-course`} value={item.course || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`education-${index}-from`} value={item.from || ''} onChange={handleChange} placeholder="mm/yyyy" className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`education-${index}-to`} value={item.to || ''} onChange={handleChange} placeholder="mm/yyyy" className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`education-${index}-units`} value={item.units || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`education-${index}-year`} value={item.year || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`education-${index}-honors`} value={item.honors || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

const EligibilityList = React.memo(({ formData, handleChange, setFormData }) => {
    const addEligibility = () => {
        setFormData(prevData => ({
            ...prevData,
            eligibility: [...prevData.eligibility, { name: '', rating: '', date: '', place: '', license: '', validity: '' }]
        }));
    };
    return (
        <div className="p-4 border rounded-md bg-white shadow-sm overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">27. CES/CSEE/CAREER SERVICE/RA 1080 (BOARD/BAR)/UNDER SPECIAL LAWS/CATEGORY II/IV ELIGIBILITY and ELIGIBILITIES FOR UNIFORMED PERSONNEL</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm border border-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">27. CES/CSEE/CAREER SERVICE/RA 1080 (BOARD/BAR)/UNDER SPECIAL LAWS/CATEGORY II/IV ELIGIBILITY and ELIGIBILITIES FOR UNIFORMED PERSONNEL</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">RATING<br />(If Applicable)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">DATE OF EXAMINATION / CONFERMENT</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">PLACE OF EXAMINATION / CONFERMENT</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300" colSpan="2">LICENSE (if applicable)</th>
                    </tr>
                    <tr className="bg-gray-50">
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">NUMBER</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">Valid Until</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {formData.eligibility.map((item, index) => (
                        <tr key={index} className="text-xs">
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`eligibility-${index}-name`} value={item.name || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`eligibility-${index}-rating`} value={item.rating || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="date" name={`eligibility-${index}-date`} value={item.date || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`eligibility-${index}-place`} value={item.place || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`eligibility-${index}-license`} value={item.license || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="date" name={`eligibility-${index}-validity`} value={item.validity || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" onClick={addEligibility} className="mt-3 px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">Add Eligibility</button>
        </div>
    );
});

const WorkExperienceList = React.memo(({ formData, handleChange, setFormData }) => {
    const addWork = () => {
        setFormData(prevData => ({
            ...prevData,
            workExperience: [...prevData.workExperience, { from: '', to: '', position: '', company: '', status: '', govt: '' }]
        }));
    };
    return (
        <div className="p-4 border rounded-md bg-white shadow-sm overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">28. WORK EXPERIENCE</h3>
            <p className="text-xs text-gray-600 mb-4">(Include private employment. Start from your recent work.) Description of duties should be indicated in the attached Work Experience Sheet</p>
            <table className="min-w-full divide-y divide-gray-200 text-sm border border-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">28.</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300" colSpan="2">INCLUSIVE DATES (dd/mm/yyyy)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">POSITION TITLE<br />(Write in full/Do not abbreviate)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">DEPARTMENT / AGENCY / OFFICE / COMPANY<br />(Write in full/Do not abbreviate)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">STATUS OF APPOINTMENT</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">GOV'T SERVICE<br />(Y/N)</th>
                    </tr>
                    <tr className="bg-gray-50">
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">From</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">To</th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {formData.workExperience.map((item, index) => (
                        <tr key={index} className="text-xs">
                            <td className="px-3 py-2 border border-gray-300 text-center">{index + 1}</td>
                            <td className="px-3 py-2 border border-gray-300"><input type="date" name={`workExperience-${index}-from`} value={item.from || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="date" name={`workExperience-${index}-to`} value={item.to || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`workExperience-${index}-position`} value={item.position || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`workExperience-${index}-company`} value={item.company || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`workExperience-${index}-status`} value={item.status || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300">
                                <select name={`workExperience-${index}-govt`} value={item.govt || ''} onChange={handleChange} className="w-full p-1 border rounded">
                                    <option value="">Select</option>
                                    <option value="Y">Y</option>
                                    <option value="N">N</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" onClick={addWork} className="mt-3 px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">Add Work Experience</button>
        </div>
    );
});

const VoluntaryWorkList = React.memo(({ formData, handleChange, setFormData }) => {
    const addVoluntary = () => {
        setFormData(prevData => ({
            ...prevData,
            voluntaryWork: [...prevData.voluntaryWork, { organization: '', from: '', to: '', hours: '', position: '' }]
        }));
    };
    return (
        <div className="p-4 border rounded-md bg-white shadow-sm overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">29. VOLUNTARY WORK OR INVOLVEMENT IN CIVIC / NON-GOVERNMENT / PEOPLE / VOLUNTARY ORGANIZATION/S</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm border border-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">29. NAME & ADDRESS OF ORGANIZATION (in full)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300" colSpan="2">INCLUSIVE DATES (dd/mm/yyyy)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">NUMBER OF HOURS</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">POSITION / NATURE OF WORK</th>
                    </tr>
                    <tr className="bg-gray-50">
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">From</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">To</th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {formData.voluntaryWork.map((item, index) => (
                        <tr key={index} className="text-xs">
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`voluntaryWork-${index}-organization`} value={item.organization || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="date" name={`voluntaryWork-${index}-from`} value={item.from || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="date" name={`voluntaryWork-${index}-to`} value={item.to || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="number" name={`voluntaryWork-${index}-hours`} value={item.hours || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`voluntaryWork-${index}-position`} value={item.position || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" onClick={addVoluntary} className="mt-3 px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">Add Voluntary Work</button>
        </div>
    );
});

const TrainingList = React.memo(({ formData, handleChange, setFormData }) => {
    const addTraining = () => {
        setFormData(prevData => ({
            ...prevData,
            training: [...prevData.training, { title: '', from: '', to: '', hours: '', type: '', sponsor: '' }]
        }));
    };
    return (
        <div className="p-4 border rounded-md bg-white shadow-sm overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">30. LEARNING AND DEVELOPMENT (L&D) INTERVENTIONS/TRAINING PROGRAMS ATTENDED</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm border border-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">30. TITLE OF LEARNING AND DEVELOPMENT INTERVENTIONS/TRAINING PROGRAMS (Write in full)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300" colSpan="2">INCLUSIVE DATES OF ATTENDANCE (dd/mm/yyyy)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">NUMBER OF HOURS</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">Type of L&D (Managerial/Supervisory/Technical/etc)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">CONDUCTED/SPONSORED BY (Write in full)</th>
                    </tr>
                    <tr className="bg-gray-50">
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">From</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider text-xs border border-gray-300">To</th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                        <th className="px-3 py-2 border border-gray-300"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {formData.training.map((item, index) => (
                        <tr key={index} className="text-xs">
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`training-${index}-title`} value={item.title || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="date" name={`training-${index}-from`} value={item.from || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="date" name={`training-${index}-to`} value={item.to || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="number" name={`training-${index}-hours`} value={item.hours || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`training-${index}-type`} value={item.type || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2 border border-gray-300"><input type="text" name={`training-${index}-sponsor`} value={item.sponsor || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" onClick={addTraining} className="mt-3 px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">Add Training</button>
        </div>
    );
});

const YesNoQuestion = React.memo(({ number, question, detailLabel = 'If YES, give details:', formData, handleChange }) => {
    const name = `q${number.replace(/\./g, '')}`; // q34a, q34b, q39, etc.
    const detailName = `${name}Details`;
    const isYes = formData[name] === 'Yes';
    const isNo = formData[name] === 'No';

    return (
        <div className="p-3 border rounded-md bg-white shadow-sm space-y-2 yes-no-question">
            <label className="block text-sm font-medium text-gray-700">
                {number}. <span className="font-normal">{question}</span>
            </label>
            <div className="flex space-x-4">
                <label className="inline-flex items-center cursor-pointer">
                    <input 
                        type="radio" 
                        name={name} 
                        value="Yes" 
                        checked={isYes} 
                        onChange={handleChange} 
                        className="form-radio h-4 w-4 text-blue-600 yes-radio"
                    />
                    <span className="ml-2 text-sm text-gray-700 yes-label">
                        <span className="print-checkbox">{isYes ? '☑' : '☐'}</span>
                        <span className="no-print"> YES</span>
                    </span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                    <input 
                        type="radio" 
                        name={name} 
                        value="No" 
                        checked={isNo} 
                        onChange={handleChange} 
                        className="form-radio h-4 w-4 text-blue-600 no-radio"
                    />
                    <span className="ml-2 text-sm text-gray-700 no-label">
                        <span className="print-checkbox">{isNo ? '☑' : '☐'}</span>
                        <span className="no-print"> NO</span>
                    </span>
                </label>
            </div>
            {isYes && (
                <div className="pt-2">
                    <label className="block text-xs font-medium text-gray-600">{detailLabel}</label>
                    <input type="text" name={detailName} value={formData[detailName] || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm" />
                </div>
            )}
        </div>
    );
});

const ReferencesList = React.memo(({ formData, handleChange }) => (
    <div className="p-4 border rounded-md bg-white shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">41. REFERENCES (Person not related by consanguinity or affinity to applicant/appointee)</h3>
        <table className="min-w-full divide-y divide-gray-200 text-sm border border-gray-300">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">NAME</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">OFFICE/RESIDENTIAL ADDRESS</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider border border-gray-300">CONTACT NO. AND/OR EMAIL</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3].map(i => (
                    <tr key={i} className="text-xs">
                        <td className="px-3 py-2 border border-gray-300"><input type="text" name={`refName${i}`} value={formData[`refName${i}`] || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                        <td className="px-3 py-2 border border-gray-300"><input type="text" name={`refAddress${i}`} value={formData[`refAddress${i}`] || ''} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                        <td className="px-3 py-2 border border-gray-300"><input type="text" name={`refTel${i}`} value={formData[`refTel${i}`] || ''} onChange={handleChange} placeholder="Tel. No. and/or Email" className="w-full p-1 border rounded" /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
));

const DeclarationAndOath = React.memo(({ formData, handleChange, handleImageUpload, isEditable = true }) => {
    // Debug logging
    React.useEffect(() => {
        console.log('DeclarationAndOath - formData:', {
            hasPhoto: !!formData?.photo,
            hasSignature: !!formData?.signature,
            photoValue: formData?.photo ? formData.photo.substring(0, 50) + '...' : 'none',
            signatureValue: formData?.signature ? formData.signature.substring(0, 50) + '...' : 'none',
        });
    }, [formData?.photo, formData?.signature]);

    return (
    <div className="p-4 border border-blue-200 rounded-md bg-blue-50 space-y-4">
        <h3 className="text-lg font-bold text-blue-800">42. DECLARATION AND OATH</h3>
        <p className="text-sm italic text-gray-700">
            I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.
        </p>

        <div className="grid grid-cols-3 gap-6 pt-4">
            <div className="col-span-2 space-y-3">
                <div className="border border-gray-400 p-2 h-24">
                    <label className="block text-xs font-medium text-gray-600">Government Issued ID (i.e. Passport, GSIS, SSS, PRC, Driver's License, etc.)</label>
                    <label className="block text-xs font-medium text-gray-600">PLEASE INDICATE ID Number and Date of Issuance</label>
                    <input type="text" name="govtIdType" value={formData.govtIdType || ''} onChange={handleChange} placeholder="Government Issued ID:" disabled={!isEditable} className="mt-1 block w-full p-1 border-b border-gray-300 bg-transparent text-sm disabled:opacity-50" />
                    <input type="text" name="govtIdNumber" value={formData.govtIdNumber || ''} onChange={handleChange} placeholder="ID/License/Passport No.:" disabled={!isEditable} className="mt-1 block w-full p-1 border-b border-gray-300 bg-transparent text-sm disabled:opacity-50" />
                    <input type="text" name="govtIdIssuePlaceDate" value={formData.govtIdIssuePlaceDate || ''} onChange={handleChange} placeholder="Date/Place of Issuance:" disabled={!isEditable} className="mt-1 block w-full p-1 border-b border-gray-300 bg-transparent text-sm disabled:opacity-50" />
                </div>
            </div>

            {/* Photo Upload */}
            <div className="border border-gray-400 p-2 bg-white relative" style={{ minHeight: '96px' }}>
                {formData?.photo && formData.photo.trim() !== '' ? (
                    <div className="relative w-full h-full">
                        <img 
                            src={formData.photo} 
                            alt="2x2 Photo" 
                            className="w-full h-full object-contain"
                            style={{ maxHeight: '96px' }}
                            onError={(e) => {
                                console.error('Error loading photo:', formData.photo?.substring(0, 50));
                                e.target.style.display = 'none';
                            }}
                        />
                        {isEditable && (
                            <button
                                type="button"
                                onClick={() => handleChange({ target: { name: 'photo', value: '' } })}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                title="Remove photo"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'photo')}
                            disabled={!isEditable}
                            className="hidden"
                        />
                        <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500 text-center">PHOTO (2x2)<br />Click to upload</span>
                    </label>
                )}
            </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6 items-end">
            <div className="col-span-1">
                <input type="text" name="dateAccomplished" value={formData.dateAccomplished || ''} onChange={handleChange} placeholder="Date Accomplished" disabled={!isEditable} className="mt-1 block w-full p-2 border-b-2 border-gray-800 bg-transparent text-sm text-center disabled:opacity-50" />
                <p className="text-center text-xs text-gray-500 pt-1">Date Accomplished</p>
            </div>
            {/* Signature Upload */}
            <div className="col-span-1">
                <div className="h-20 border border-gray-400 bg-white relative">
                    {formData?.signature && formData.signature.trim() !== '' ? (
                        <div className="relative w-full h-full">
                            <img 
                                src={formData.signature} 
                                alt="Signature" 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    console.error('Error loading signature:', formData.signature?.substring(0, 50));
                                    e.target.style.display = 'none';
                                }}
                            />
                            {isEditable && (
                                <button
                                    type="button"
                                    onClick={() => handleChange({ target: { name: 'signature', value: '' } })}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                    title="Remove signature"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'signature')}
                                disabled={!isEditable}
                                className="hidden"
                            />
                            <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span className="text-xs text-gray-500 text-center">Signature<br />Click to upload</span>
                        </label>
                    )}
                </div>
            </div>
            <div className="col-span-1">
                <div className="h-20 border border-gray-400 flex items-center justify-center bg-white">
                    <span className="text-sm text-gray-500">Right Thumbmark</span>
                </div>
            </div>
        </div>

        <div className="pt-4 border-t border-blue-300">
             <p className="text-xs font-medium text-blue-800 italic">SUBSCRIBED AND SWORN to before me this _____________, affiant exhibiting his/her validly issued government ID as indicated above.</p>
             <input type="text" name="personAdministeringOath" value={formData.personAdministeringOath || ''} onChange={handleChange} placeholder="Person Administering Oath" disabled={!isEditable} className="mt-4 block w-full p-2 border-b-2 border-gray-800 bg-transparent text-sm text-center disabled:opacity-50" />
        </div>
    </div>
    );
});


export default PdsForm;