# PDS Form Update to CS Form No. 212 Revised 2025 - Summary

## ✅ Completed Updates

### Backend (Laravel)
**Status: ✅ No Migration Required**
- The existing `PersonalDataSheet` model uses JSON storage in the `form_data` column, which can handle any structure
- The migration `2025_11_30_010835_create_personal_data_sheets_table.php` already supports flexible JSON data
- **No backend changes required** - the JSON field accommodates all new fields

### Frontend (React) - Key Updates

#### 1. **Form Header Updated**
- ✅ Changed from "Revised 2017" to "Revised 2025" in:
  - `PdsForm.jsx` main component
  - `PdsPrintView.jsx` print component
- ✅ Updated warning text to match 2025 format

#### 2. **I. PERSONAL INFORMATION Section - Updated Fields**

**Field Changes:**
- ✅ Changed `gsisIdNo` → `umidIdNo` (Item 10: UMID ID NO.)
- ✅ Added `philSysNumber` (Item 13: PhilSys Number (PSN))
- ✅ Removed `sssNo` (no longer in 2025 form)
- ✅ Updated date format label: "mm/dd/yyyy" → "dd/mm/yyyy"
- ✅ Updated "SEX" → "SEX AT BIRTH" (Item 5)
- ✅ Updated Civil Status options:
  - Changed "Widow/er" → "Widowed"
  - Changed "Others" → "Other/s" with inline text field
  - Removed "Solo Parent" (moved to Section 40)
- ✅ Enhanced Dual Citizenship section:
  - Added `dualCitizenshipType` field (by birth / by naturalization)
  - Updated country field to be conditional on Dual Citizenship selection

**Updated initialFormData Structure:**
```javascript
{
    // Item 1-2: Name
    surname: '', firstName: '', middleName: '', nameExtension: '',
    
    // Item 3-6: Basic Info
    dateOfBirth: '', placeOfBirth: '', sex: '', 
    civilStatus: '', civilStatusOthers: '',
    
    // Item 7-9: Measurements
    height: '', weight: '', bloodType: '',
    
    // Item 10-15: ID Numbers (Updated)
    umidIdNo: '',           // Changed from gsisIdNo
    pagIbigIdNo: '',
    philhealthNo: '',
    philSysNumber: '',      // NEW: Item 13
    tinNo: '',
    agencyEmployeeNo: '',
    
    // Item 16: Citizenship (Enhanced)
    citizenship: 'Filipino',
    dualCitizenshipType: '', // NEW: by birth / by naturalization
    dualCitizenshipCountry: '',
    
    // Item 17-21: Addresses & Contact
    // ... (unchanged)
}
```

## 📋 Model Structure Confirmation

### Laravel PersonalDataSheet Model
```php
// Database Column: form_data (JSON)
// The JSON structure now includes:

{
    // All fields from initialFormData
    // Arrays for: children, education, eligibility, workExperience, 
    //            voluntaryWork, training
    // Yes/No questions: q34a-q40c with details
    // References: refName1-3, refAddress1-3, refTel1-3
    // Declaration: govtIdType, govtIdNumber, govtIdIssuePlaceDate,
    //              dateAccomplished, photo, signature, 
    //              personAdministeringOath
}
```

**No migration needed** - JSON column accommodates all changes.

## 🔄 Remaining Tasks

### Frontend Components Still to Update:
1. **Section IV-VIII**: Review and ensure all sections match 2025 layout exactly
2. **Checkbox Rendering**: Implement visual checkmarks (☑/☐) for Yes/No questions
3. **Print Styles**: Ensure proper 4-page pagination with page breaks
4. **Work Experience Table**: Verify columns match 2025 form exactly
   - Should include: STATUS OF APPOINTMENT, GOV'T SERVICE (Y/N)

### Form Sections Status:
- ✅ **Section I**: Personal Information - Updated
- ⏳ **Section II**: Family Background - Needs review
- ⏳ **Section III**: Educational Background - Needs review
- ⏳ **Section IV**: Civil Service Eligibility - Needs review
- ⏳ **Section V**: Work Experience - Needs column verification
- ⏳ **Section VI**: Voluntary Work - Needs review
- ⏳ **Section VII**: Learning & Development - Needs review
- ⏳ **Section VIII**: Other Information - Needs review
- ⏳ **Section IX**: Yes/No Questions (34-40) - Needs checkbox styling
- ⏳ **Section X**: References - Needs review
- ⏳ **Section XI**: Declaration - Needs review

## 📝 Field Mapping Reference

### New Fields Added:
- `philSysNumber` - PhilSys Number (PSN) - Item 13
- `dualCitizenshipType` - Dual citizenship type selection
- `umidIdNo` - Replaces gsisIdNo

### Fields Removed:
- `gsisIdNo` - No longer in 2025 form
- `sssNo` - No longer in 2025 form

### Fields Renamed:
- Civil Status: "Widow/er" → "Widowed"
- Civil Status: "Others" → "Other/s"

## ✅ Confirmation Statements

1. **✅ Laravel PersonalDataSheet Model**: Uses JSON storage, no migration needed
2. **✅ InitialFormData Structure**: Updated with all 2025 fields
3. **✅ Form Header**: Updated to "Revised 2025"
4. **✅ Section I (Personal Information)**: Fully updated to match 2025 structure
5. **✅ Print Component**: Header updated to 2025

## 🎯 Next Steps

1. Complete review of remaining sections (II-XI)
2. Implement proper checkbox rendering for print/display
3. Test print functionality to ensure 4-page structure
4. Verify all field validations match 2025 requirements
5. Update any remaining date format references

