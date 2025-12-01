import React from 'react';

// Official CS Form No. 212 Print/PDF View (Revised 2017)
// This component displays the PDS data in the exact format of the official government form
const PdsPrintView = ({ formData }) => {
    if (!formData) return null;

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    // Helper function to display checkbox selection
    const displayCheckbox = (value, selectedValue) => {
        return value === selectedValue ? '☑' : '☐';
    };

    // Helper function to display Yes/No
    const displayYesNo = (value) => {
        if (!value) return '☐ Yes  ☐ No';
        return value === 'Yes' ? '☑ Yes  ☐ No' : '☐ Yes  ☑ No';
    };

    return (
        <div className="pds-official-print" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4', color: '#000', padding: '15px 20px', maxWidth: '100%', width: '100%', margin: '0 auto', overflow: 'visible', wordWrap: 'break-word' }}>
            {/* Official Form Header */}
            <div style={{ textAlign: 'center', marginBottom: '15px', pageBreakAfter: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'left' }}>
                        CS Form No. 212<br />
                        Revised 2017
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '10px' }}>
                        <div style={{ marginBottom: '5px' }}>
                            <strong>1. CS ID No.</strong> <span style={{ fontSize: '9px' }}>(Do not fill up. For CSC use only)</span>
                        </div>
                        <div style={{ borderBottom: '2px solid #000', width: '120px', height: '20px', display: 'inline-block' }}></div>
                    </div>
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', margin: '10px 0', letterSpacing: '1px' }}>
                    PERSONAL DATA SHEET
                </h1>
            </div>

            {/* Warning Section */}
            <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '8px', marginBottom: '15px', fontSize: '9px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    WARNING: Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.
                </p>
                <p style={{ marginBottom: '5px' }}>
                    <strong>READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS) BEFORE ACCOMPLISHING THE PDS FORM.</strong>
                </p>
                <p>
                    Print legibly. Tick appropriate boxes (☐) and use separate sheet if necessary. Indicate N/A if not applicable. DO NOT ABBREVIATE.
                </p>
            </div>

            {/* I. PERSONAL INFORMATION */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    I. PERSONAL INFORMATION
                </div>

                {/* 2. Name */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>2. Name</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000', verticalAlign: 'top' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>SURNAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.surname || ''}</div>
                                </td>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000', verticalAlign: 'top' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>FIRST NAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.firstName || ''}</div>
                                </td>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000', verticalAlign: 'top' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>MIDDLE NAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.middleName || ''}</div>
                                </td>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000', verticalAlign: 'top' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>NAME EXTENSION (JR., SR.)</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.nameExtension || ''}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 3-6. Date of Birth, Place of Birth, Sex, Civil Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>3. DATE OF BIRTH (mm/dd/yyyy)</div>
                        <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formatDate(formData.dateOfBirth)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>4. PLACE OF BIRTH</div>
                        <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.placeOfBirth || ''}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>5. SEX</div>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '9px' }}>
                            <span>{displayCheckbox('Male', formData.sex)} Male</span>
                            <span>{displayCheckbox('Female', formData.sex)} Female</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontSize: '9px', marginBottom: '5px', fontWeight: 'bold' }}>6. CIVIL STATUS</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '9px' }}>
                            <div>{displayCheckbox('Single', formData.civilStatus)} Single</div>
                            <div>{displayCheckbox('Married', formData.civilStatus)} Married</div>
                            <div>{displayCheckbox('Widow/er', formData.civilStatus)} Widow/er</div>
                            <div>{displayCheckbox('Separated', formData.civilStatus)} Separated</div>
                            <div>{displayCheckbox('Solo Parent', formData.civilStatus)} Solo Parent</div>
                            <div>
                                {displayCheckbox('Others', formData.civilStatus)} Others: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}>{formData.civilStatusOthers || ''}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '9px', marginBottom: '5px', fontWeight: 'bold' }}>16. CITIZENSHIP</div>
                        <div style={{ fontSize: '9px', marginBottom: '5px' }}>
                            {displayCheckbox('Filipino', formData.citizenship)} Filipino
                        </div>
                        <div style={{ fontSize: '9px', marginBottom: '5px' }}>
                            {displayCheckbox('Dual Citizenship', formData.citizenship)} Dual Citizenship
                            {formData.citizenship === 'Dual Citizenship' && (
                                <span style={{ marginLeft: '10px' }}>
                                    {displayCheckbox('by birth', formData.dualCitizenshipType)} by birth
                                    {displayCheckbox('by naturalization', formData.dualCitizenshipType)} by naturalization
                                </span>
                            )}
                        </div>
                        {formData.citizenship === 'Dual Citizenship' && (
                            <div style={{ marginTop: '5px', fontSize: '9px' }}>
                                <div>If holder of dual citizenship, please indicate the country:</div>
                                <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px', marginTop: '3px' }}>
                                    {formData.dualCitizenshipCountry || ''}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 7-15. Measurements & ID Numbers */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '10px' }}>Measurements & ID Numbers</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', fontSize: '9px' }}>
                        <div>
                            <div style={{ marginBottom: '2px' }}>7. HEIGHT (m)</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.height || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '2px' }}>8. WEIGHT (kg)</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.weight || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '2px' }}>9. BLOOD TYPE</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.bloodType || ''}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ marginBottom: '2px' }}>10. GSIS ID NO.</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.gsisIdNo || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '2px' }}>11. PAG-IBIG ID NO.</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.pagIbigIdNo || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '2px' }}>12. PHILHEALTH NO.</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.philhealthNo || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '2px' }}>13. SSS NO.</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.sssNo || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '2px' }}>14. TIN NO.</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.tinNo || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '2px' }}>15. AGENCY EMPLOYEE NO.</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.agencyEmployeeNo || ''}</div>
                        </div>
                    </div>
                </div>

                {/* 17-18. Addresses */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>17. RESIDENTIAL ADDRESS</div>
                        <div style={{ fontSize: '9px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '3px' }}>
                                <div>
                                    <div style={{ marginBottom: '2px' }}>House/Block/Lot No.</div>
                                    <div style={{ borderBottom: '1px solid #000', minHeight: '16px' }}>{formData.resHouseNo || ''}</div>
                                </div>
                                <div>
                                    <div style={{ marginBottom: '2px' }}>Street</div>
                                    <div style={{ borderBottom: '1px solid #000', minHeight: '16px' }}>{formData.resStreet || ''}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '3px' }}>
                                <div>
                                    <div style={{ marginBottom: '2px' }}>Subdivision/Village</div>
                                    <div style={{ borderBottom: '1px solid #000', minHeight: '16px' }}>{formData.resSubdivision || ''}</div>
                                </div>
                                <div>
                                    <div style={{ marginBottom: '2px' }}>Barangay</div>
                                    <div style={{ borderBottom: '1px solid #000', minHeight: '16px' }}>{formData.resBarangay || ''}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '3px' }}>
                                <div>
                                    <div style={{ marginBottom: '2px' }}>City/Municipality</div>
                                    <div style={{ borderBottom: '1px solid #000', minHeight: '16px' }}>{formData.resCity || ''}</div>
                                </div>
                                <div>
                                    <div style={{ marginBottom: '2px' }}>Province</div>
                                    <div style={{ borderBottom: '1px solid #000', minHeight: '16px' }}>{formData.resProvince || ''}</div>
                                </div>
                            </div>
                            <div>
                                <div style={{ marginBottom: '2px' }}>ZIP CODE</div>
                                <div style={{ borderBottom: '1px solid #000', minHeight: '16px' }}>{formData.resZipCode || ''}</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>18. PERMANENT ADDRESS</div>
                        {formData.sameAsResidential ? (
                            <div style={{ fontSize: '9px', fontStyle: 'italic', padding: '10px', border: '1px dashed #000' }}>Same as Residential Address</div>
                        ) : (
                            <div style={{ fontSize: '9px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '3px' }}>
                                    <div>
                                        <div style={{ marginBottom: '2px' }}>House/Block/Lot No.</div>
                                        <div style={{ borderBottom: '1px solid #000', minHeight: '16px', lineHeight: '16px', paddingBottom: '2px' }}>{formData.permHouseNo || ''}</div>
                                    </div>
                                    <div>
                                        <div style={{ marginBottom: '2px' }}>Street</div>
                                        <div style={{ borderBottom: '1px solid #000', minHeight: '16px', lineHeight: '16px', paddingBottom: '2px' }}>{formData.permStreet || ''}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '3px' }}>
                                    <div>
                                        <div style={{ marginBottom: '2px' }}>Subdivision/Village</div>
                                        <div style={{ borderBottom: '1px solid #000', minHeight: '16px', lineHeight: '16px', paddingBottom: '2px' }}>{formData.permSubdivision || ''}</div>
                                    </div>
                                    <div>
                                        <div style={{ marginBottom: '2px' }}>Barangay</div>
                                        <div style={{ borderBottom: '1px solid #000', minHeight: '16px', lineHeight: '16px', paddingBottom: '2px' }}>{formData.permBarangay || ''}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '3px' }}>
                                    <div>
                                        <div style={{ marginBottom: '2px' }}>City/Municipality</div>
                                        <div style={{ borderBottom: '1px solid #000', minHeight: '16px', lineHeight: '16px', paddingBottom: '2px' }}>{formData.permCity || ''}</div>
                                    </div>
                                    <div>
                                        <div style={{ marginBottom: '2px' }}>Province</div>
                                        <div style={{ borderBottom: '1px solid #000', minHeight: '16px', lineHeight: '16px', paddingBottom: '2px' }}>{formData.permProvince || ''}</div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ marginBottom: '2px' }}>ZIP CODE</div>
                                    <div style={{ borderBottom: '1px solid #000', minHeight: '16px', lineHeight: '16px', paddingBottom: '2px' }}>{formData.permZipCode || ''}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 19-21. Contact Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>19. TELEPHONE NO.</div>
                        <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.telephoneNo || ''}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>20. MOBILE NO.</div>
                        <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.mobileNo || ''}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>21. E-MAIL ADDRESS (if any)</div>
                        <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.emailAddress || ''}</div>
                    </div>
                </div>
            </div>

            {/* II. FAMILY BACKGROUND */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    II. FAMILY BACKGROUND
                </div>

                {/* 22. Spouse's Information */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>22. SPOUSE'S SURNAME</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000', marginBottom: '8px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '3px' }}>SURNAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.spouseSurname || ''}</div>
                                </td>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px' }}>FIRST NAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.spouseFirstName || ''}</div>
                                </td>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px' }}>MIDDLE NAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.spouseMiddleName || ''}</div>
                                </td>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px' }}>NAME EXTENSION</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.spouseExtension || ''}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '9px' }}>
                        <div>
                            <div style={{ marginBottom: '2px' }}>OCCUPATION</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.spouseOccupation || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '2px' }}>EMPLOYER/BUSINESS NAME</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.spouseEmployer || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '2px' }}>BUSINESS ADDRESS</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.spouseBusinessAddress || ''}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '5px', fontSize: '9px' }}>
                        <div style={{ marginBottom: '2px' }}>TELEPHONE NO.</div>
                        <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px', width: '200px' }}>{formData.spouseTelephone || ''}</div>
                    </div>
                </div>

                {/* 23. Children's Information */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>23. NAME OF CHILDREN (Write full name and list all)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', width: '60%' }}>FULL NAME</th>
                                <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', width: '40%' }}>DATE OF BIRTH (mm/dd/yyyy)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(formData.children || []).filter(c => c.name || c.dob).map((child, index) => (
                                <tr key={index}>
                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{child.name || ''}</td>
                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{formatDate(child.dob)}</td>
                                </tr>
                            ))}
                            {(!formData.children || formData.children.filter(c => c.name || c.dob).length === 0) && (
                                <tr>
                                    <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px' }} colSpan="2"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 24. Father's Information */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>24. FATHER'S NAME</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '3px' }}>SURNAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.fatherSurname || ''}</div>
                                </td>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px' }}>FIRST NAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.fatherFirstName || ''}</div>
                                </td>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px' }}>MIDDLE NAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.fatherMiddleName || ''}</div>
                                </td>
                                <td style={{ width: '25%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px' }}>NAME EXTENSION</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.fatherExtension || ''}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 25. Mother's Information */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>25. MOTHER'S MAIDEN NAME</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '33%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '3px' }}>SURNAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.motherSurname || ''}</div>
                                </td>
                                <td style={{ width: '33%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px' }}>FIRST NAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.motherFirstName || ''}</div>
                                </td>
                                <td style={{ width: '34%', padding: '5px', border: '1px solid #000' }}>
                                    <div style={{ fontSize: '9px', marginBottom: '2px' }}>MIDDLE NAME</div>
                                    <div style={{ minHeight: '18px', borderBottom: '1px solid #000', lineHeight: '18px', paddingBottom: '2px' }}>{formData.motherMiddleName || ''}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* III. EDUCATIONAL BACKGROUND */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    III. EDUCATIONAL BACKGROUND
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>26. LEVEL</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>LEVEL</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>NAME OF SCHOOL (Write in full)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>BASIC EDUCATION/DEGREE/COURSE (Write in full)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>PERIOD OF ATTENDANCE</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>HIGHEST LEVEL/UNITS EARNED (if not graduated)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>YEAR GRADUATED</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>SCHOLARSHIP/ACADEMIC HONORS RECEIVED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(formData.education || []).map((edu, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{edu.level || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{edu.school || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{edu.course || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{formatDate(edu.from)} - {formatDate(edu.to)}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{edu.units || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{edu.year || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{edu.honors || ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* IV. CIVIL SERVICE ELIGIBILITY */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    IV. CIVIL SERVICE ELIGIBILITY
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>27. CAREER SERVICE/RA 1080 (BOARD/BAR) UNDER SPECIAL LAWS/ CES/ CSEE BARANGAY ELIGIBILITY / DRIVER'S LICENSE</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>ELIGIBILITY (Write in full)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>RATING</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>DATE OF EXAMINATION/CONFERMENT</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>PLACE OF EXAMINATION/CONFERMENT</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>LICENSE (if applicable)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>VALIDITY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(formData.eligibility || []).filter(e => e.name || e.rating || e.date).map((elig, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{elig.name || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{elig.rating || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{formatDate(elig.date)}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{elig.place || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{elig.license || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{elig.validity || ''}</td>
                            </tr>
                        ))}
                        {(!formData.eligibility || formData.eligibility.filter(e => e.name || e.rating || e.date).length === 0) && (
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px' }} colSpan="6"></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* V. WORK EXPERIENCE */}
            <div style={{ marginBottom: '120px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    V. WORK EXPERIENCE
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>28. INCLUDING PRIVATE EMPLOYMENT. STARTING WITH THE MOST RECENT</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>INCLUSIVE DATES (mm/dd/yyyy)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>POSITION TITLE (Write in full/Do not abbreviate)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>DEPARTMENT/AGENCY/OFFICE/COMPANY (Write in full/Do not abbreviate)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>MONTHLY SALARY</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>SALARY/ JOB/ PAY GRADE (if applicable)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>STATUS OF APPOINTMENT</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>GOV'T SERVICE (Y/N)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(formData.workExperience || []).filter(w => w.position || w.company).map((work, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{formatDate(work.from)} - {formatDate(work.to)}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{work.position || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{work.company || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{work.salary || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{work.grade || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{work.status || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{work.govt || ''}</td>
                            </tr>
                        ))}
                        {(!formData.workExperience || formData.workExperience.filter(w => w.position || w.company).length === 0) && (
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px' }} colSpan="7"></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* VI. VOLUNTARY WORK */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    VI. VOLUNTARY WORK OR INVOLVEMENT IN CIVIC/NON-GOVERNMENT/PEOPLE/VOLUNTARY ORGANIZATIONS
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>29. INCLUDING PRIVATE EMPLOYMENT. STARTING WITH THE MOST RECENT</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000', marginTop: '0', marginBottom: '0' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#e5e7eb' }}>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', fontWeight: 'bold', fontSize: '9px' }}>NAME & ADDRESS OF ORGANIZATION (Write in full)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', fontWeight: 'bold', fontSize: '9px' }}>INCLUSIVE DATES (mm/dd/yyyy)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', fontWeight: 'bold', fontSize: '9px' }}>NUMBER OF HOURS</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', fontWeight: 'bold', fontSize: '9px' }}>POSITION/NATURE OF WORK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(formData.voluntaryWork || []).filter(v => v.organization).slice(0, 3).map((vol, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px', height: '20px', verticalAlign: 'top', fontSize: '9px' }}>{vol.organization || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px', height: '20px', verticalAlign: 'top', fontSize: '9px' }}>{formatDate(vol.from)} - {formatDate(vol.to)}</td>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px', height: '20px', verticalAlign: 'top', fontSize: '9px' }}>{vol.hours || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px', height: '20px', verticalAlign: 'top', fontSize: '9px' }}>{vol.position || ''}</td>
                            </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 3 - ((formData.voluntaryWork || []).filter(v => v.organization).length)) }).map((_, index) => (
                            <tr key={`empty-${index}`}>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px', height: '20px', fontSize: '9px' }}></td>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px', height: '20px', fontSize: '9px' }}></td>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px', height: '20px', fontSize: '9px' }}></td>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px', height: '20px', fontSize: '9px' }}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* VII. LEARNING AND DEVELOPMENT */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    VII. LEARNING AND DEVELOPMENT (L&D) INTERVENTIONS/TRAINING PROGRAMS ATTENDED
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>30. STARTING WITH THE MOST RECENT (Write in full)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>TITLE OF LEARNING AND DEVELOPMENT INTERVENTIONS/TRAINING PROGRAMS (Write in full)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>INCLUSIVE DATES OF ATTENDANCE (mm/dd/yyyy)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>NUMBER OF HOURS</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Type of LD (Managerial/ Supervisory/ Technical/etc)</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>CONDUCTED/ SPONSORED BY (Write in full)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(formData.training || []).filter(t => t.title).map((train, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{train.title || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{formatDate(train.from)} - {formatDate(train.to)}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{train.hours || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{train.type || ''}</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{train.sponsor || ''}</td>
                            </tr>
                        ))}
                        {(!formData.training || formData.training.filter(t => t.title).length === 0) && (
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '5px', minHeight: '20px' }} colSpan="5"></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* VIII. OTHER INFORMATION */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    VIII. OTHER INFORMATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>31. SPECIAL SKILLS and HOBBIES</div>
                        <div style={{ border: '1px solid #000', minHeight: '80px', padding: '5px', fontSize: '9px' }}>{formData.skillsAndHobbies || ''}</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>32. NON-ACADEMIC DISTINCTIONS / RECOGNITION (Write in full)</div>
                        <div style={{ border: '1px solid #000', minHeight: '80px', padding: '5px', fontSize: '9px' }}>{formData.distinctions || ''}</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>33. MEMBERSHIP IN ASSOCIATION/ORGANIZATION (Write in full)</div>
                        <div style={{ border: '1px solid #000', minHeight: '80px', padding: '5px', fontSize: '9px' }}>{formData.membership || ''}</div>
                    </div>
                </div>
            </div>

            {/* IX. YES/NO QUESTIONS */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    IX. YES/NO QUESTIONS
                </div>
                <div style={{ fontSize: '9px', lineHeight: '1.8' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>34.a</strong> Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be appointed, within the third degree? {displayYesNo(formData.q34a)}
                        {formData.q34a === 'Yes' && formData.q34aDetails && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, give details: {formData.q34aDetails}</div>
                        )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>34.b</strong> within the fourth degree (for Local Government Unit - Career Employees)? {displayYesNo(formData.q34b)}
                        {formData.q34b === 'Yes' && formData.q34bDetails && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, give details: {formData.q34bDetails}</div>
                        )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>35.a</strong> Have you ever been found guilty of any administrative offense? {displayYesNo(formData.q35a)}
                        {formData.q35a === 'Yes' && formData.q35aDetails && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, give details: {formData.q35aDetails}</div>
                        )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>35.b</strong> Have you been criminally charged before any court? {displayYesNo(formData.q35b)}
                        {formData.q35b === 'Yes' && formData.q35bDetails && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>Date Filed and Status of Case/s: {formData.q35bDetails}</div>
                        )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>36.</strong> Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal? {displayYesNo(formData.q36)}
                        {formData.q36 === 'Yes' && formData.q36Details && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, give details: {formData.q36Details}</div>
                        )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>37.</strong> Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector? {displayYesNo(formData.q37)}
                        {formData.q37 === 'Yes' && formData.q37Details && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, give details: {formData.q37Details}</div>
                        )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>38.a</strong> Have you ever been a candidate in a national or local election held within the last year (except Barangay election)? {displayYesNo(formData.q38a)}
                        {formData.q38a === 'Yes' && formData.q38aDetails && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, give details: {formData.q38aDetails}</div>
                        )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>38.b</strong> Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate? {displayYesNo(formData.q38b)}
                        {formData.q38b === 'Yes' && formData.q38bDetails && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, give details: {formData.q38bDetails}</div>
                        )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>39.</strong> Have you acquired the status of an immigrant or permanent resident of another country? {displayYesNo(formData.q39)}
                        {formData.q39 === 'Yes' && formData.q39Details && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, give details (country): {formData.q39Details}</div>
                        )}
                    </div>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>40. SPECIAL LAWS</div>
                    <div style={{ marginLeft: '15px', marginBottom: '8px' }}>
                        <strong>40.a</strong> Are you a member of any indigenous group? {displayYesNo(formData.q40a)}
                        {formData.q40a === 'Yes' && formData.q40aDetails && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, please specify: {formData.q40aDetails}</div>
                        )}
                    </div>
                    <div style={{ marginLeft: '15px', marginBottom: '8px' }}>
                        <strong>40.b</strong> Are you a person with disability? {displayYesNo(formData.q40b)}
                        {formData.q40b === 'Yes' && formData.q40bDetails && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, please specify ID No: {formData.q40bDetails}</div>
                        )}
                    </div>
                    <div style={{ marginLeft: '15px', marginBottom: '8px' }}>
                        <strong>40.c</strong> Are you a solo parent? {displayYesNo(formData.q40c)}
                        {formData.q40c === 'Yes' && formData.q40cDetails && (
                            <div style={{ marginLeft: '20px', marginTop: '3px' }}>If YES, please specify ID No: {formData.q40cDetails}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* X. REFERENCES */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    X. REFERENCES
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>41. REFERENCES (Person not related by consanguinity or affinity to applicant/appointee)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>NAME</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>ADDRESS</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>TEL. NO.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '5px', minHeight: '25px' }}>{formData.refName1 || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '5px' }}>{formData.refAddress1 || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '5px' }}>{formData.refTel1 || ''}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '5px', minHeight: '25px' }}>{formData.refName2 || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '5px' }}>{formData.refAddress2 || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '5px' }}>{formData.refTel2 || ''}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '5px', minHeight: '25px' }}>{formData.refName3 || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '5px' }}>{formData.refAddress3 || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '5px' }}>{formData.refTel3 || ''}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* XI. DECLARATION */}
            <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{ backgroundColor: '#e5e7eb', padding: '6px', border: '1px solid #000', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px' }}>
                    XI. DECLARATION
                </div>
                
                {/* 42. Declaration Text */}
                <div style={{ fontSize: '9px', lineHeight: '1.6', marginBottom: '15px', textAlign: 'justify' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>42.</div>
                    <p style={{ marginBottom: '15px' }}>
                        I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.
                    </p>
                </div>

                {/* Government Issued ID and Signature Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
                    {/* Left Column - Government Issued ID */}
                    <div style={{ fontSize: '9px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Government Issued ID (i.e. Passport, GSIS, SSS, PRC, Driver's License, etc.)</div>
                        <div style={{ fontSize: '8px', marginBottom: '3px', fontStyle: 'italic' }}>PLEASE INDICATE ID Number and Date</div>
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ marginBottom: '3px' }}>Government Issued ID:</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.govtIdType || ''}</div>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ marginBottom: '3px' }}>ID/License/Passport No.:</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.govtIdNumber || ''}</div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '3px' }}>Date/Place of Issuance:</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formData.govtIdIssuePlaceDate || ''}</div>
                        </div>
                    </div>

                    {/* Right Column - Signature and Date */}
                    <div style={{ fontSize: '9px' }}>
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ border: '2px solid #000', minHeight: '60px', padding: '5px', marginBottom: '5px', position: 'relative' }}>
                                <div style={{ fontSize: '8px', color: '#666', position: 'absolute', top: '2px', left: '5px' }}>Signature (Sign inside the box)</div>
                                {formData.signature && formData.signature.trim() !== '' ? (
                                    <img 
                                        src={formData.signature} 
                                        alt="Signature" 
                                        style={{ width: '100%', height: '50px', objectFit: 'contain', marginTop: '15px' }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                ) : (
                                    <div style={{ fontSize: '8px', color: '#999', textAlign: 'center', paddingTop: '25px' }}>[SIGNATURE PLACEHOLDER]</div>
                                )}
                            </div>
                        </div>
                        <div>
                            <div style={{ marginBottom: '3px' }}>Date Accomplished</div>
                            <div style={{ borderBottom: '1px solid #000', minHeight: '18px', lineHeight: '18px', paddingBottom: '2px' }}>{formatDate(formData.dateAccomplished)}</div>
                        </div>
                    </div>
                </div>

                {/* Photo and Thumbmark Section - Right Side */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginBottom: '20px' }}>
                    {/* PHOTO */}
                    <div style={{ border: '1px solid #000', padding: '8px', fontSize: '9px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', textAlign: 'center' }}>PHOTO</div>
                        <div style={{ width: '90px', height: '115px', border: '1px dashed #000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#666', textAlign: 'center', padding: '5px', position: 'relative', overflow: 'hidden' }}>
                            {formData.photo && formData.photo.trim() !== '' ? (
                                <img 
                                    src={formData.photo} 
                                    alt="2x2 Photo" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <>
                                    <div style={{ marginBottom: '3px' }}>ID picture taken</div>
                                    <div style={{ marginBottom: '3px' }}>within the last 6 months</div>
                                    <div style={{ marginBottom: '3px' }}>4.5 cm. X 3.5 cm</div>
                                    <div style={{ marginBottom: '3px' }}>(passport size)</div>
                                    <div style={{ marginTop: '5px', fontSize: '6px' }}>Computer generated or</div>
                                    <div style={{ fontSize: '6px' }}>photocopied picture is</div>
                                    <div style={{ fontSize: '6px' }}>not acceptable</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT THUMBMARK */}
                    <div style={{ border: '1px solid #000', padding: '8px', fontSize: '9px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', textAlign: 'center' }}>Right Thumbmark</div>
                        <div style={{ width: '90px', height: '115px', border: '1px dashed #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#666' }}>
                            [RIGHT THUMBMARK PLACEHOLDER]
                        </div>
                    </div>
                </div>

                {/* SUBSCRIBED AND SWORN Section */}
                <div style={{ fontSize: '9px', marginTop: '20px', border: '1px solid #000', padding: '12px' }}>
                    <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
                        <strong>SUBSCRIBED AND SWORN</strong> to before me this <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '150px', margin: '0 5px' }}></span>, affiant exhibiting his/her validly issued government ID as indicated above.
                    </div>
                    <div style={{ border: '1px solid #000', minHeight: '60px', marginBottom: '10px', padding: '5px', position: 'relative' }}>
                        <div style={{ fontSize: '8px', color: '#666', position: 'absolute', top: '2px', left: '5px' }}>Person Administering Oath</div>
                        {formData.personAdministeringOath ? (
                            <div style={{ fontSize: '9px', textAlign: 'center', paddingTop: '20px', fontWeight: 'bold' }}>{formData.personAdministeringOath}</div>
                        ) : (
                            <div style={{ fontSize: '8px', color: '#999', textAlign: 'center', paddingTop: '20px' }}>[SIGNATURE BOX PLACEHOLDER]</div>
                        )}
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <div style={{ borderBottom: '1px solid #000', minHeight: '25px', lineHeight: '25px', paddingBottom: '2px' }}>
                            <div style={{ fontSize: '8px', color: '#666', marginBottom: '2px' }}>Person Administering Oath</div>
                        </div>
                    </div>
                </div>

                {/* Page Footer */}
                <div style={{ textAlign: 'right', fontSize: '8px', marginTop: '20px', color: '#666' }}>
                    CS FORM 212 (Revised 2017). Page 4 of 4
                </div>
            </div>
        </div>
    );
};

export default PdsPrintView;
