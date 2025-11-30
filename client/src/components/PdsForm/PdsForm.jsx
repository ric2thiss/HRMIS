import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { getMyPds, createPds, updatePds, submitPds } from '../../api/pds/pds';

// --- INITIAL STATE DEFINITION ---
// This large object holds the data for ALL form fields (approx 100+).
const initialFormData = {
    // I. PERSONAL INFORMATION (Q1 - Q21)
    surname: '', firstName: '', middleName: '', nameExtension: '',
    dateOfBirth: '', placeOfBirth: '', sex: '', civilStatus: '', civilStatusOthers: '',
    height: '', weight: '', bloodType: '',
    gsisIdNo: '', pagIbigIdNo: '', philhealthNo: '', sssNo: '', tinNo: '', agencyEmployeeNo: '',
    citizenship: 'Filipino', dualCitizenshipCountry: '',
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

    // V. WORK EXPERIENCE (Q28) - Dynamic List Example
    workExperience: [{ from: '', to: '', position: '', company: '', salary: '', grade: '', status: '', govt: '' }],

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

    // Load existing PDS on mount (only if not provided as prop)
    useEffect(() => {
        if (initialData) {
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
                        setFormData(existingPds.form_data);
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
        <div className="p-4 bg-white shadow-xl rounded-xl">
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
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
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

            {/* Tab Content - CONDITIONAL RENDERING APPLIED */}
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                
                {/* 1. PERSONAL INFORMATION */}
                {activeTab === 'personal' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">I. PERSONAL INFORMATION</h2>
                        
                        {/* 1. CS ID No. (For CSC Use Only) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <label htmlFor="cs-id-no" className="text-sm font-medium text-gray-700">1. CS ID No. (Do not fill up. For CSC use only)</label>
                            <input type="text" id="cs-id-no" disabled className="p-2 border border-dashed border-gray-400 bg-gray-100 rounded-md text-sm" placeholder="CSC Use Only" />
                        </div>
                        
                        {/* 2. Name Fields - CONNECTED TO STATE */}
                        <h3 className="text-lg font-semibold text-gray-700 mt-6 border-b pb-1">2. Name</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label htmlFor="surname" className="block text-sm font-medium text-gray-700">SURNAME</label>
                                <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                            </div>
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">FIRST NAME</label>
                                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                            </div>
                            <div>
                                <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">MIDDLE NAME</label>
                                <input type="text" id="middleName" name="middleName" value={formData.middleName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label htmlFor="nameExtension" className="block text-sm font-medium text-gray-700">NAME EXTENSION (JR., SR.)</label>
                                <input type="text" id="nameExtension" name="nameExtension" value={formData.nameExtension} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., JR., SR., III" />
                            </div>
                        </div>

                        {/* 3-6, 16. */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                            {/* 3. Date of Birth */}
                            <div>
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">3. DATE OF BIRTH (mm/dd/yyyy)</label>
                                <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                            </div>
                            {/* 4. Place of Birth */}
                            <div>
                                <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700">4. PLACE OF BIRTH</label>
                                <input type="text" id="placeOfBirth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                            </div>
                            {/* 5. Sex */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">5. SEX</label>
                                <div className="flex space-x-4 mt-2">
                                    <label className="inline-flex items-center"><input type="radio" name="sex" value="Male" checked={formData.sex === 'Male'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600" required/><span className="ml-2 text-sm text-gray-700">Male</span></label>
                                    <label className="inline-flex items-center"><input type="radio" name="sex" value="Female" checked={formData.sex === 'Female'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600"/><span className="ml-2 text-sm text-gray-700">Female</span></label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-4 border-t">
                            {/* 6. Civil Status */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">6. CIVIL STATUS</label>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {['Single', 'Married', 'Widow/er', 'Separated', 'Solo Parent', 'Others'].map(status => (
                                        <label key={status} className="flex items-center space-x-2">
                                            <input type="radio" name="civilStatus" value={status} checked={formData.civilStatus === status} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600" required/>
                                            <span>{status}</span>
                                        </label>
                                    ))}
                                </div>
                                <input type="text" name="civilStatusOthers" value={formData.civilStatusOthers} onChange={handleChange} placeholder="If Others, specify" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" disabled={formData.civilStatus !== 'Others'} />
                            </div>

                            {/* 16. Citizenship */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">16. CITIZENSHIP</label>
                                <div className="space-y-1">
                                    <label className="flex items-center space-x-2 text-sm text-gray-700"><input type="radio" name="citizenship" value="Filipino" checked={formData.citizenship === 'Filipino'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600" required/><span>Filipino</span></label>
                                    <label className="flex items-center space-x-2 text-sm text-gray-700"><input type="radio" name="citizenship" value="Dual Citizenship" checked={formData.citizenship === 'Dual Citizenship'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600"/><span>Dual Citizenship</span></label>
                                </div>
                                <div className="mt-3 p-3 border border-dashed rounded-md bg-gray-50">
                                    <p className="text-xs font-semibold">If holder of dual citizenship, please indicate the country:</p>
                                    <input 
                                        type="text" id="dualCitizenshipCountry" name="dualCitizenshipCountry" 
                                        value={formData.dualCitizenshipCountry} onChange={handleChange} 
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" 
                                        placeholder="Country" 
                                        disabled={formData.citizenship !== 'Dual Citizenship'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 7-15 IDs and Measurements */}
                        <h3 className="text-lg font-semibold text-gray-700 mt-6 border-b pb-1">Measurements & ID Numbers</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            <div><label htmlFor="height" className="block text-sm font-medium text-gray-700">7. HEIGHT (m)</label><input type="number" step="0.01" id="height" name="height" value={formData.height} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="weight" className="block text-sm font-medium text-gray-700">8. WEIGHT (kg)</label><input type="number" step="0.1" id="weight" name="weight" value={formData.weight} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div>
                                <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">9. BLOOD TYPE</label>
                                <select id="bloodType" name="bloodType" value={formData.bloodType} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    <option value="">Select</option><option value="O+">O+</option><option value="A-">A-</option>
                                </select>
                            </div>
                            <div className="md:col-span-2"><label htmlFor="gsisIdNo" className="block text-sm font-medium text-gray-700">10. GSIS ID NO.</label><input type="text" id="gsisIdNo" name="gsisIdNo" value={formData.gsisIdNo} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            
                            <div><label htmlFor="pagIbigIdNo" className="block text-sm font-medium text-gray-700">11. PAG-IBIG ID NO.</label><input type="text" id="pagIbigIdNo" name="pagIbigIdNo" value={formData.pagIbigIdNo} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="philhealthNo" className="block text-sm font-medium text-gray-700">12. PHILHEALTH NO.</label><input type="text" id="philhealthNo" name="philhealthNo" value={formData.philhealthNo} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="sssNo" className="block text-sm font-medium text-gray-700">13. SSS NO.</label><input type="text" id="sssNo" name="sssNo" value={formData.sssNo} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="tinNo" className="block text-sm font-medium text-gray-700">14. TIN NO.</label><input type="text" id="tinNo" name="tinNo" value={formData.tinNo} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="agencyEmployeeNo" className="block text-sm font-medium text-gray-700">15. AGENCY EMPLOYEE NO.</label><input type="text" id="agencyEmployeeNo" name="agencyEmployeeNo" value={formData.agencyEmployeeNo} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label htmlFor="telephoneNo" className="block text-sm font-medium text-gray-700">19. TELEPHONE NO.</label><input type="tel" id="telephoneNo" name="telephoneNo" value={formData.telephoneNo} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                            <div><label htmlFor="mobileNo" className="block text-sm font-medium text-gray-700">20. MOBILE NO.</label><input type="tel" id="mobileNo" name="mobileNo" value={formData.mobileNo} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required /></div>
                            <div><label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">21. E-MAIL ADDRESS (if any)</label><input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" /></div>
                        </div>
                    </div>
                )}

                {/* 2. FAMILY BACKGROUND & EDUCATION */}
                {activeTab === 'family-education' && (
                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">II. FAMILY BACKGROUND</h2>
                        
                        {/* 22. Spouse's Information */}
                        <SpouseForm formData={formData} handleChange={handleChange} />

                        {/* 23. Children's Information (Dynamic List) */}
                        <ChildrenList formData={formData} handleChange={handleChange} setFormData={setFormData} />
                        
                        {/* 24. Father's Information */}
                        <ParentForm title="24. FATHER'S NAME" prefix="father" formData={formData} handleChange={handleChange} />
                        
                        {/* 25. Mother's Information */}
                        <ParentForm title="25. MOTHER'S MAIDEN NAME" prefix="mother" isMaiden={true} formData={formData} handleChange={handleChange} />

                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 pt-4">III. EDUCATIONAL BACKGROUND</h2>
                        
                        {/* 26. Educational Background (Dynamic List for each level) */}
                        <EducationalBackgroundList formData={formData} handleChange={handleChange} />
                    </div>
                )}
            
                {/* 3. ELIGIBILITY & WORK EXPERIENCE */}
                {activeTab === 'eligibility-work' && (
                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">IV. CIVIL SERVICE ELIGIBILITY</h2>
                        <EligibilityList formData={formData} handleChange={handleChange} setFormData={setFormData} />

                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 pt-4">V. WORK EXPERIENCE</h2>
                        <WorkExperienceList formData={formData} handleChange={handleChange} setFormData={setFormData} />
                    </div>
                )}

                {/* 4. VOLUNTARY WORK, L&D, & OTHER INFO */}
                {activeTab === 'voluntary-training' && (
                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">VI. VOLUNTARY WORK</h2>
                        <VoluntaryWorkList formData={formData} handleChange={handleChange} setFormData={setFormData} />

                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 pt-4">VII. LEARNING AND DEVELOPMENT (L&D) INTERVENTIONS/TRAINING</h2>
                        <TrainingList formData={formData} handleChange={handleChange} setFormData={setFormData} />

                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 pt-4">VIII. OTHER INFORMATION</h2>
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
                )}

                {/* 5. AFFIDAVIT & REFERENCES */}
                {activeTab === 'affidavit-reference' && (
                    <div className="space-y-8">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">IX. YES/NO QUESTIONS</h2>
                        <div className="space-y-6">
                            <YesNoQuestion number="34.a" question="Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be apppointed, within the third degree?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="34.b" question="within the fourth degree (for Local Government Unit - Career Employees)?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="35.a" question="Have you ever been found guilty of any administrative offense?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="35.b" question="Have you been criminally charged before any court?" detailLabel="Date Filed and Status of Case/s" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="36" question="Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="37" question="Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="38.a" question="Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="38.b" question="Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="39" question="Have you acquired the status of an immigrant or permanent resident of another country?" detailLabel="If YES, give details (country):" formData={formData} handleChange={handleChange} />
                            
                            <h3 className="text-lg font-semibold text-gray-700 mt-6 border-b pb-1">40. SPECIAL LAWS</h3>
                            <YesNoQuestion number="40.a" question="Are you a member of any indigenous group?" detailLabel="If YES, please specify:" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="40.b" question="Are you a person with disability?" detailLabel="If YES, please specify ID No:" formData={formData} handleChange={handleChange} />
                            <YesNoQuestion number="40.c" question="Are you a solo parent?" detailLabel="If YES, please specify ID No:" formData={formData} handleChange={handleChange} />
                        </div>

                        {/* 41. References */}
                        <ReferencesList formData={formData} handleChange={handleChange} />

                        {/* 42. Declaration and Oath */}
                        <DeclarationAndOath formData={formData} handleChange={handleChange} />
                    </div>
                )}
            </form>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t">
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
                            <label className="block text-xs font-medium text-gray-600">DATE OF BIRTH (mm/dd/yyyy)</label>
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
            
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                {/* Table Header (omitted for brevity, assume it matches the previous version) */}
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-32">LEVEL</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-64">NAME OF SCHOOL (Write in full)</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-64">BASIC EDUCATION/DEGREE/COURSE</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-40" colSpan="2">PERIOD OF ATTENDANCE</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-32">HIGHEST LEVEL/ UNITS EARNED</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-24">YEAR GRADUATED</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-40">SCHOLARSHIP/ ACADEMIC HONORS RECEIVED</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {eduLevels.map((item, index) => (
                        <tr key={item.level} className="text-xs">
                            <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{item.level}</td>
                            <td className="px-3 py-2"><input type="text" name={`education-${index}-school`} value={item.school} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`education-${index}-course`} value={item.course} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`education-${index}-from`} value={item.from} onChange={handleChange} placeholder="mm/yyyy" className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`education-${index}-to`} value={item.to} onChange={handleChange} placeholder="mm/yyyy" className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`education-${index}-units`} value={item.units} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`education-${index}-year`} value={item.year} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`education-${index}-honors`} value={item.honors} onChange={handleChange} className="w-full p-1 border rounded" /></td>
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
            <h3 className="text-lg font-semibold text-gray-700 mb-4">27. CIVIL SERVICE ELIGIBILITY</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                {/* Table Header (omitted for brevity) */}
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-80">CAREER SERVICE/ RA 1080 / BARANGAY ELIGIBILITY / DRIVER'S LICENSE</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-24">RATING</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-40">DATE OF EXAMINATION / CONFERMENT</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-64">PLACE OF EXAMINATION / CONFERMENT</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-24">LICENSE NUMBER</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-24">DATE OF VALIDITY</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {formData.eligibility.map((item, index) => (
                        <tr key={index} className="text-xs">
                            <td className="px-3 py-2"><input type="text" name={`eligibility-${index}-name`} value={item.name} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`eligibility-${index}-rating`} value={item.rating} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="date" name={`eligibility-${index}-date`} value={item.date} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`eligibility-${index}-place`} value={item.place} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`eligibility-${index}-license`} value={item.license} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="date" name={`eligibility-${index}-validity`} value={item.validity} onChange={handleChange} className="w-full p-1 border rounded" /></td>
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
            workExperience: [...prevData.workExperience, { from: '', to: '', position: '', company: '', salary: '', grade: '', status: '', govt: '' }]
        }));
    };
    return (
        <div className="p-4 border rounded-md bg-white shadow-sm overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">28. WORK EXPERIENCE</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                {/* Table Header (omitted for brevity) */}
                <tbody className="bg-white divide-y divide-gray-200">
                    {formData.workExperience.map((item, index) => (
                        <tr key={index} className="text-xs">
                            <td className="px-3 py-2"><input type="date" name={`workExperience-${index}-from`} value={item.from} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="date" name={`workExperience-${index}-to`} value={item.to} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`workExperience-${index}-position`} value={item.position} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`workExperience-${index}-company`} value={item.company} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="number" name={`workExperience-${index}-salary`} value={item.salary} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`workExperience-${index}-grade`} value={item.grade} onChange={handleChange} placeholder="e.g. 00-0" className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`workExperience-${index}-status`} value={item.status} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2">
                                <select name={`workExperience-${index}-govt`} value={item.govt} onChange={handleChange} className="w-full p-1 border rounded">
                                    <option value="Y">Y</option><option value="N">N</option>
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
            <h3 className="text-lg font-semibold text-gray-700 mb-4">29. VOLUNTARY WORK</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                {/* Table Header (omitted for brevity) */}
                <tbody className="bg-white divide-y divide-gray-200">
                    {formData.voluntaryWork.map((item, index) => (
                        <tr key={index} className="text-xs">
                            <td className="px-3 py-2"><input type="text" name={`voluntaryWork-${index}-organization`} value={item.organization} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="date" name={`voluntaryWork-${index}-from`} value={item.from} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="date" name={`voluntaryWork-${index}-to`} value={item.to} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="number" name={`voluntaryWork-${index}-hours`} value={item.hours} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`voluntaryWork-${index}-position`} value={item.position} onChange={handleChange} className="w-full p-1 border rounded" /></td>
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
            <h3 className="text-lg font-semibold text-gray-700 mb-4">30. L&D INTERVENTIONS/TRAINING PROGRAMS ATTENDED</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                {/* Table Header (omitted for brevity) */}
                <tbody className="bg-white divide-y divide-gray-200">
                    {formData.training.map((item, index) => (
                        <tr key={index} className="text-xs">
                            <td className="px-3 py-2"><input type="text" name={`training-${index}-title`} value={item.title} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="date" name={`training-${index}-from`} value={item.from} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="date" name={`training-${index}-to`} value={item.to} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="number" name={`training-${index}-hours`} value={item.hours} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`training-${index}-type`} value={item.type} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                            <td className="px-3 py-2"><input type="text" name={`training-${index}-sponsor`} value={item.sponsor} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="button" onClick={addTraining} className="mt-3 px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">Add Training</button>
        </div>
    );
});

const YesNoQuestion = React.memo(({ number, question, detailLabel = 'If YES, give details:', formData, handleChange }) => {
    const name = `q${number.replace('.', '')}`; // q34a, q34b, q39, etc.
    const detailName = `${name}Details`;
    const isYes = formData[name] === 'Yes';

    return (
        <div className="p-3 border rounded-md bg-white shadow-sm space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {number}. <span className="font-normal">{question}</span>
            </label>
            <div className="flex space-x-4">
                <label className="inline-flex items-center"><input type="radio" name={name} value="Yes" checked={isYes} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600"/> <span className="ml-2 text-sm text-gray-700">YES</span></label>
                <label className="inline-flex items-center"><input type="radio" name={name} value="No" checked={formData[name] === 'No'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600"/> <span className="ml-2 text-sm text-gray-700">NO</span></label>
            </div>
            {isYes && (
                <div className="pt-2">
                    <label className="block text-xs font-medium text-gray-600">{detailLabel}</label>
                    <input type="text" name={detailName} value={formData[detailName]} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm" />
                </div>
            )}
        </div>
    );
});

const ReferencesList = React.memo(({ formData, handleChange }) => (
    <div className="p-4 border rounded-md bg-white shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">41. REFERENCES</h3>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-80">NAME</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-96">ADDRESS</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 tracking-wider w-32">TEL. NO.</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3].map(i => (
                    <tr key={i} className="text-xs">
                        <td className="px-3 py-2"><input type="text" name={`refName${i}`} value={formData[`refName${i}`]} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                        <td className="px-3 py-2"><input type="text" name={`refAddress${i}`} value={formData[`refAddress${i}`]} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                        <td className="px-3 py-2"><input type="tel" name={`refTel${i}`} value={formData[`refTel${i}`]} onChange={handleChange} className="w-full p-1 border rounded" /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
));

const DeclarationAndOath = React.memo(({ formData, handleChange }) => (
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
                    <input type="text" name="govtIdType" value={formData.govtIdType} onChange={handleChange} placeholder="Government Issued ID:" className="mt-1 block w-full p-1 border-b border-gray-300 bg-transparent text-sm" />
                    <input type="text" name="govtIdNumber" value={formData.govtIdNumber} onChange={handleChange} placeholder="ID/License/Passport No.:" className="mt-1 block w-full p-1 border-b border-gray-300 bg-transparent text-sm" />
                    <input type="text" name="govtIdIssuePlaceDate" value={formData.govtIdIssuePlaceDate} onChange={handleChange} placeholder="Date/Place of Issuance:" className="mt-1 block w-full p-1 border-b border-gray-300 bg-transparent text-sm" />
                </div>
            </div>

            <div className="border border-gray-400 p-2 h-24 flex items-center justify-center bg-white">
                <span className="text-sm text-gray-500">PHOTO (2x2)</span>
            </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6 items-end">
            <div className="col-span-1">
                <input type="text" name="dateAccomplished" value={formData.dateAccomplished} onChange={handleChange} placeholder="Date Accomplished" className="mt-1 block w-full p-2 border-b-2 border-gray-800 bg-transparent text-sm text-center" />
                <p className="text-center text-xs text-gray-500 pt-1">Date Accomplished</p>
            </div>
            <div className="col-span-1">
                <div className="h-20 border border-gray-400 flex items-center justify-center bg-white">
                    <span className="text-sm text-gray-500">Signature (Sign inside the box)</span>
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
             <input type="text" name="personAdministeringOath" placeholder="Person Administering Oath" className="mt-4 block w-full p-2 border-b-2 border-gray-800 bg-transparent text-sm text-center" />
        </div>
    </div>
));


export default PdsForm;