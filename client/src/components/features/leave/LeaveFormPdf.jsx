import React from 'react';
import Logo from '../../../asset/DICT logo.svg';

function LeaveFormPdf({ leave }) {
  if (!leave) return null;
  
  // Get user from leave object
  const user = leave.user;
  if (!user) return null;

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // Get full name parts
  const getNameParts = () => {
    return {
      last: user.last_name || '',
      first: user.first_name || '',
      middle: user.middle_initial || ''
    };
  };

  // Get approver names
  const getApproverName = (approver) => {
    if (!approver) return '';
    if (approver.first_name && approver.last_name) {
      return `${approver.first_name} ${approver.middle_initial || ''} ${approver.last_name}`.trim();
    }
    return approver.name || '';
  };

  // Determine leave type details
  const getLeaveTypeDetails = () => {
    const leaveType = leave.leave_type?.name || '';
    const code = leave.leave_type?.code || '';
    
    // Map leave types to CS Form options
    const leaveTypeMap = {
      'VL': 'Vacation Leave',
      'SL': 'Sick Leave',
      'SPL': 'Special Privilege Leave',
      'ML': 'Maternity Leave',
      'PL': 'Paternity Leave',
      'SOLO': 'Solo Parent Leave',
      'STUDY': 'Study Leave',
      'VAWC': '10-Day VAWC Leave',
      'REHAB': 'Rehabilitation Privilege',
      'WOMEN': 'Special Leave Benefits for Women',
      'CALAMITY': 'Special Emergency (Calamity) Leave',
      'ADOPTION': 'Adoption Leave',
      'MANDATORY': 'Mandatory/Forced Leave'
    };

    return leaveTypeMap[code] || leaveType;
  };

  // Get inclusive dates string
  const getInclusiveDates = () => {
    if (!leave.start_date || !leave.end_date) return '';
    const start = formatDateShort(leave.start_date);
    const end = formatDateShort(leave.end_date);
    return `${start} to ${end}`;
  };

  // Check if leave type is checked
  const isLeaveTypeChecked = (type) => {
    const leaveTypeName = getLeaveTypeDetails();
    return leaveTypeName.toLowerCase().includes(type.toLowerCase());
  };

  const nameParts = getNameParts();

  return (
    <div className="leave-form-pdf" style={{ 
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#000',
      maxWidth: '210mm',
      margin: '10mm auto',
      backgroundColor: '#fff',
    //   border: '2px solid #000',
      padding: '8mm'
    }}>
      {/* Header */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px'}}>
        <tbody>
          {/* First row: Form number on left, ANNEX A on right */}
          <tr>
            <td style={{ width: '33%', verticalAlign: 'top', paddingBottom: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Civil Service Form No. 6</div>
              <div style={{ fontSize: '10px' }}>Revised 2020</div>
            </td>
            <td style={{ width: '34%', textAlign: 'center', verticalAlign: 'top', paddingBottom: '4px' }}>
              {/* Empty center cell in first row */}
            </td>
            <td style={{ width: '33%', textAlign: 'right', verticalAlign: 'top', paddingBottom: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>ANNEX A</div>
            </td>
          </tr>
          {/* Second row: Logo on left, Agency info in center, Stamp box on right */}
          <tr>
            <td style={{ width: '33%', verticalAlign: 'middle', paddingBottom: '8px' }}>
              <div style={{ 
                width: '65px', 
                height: '65px', 
                borderRadius: '50%', 
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // overflow: 'hidden',
                padding: '5px'
              }}>
                <img 
                  src={Logo} 
                  alt="DICT Logo" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    // objectFit: 'contain' 
                  }}
                />
              </div>
            </td>
            <td style={{ width: '34%', textAlign: 'center', verticalAlign: 'middle', paddingBottom: '8px' }}>
              <div style={{ fontSize: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>Republic of the Philippines</div>
                <div style={{ marginTop: '3px', fontStyle: 'italic' }}>Department of Information and Communications Technology</div>
                <div style={{ fontStyle: 'italic', fontSize: '9px' }}>DICT Regional Office XIII Building, J. Rosales Avenue, Butuan City, Agusan del Norte, Philippines</div>
              </div>
            </td>
            <td style={{ width: '33%', textAlign: 'right', verticalAlign: 'middle', paddingBottom: '8px' }}>
              <div style={{ 
                border: '1px dashed #000', 
                padding: '5px',
                fontSize: '9px',
                minHeight: '25px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '120px'
              }}>
                {formatDateShort(leave.created_at)}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Title */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '14px', 
        fontWeight: 'bold',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        APPLICATION FOR LEAVE
      </div>

      {/* Section 1-5: Basic Information */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0', border: '2px solid #000' }}>
        <tbody>
          {/* First Row: OFFICE/DEPARTMENT and NAME */}
          <tr>
            <td style={{ width: '50%', padding: '8px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}>
                1. OFFICE/DEPARTMENT
              </div>
              <div style={{ 
                borderBottom: '1px solid #000', 
                minHeight: '20px',
                paddingBottom: '3px',
                width: '100%'
              }}>
                {user.office?.name || user.office?.code || ''}
              </div>
            </td>
            <td style={{ width: '50%', padding: '8px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}>
                2. NAME : (Last) (First) (Middle)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ 
                      borderBottom: '1px solid #000', 
                      minHeight: '20px', 
                      paddingBottom: '3px', 
                      width: '33%',
                      paddingRight: '4px'
                    }}>
                      {/* <div style={{ fontSize: '9px', marginBottom: '2px', color: '#666' }}>(Last)</div> */}
                      {nameParts.last}
                    </td>
                    <td style={{ 
                      borderBottom: '1px solid #000', 
                      minHeight: '20px', 
                      paddingBottom: '3px', 
                      width: '33%',
                      paddingLeft: '4px',
                      paddingRight: '4px'
                    }}>
                      {/* <div style={{ fontSize: '9px', marginBottom: '2px', color: '#666' }}>(First)</div> */}
                      {nameParts.first}
                    </td>
                    <td style={{ 
                      borderBottom: '1px solid #000', 
                      minHeight: '20px', 
                      paddingBottom: '3px', 
                      width: '34%',
                      paddingLeft: '4px'
                    }}>
                      {/* <div style={{ fontSize: '9px', marginBottom: '2px', color: '#666' }}>(Middle)</div> */}
                      {nameParts.middle}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          {/* Second Row: DATE OF FILING, POSITION, SALARY */}
          <tr>
            <td style={{ 
              width: '33%', 
              padding: '8px', 
              verticalAlign: 'top', 
              borderTop: '1px solid #000',
            //   borderRight: '1px solid #000'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}>
                3. DATE OF FILING
              </div>
              <div style={{ 
                borderBottom: '1px solid #000', 
                minHeight: '20px',
                paddingBottom: '3px',
                width: '100%'
              }}>
                {formatDate(leave.created_at)}
              </div>
            </td>
            <td style={{ 
              width: '33%', 
              padding: '8px', 
              verticalAlign: 'top',
              borderTop: '1px solid #000',
              borderRight: '1px solid #000'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}>
                4. POSITION
              </div>
              <div style={{ 
                borderBottom: '1px solid #000', 
                minHeight: '20px',
                paddingBottom: '3px',
                width: '100%'
              }}>
                {user.position?.title || ''}
              </div>
            </td>
            <td style={{ 
              width: '34%', 
              padding: '8px', 
              verticalAlign: 'top',
              borderTop: '1px solid #000'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}>
                5. SALARY
              </div>
              <div style={{ 
                borderBottom: '1px solid #000', 
                minHeight: '20px',
                paddingBottom: '3px',
                width: '100%'
              }}>
                {/* Salary not available */}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Section 6: DETAILS OF APPLICATION */}
      <div style={{ marginBottom: '0', border: '2px solid #000', borderTop: 'none' }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '11px',
          marginBottom: '0',
          borderTop: '2px solid #000',
          borderBottom: '2px solid #000',
          paddingTop: '5px',
          paddingBottom: '5px',
          textAlign: 'center',
          textTransform: 'uppercase'
        }}>
          6. DETAILS OF APPLICATION
        </div>

        {/* Two Column Layout: 6.A & 6.C on left, 6.B & 6.D on right */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: '2px solid #000', borderRight: '2px solid #000', borderBottom: '2px solid #000' }}>
          <tbody>
            <tr>
              {/* Left Column */}
              <td style={{ width: '50%', padding: '8px', paddingRight: '8px', verticalAlign: 'top', borderRight: '1px solid #000' }}>
                {/* 6.A TYPE OF LEAVE */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>
                    6.A TYPE OF LEAVE TO BE AVAILED OF:
                  </div>
                  <div style={{ fontSize: '9px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('vacation') ? '☑' : '☐'}
                      </span>
                      <span>Vacation Leave (Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('mandatory') ? '☑' : '☐'}
                      </span>
                      <span>Mandatory/Forced Leave (Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('sick') ? '☑' : '☐'}
                      </span>
                      <span>Sick Leave (Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('maternity') ? '☑' : '☐'}
                      </span>
                      <span>Maternity Leave (R.A. No. 11210 / IRR issued by CSC, DOLE and SSS)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('paternity') ? '☑' : '☐'}
                      </span>
                      <span>Paternity Leave (R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('special privilege') ? '☑' : '☐'}
                      </span>
                      <span>Special Privilege Leave (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('solo parent') ? '☑' : '☐'}
                      </span>
                      <span>Solo Parent Leave (R.A. No. 8972 / CSC MC No. 8, s. 2004)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('study') ? '☑' : '☐'}
                      </span>
                      <span>Study Leave (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('vawc') ? '☑' : '☐'}
                      </span>
                      <span>10-Day VAWC Leave (R.A. No. 9262 / CSC MC No. 15, s. 2005)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('rehabilitation') ? '☑' : '☐'}
                      </span>
                      <span>Rehabilitation Privilege (Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('women') ? '☑' : '☐'}
                      </span>
                      <span>Special Leave Benefits for Women (R.A. No. 9710 / CSC MC No. 25, s. 2010)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('calamity') ? '☑' : '☐'}
                      </span>
                      <span>Special Emergency (Calamity) Leave (CSC MC No. 2, s. 2012, as amended)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {isLeaveTypeChecked('adoption') ? '☑' : '☐'}
                      </span>
                      <span>Adoption Leave (R.A. No. 8552)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>☐</span>
                      <span>Others: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px', marginLeft: '3px' }}></span></span>
                    </div>
                  </div>
                </div>

                {/* 6.C NUMBER OF WORKING DAYS */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>
                    6.C NUMBER OF WORKING DAYS APPLIED FOR:
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0', verticalAlign: 'middle', width: 'auto' }}>
                          <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '40px', paddingBottom: '2px' }}>
                            {leave.working_days || 0}
                          </span>
                        </td>
                        <td style={{ padding: '0 8px', verticalAlign: 'middle', width: 'auto' }}>
                          <span style={{ fontWeight: 'bold' }}>INCLUSIVE DATES:</span>
                        </td>
                        <td style={{ padding: '0', verticalAlign: 'middle', width: '100%' }}>
                          <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '100%', paddingBottom: '2px' }}>
                            {getInclusiveDates()}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>

              {/* Right Column */}
              <td style={{ width: '50%', padding: '8px', paddingLeft: '8px', verticalAlign: 'top' }}>
                {/* 6.B DETAILS OF LEAVE */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>
                    6.B DETAILS OF LEAVE:
                  </div>
                  <div style={{ fontSize: '9px', marginLeft: '12px' }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>In case of Vacation/Special Privilege Leave:</strong>
              <div style={{ marginLeft: '15px', marginTop: '2px' }}>
                <span style={{ marginRight: '4px', fontSize: '10px' }}>☐</span> Within the Philippines
                <span style={{ marginLeft: '15px', marginRight: '4px', fontSize: '10px' }}>☐</span> Abroad (Specify): 
                <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px', marginLeft: '3px' }}></span>
              </div>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>In case of Sick Leave:</strong>
              <div style={{ marginLeft: '15px', marginTop: '2px' }}>
                <span style={{ marginRight: '4px', fontSize: '10px' }}>☐</span> In Hospital (Specify Illness): 
                <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px', marginLeft: '3px' }}></span>
                <div style={{ marginTop: '2px' }}>
                  <span style={{ marginRight: '4px', fontSize: '10px' }}>☐</span> Out Patient (Specify Illness): 
                  <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px', marginLeft: '3px' }}></span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>In case of Special Leave Benefits for Women:</strong>
              <div style={{ marginLeft: '15px', marginTop: '2px' }}>
                (Specify Illness): 
                <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '150px', marginLeft: '3px' }}></span>
              </div>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>In case of Study Leave:</strong>
              <div style={{ marginLeft: '15px', marginTop: '2px' }}>
                <span style={{ marginRight: '4px', fontSize: '10px' }}>☐</span> Completion of Master's Degree
                <span style={{ marginLeft: '15px', marginRight: '4px', fontSize: '10px' }}>☐</span> BAR/Board Examination Review
                <div style={{ marginTop: '2px' }}>
                  Other purpose: 
                  <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px', marginLeft: '3px' }}></span>
                </div>
                <div style={{ marginTop: '2px' }}>
                  <span style={{ marginRight: '4px', fontSize: '10px' }}>☐</span> Monetization of Leave Credits
                  <span style={{ marginLeft: '15px', marginRight: '4px', fontSize: '10px' }}>☐</span> Terminal Leave
                </div>
              </div>
            </div>
                  </div>
                </div>

                {/* 6.D COMMUTATION */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>
                    6.D COMMUTATION:
                  </div>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {leave.commutation === 'Not Requested' ? '☑' : '☐'}
                      </span>
                      <span style={{ fontSize: '10px' }}>Not Requested</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '4px', fontSize: '10px' }}>
                        {leave.commutation === 'Requested' ? '☑' : '☐'}
                      </span>
                      <span style={{ fontSize: '10px' }}>Requested</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <div style={{ 
                      borderTop: '1px solid #000', 
                      width: '180px', 
                      marginLeft: 'auto', 
                      paddingTop: '3px',
                      position: 'relative',
                      minHeight: '35px'
                    }}>
                      {user.signature && (
                        <img 
                          src={user.signature} 
                          alt="Applicant Signature" 
                          style={{ 
                            maxWidth: '120px', 
                            maxHeight: '35px', 
                            position: 'absolute',
                            top: '-32px',
                            right: '0',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                      <div style={{ fontSize: '9px' }}>(Signature of Applicant)</div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 7: DETAILS OF ACTION ON APPLICATION */}
      <div style={{ marginTop: '0', border: '2px solid #000', borderTop: 'none' }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '11px',
          marginBottom: '0',
          borderTop: '2px solid #000',
          borderBottom: '2px solid #000',
          paddingTop: '5px',
          paddingBottom: '5px',
          textAlign: 'center',
          textTransform: 'uppercase'
        }}>
          7. DETAILS OF ACTION ON APPLICATION
        </div>

        {/* 7.A and 7.B in a row */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', borderLeft: '2px solid #000', borderRight: '2px solid #000' }}>
          <tbody>
            <tr>
              {/* 7.A CERTIFICATION OF LEAVE CREDITS */}
              <td style={{ width: '50%', padding: '6px', paddingRight: '8px', verticalAlign: 'top', border: '1px solid #000', borderLeft: 'none', borderTop: 'none' }}>
                <div style={{ padding: '0' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px', textTransform: 'uppercase' }}>
                    7.A CERTIFICATION OF LEAVE CREDITS
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '9px' }}>
                    As of: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px', marginLeft: '3px', paddingBottom: '2px' }}>
                      {formatDate(leave.created_at)}
                    </span>
                  </div>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    marginBottom: '12px',
                    fontSize: '9px',
                    border: '1px solid #000'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', width: '40%' }}></th>
                        <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', width: '30%' }}>Vacation Leave</th>
                        <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', width: '30%' }}>Sick Leave</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '4px', fontStyle: 'italic' }}>Total Earned</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '4px', fontStyle: 'italic' }}>Less this application</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{leave.working_days || 0}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '4px', fontStyle: 'italic' }}>Balance</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: '35px', textAlign: 'center', clear: 'both' }}>
                    <div style={{ 
                      borderTop: '1px solid #000', 
                      width: '180px', 
                      margin: '0 auto', 
                      paddingTop: '3px',
                      position: 'relative',
                      minHeight: '35px',
                      display: 'block'
                    }}>
                      {leave.leave_credit_officer_signature && (
                        <img 
                          src={leave.leave_credit_officer_signature} 
                          alt="Signature" 
                          style={{ 
                            maxWidth: '120px', 
                            maxHeight: '35px', 
                            position: 'absolute',
                            top: '-32px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                        />
                      )}
                      <div style={{ fontSize: '9px', textAlign: 'center', marginTop: '5px' }}>(Authorized Officer)</div>
                      <div style={{ fontSize: '8px', marginTop: '2px', textAlign: 'center' }}>
                        {getApproverName(leave.leaveCreditOfficerApprover) || leave.leaveCreditAuthorizedOfficer?.name || ''}
                      </div>
                    </div>
                  </div>
                </div>
              </td>

              {/* 7.B RECOMMENDATION */}
              <td style={{ width: '50%', padding: '6px', paddingLeft: '8px', verticalAlign: 'top', border: '1px solid #000', borderRight: 'none', borderTop: 'none' }}>
                <div style={{ padding: '0' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>
                    7.B RECOMMENDATION:
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '9px' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '4px', fontSize: '10px' }}>
                          {leave.recommendation_approver_approved ? '☑' : '☐'}
                        </span>
                        <span>For approval</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '4px', fontSize: '10px' }}>
                          {leave.recommendation_approver_approved === false ? '☑' : '☐'}
                        </span>
                        <span>For disapproval due to:</span>
                      </div>
                    </div>
                    {leave.recommendation_approver_remarks && (
                      <div style={{ 
                        border: '1px solid #000', 
                        minHeight: '35px', 
                        padding: '3px',
                        marginLeft: '15px',
                        fontSize: '9px'
                      }}>
                        {leave.recommendation_approver_remarks}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <div style={{ 
                      borderTop: '1px solid #000', 
                      width: '180px', 
                      marginLeft: 'auto', 
                      paddingTop: '3px',
                      position: 'relative',
                      minHeight: '35px'
                    }}>
                      {leave.recommendation_approver_signature && (
                        <img 
                          src={leave.recommendation_approver_signature} 
                          alt="Signature" 
                          style={{ 
                            maxWidth: '120px', 
                            maxHeight: '35px', 
                            position: 'absolute',
                            top: '-32px',
                            right: '0',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                      <div style={{ fontSize: '9px' }}>(Authorized Officer)</div>
                      <div style={{ fontSize: '8px', marginTop: '2px' }}>
                        {getApproverName(leave.recommendationApproverApprover) || leave.recommendationApprover?.name || ''}
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 7.C and 7.D in a row */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderLeft: '2px solid #000', borderRight: '2px solid #000', borderBottom: '2px solid #000' }}>
          <tbody>
            <tr>
              {/* 7.C APPROVED FOR */}
              <td style={{ width: '50%', padding: '6px', paddingRight: '8px', verticalAlign: 'top', border: '1px solid #000', borderLeft: 'none' }}>
                <div style={{ padding: '0' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>
                    7.C APPROVED FOR:
                  </div>
                  <div style={{ marginLeft: '10px', marginBottom: '8px', fontSize: '9px' }}>
                    <div style={{ marginBottom: '3px' }}>
                      <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '60px', marginRight: '6px', paddingBottom: '1px' }}>
                        {leave.status === 'approved' ? (leave.working_days || 0) : ''}
                      </span> days with pay
                    </div>
                    <div style={{ marginBottom: '3px' }}>
                      <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '60px', marginRight: '6px', paddingBottom: '1px' }}></span> days without pay
                    </div>
                    <div>
                      others (Specify): 
                      <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px', marginLeft: '3px', paddingBottom: '1px' }}></span>
                    </div>
                  </div>
                </div>
              </td>

              {/* 7.D DISAPPROVED DUE TO */}
              <td style={{ width: '50%', padding: '6px', paddingLeft: '8px', verticalAlign: 'top', border: '1px solid #000', borderRight: 'none' }}>
                <div style={{ padding: '0' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '10px' }}>
                    7.D DISAPPROVED DUE TO:
                  </div>
                  <div style={{ 
                    border: '1px solid #000', 
                    minHeight: '50px', 
                    padding: '3px',
                    marginLeft: '10px',
                    fontSize: '9px'
                  }}>
                    {leave.status === 'rejected' ? (leave.approval_remarks || leave.leave_approver_remarks || '') : ''}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Final Approver Signature */}
        {leave.status === 'approved' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div style={{ 
              borderTop: '1px solid #000', 
              width: '250px', 
              margin: '0 auto', 
              paddingTop: '3px',
              position: 'relative',
              minHeight: '35px'
            }}>
              {leave.leave_approver_signature && (
                <img 
                  src={leave.leave_approver_signature} 
                  alt="Signature" 
                  style={{ 
                    maxWidth: '120px', 
                    maxHeight: '35px', 
                    position: 'absolute',
                    top: '-32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    objectFit: 'contain'
                  }}
                />
              )}
              <div style={{ fontSize: '9px' }}>(Authorized Official)</div>
              <div style={{ fontSize: '8px', marginTop: '2px' }}>
                {getApproverName(leave.leaveApproverApprover) || leave.leaveApprover?.name || ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Second Page: INSTRUCTIONS AND REQUIREMENTS */}
      <div style={{ 
        pageBreakBefore: 'always',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        lineHeight: '1.4',
        color: '#000',
        maxWidth: '210mm',
        margin: '10mm auto',
        backgroundColor: '#fff',
        border: '2px solid #000',
        padding: '8mm'
      }}>
        {/* Title */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '14px', 
          fontWeight: 'bold',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          INSTRUCTIONS AND REQUIREMENTS
        </div>

        {/* Introductory Paragraph */}
        <div style={{ 
          marginBottom: '12px',
          fontSize: '11px',
          textAlign: 'justify'
        }}>
          Application for any type of leave shall be made on this Form and to be accomplished at least in duplicate with documentary requirements, as follows:
        </div>

        {/* Two Column Layout for Instructions */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              {/* Left Column */}
              <td style={{ width: '50%', paddingRight: '10px', verticalAlign: 'top' }}>
                <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>1. Vacation leave*:</strong> Requires filing five (5) days in advance, indicating if within the Philippines or abroad for travel authority and clearance.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>2. Mandatory/Forced leave:</strong> Details forfeiture of annual five-day vacation leave if not taken, and conditions for availing one or more days for compliance with Section 25, Rule XVI of the Omnibus Rules Implementing E.O. No. 292.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>3. Sick leave*:</strong> Requires immediate filing upon return, or a medical certificate if filed in advance or exceeding five days. An affidavit is needed if no medical consultation was availed.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>4. Maternity leave* - 105 days:</strong> Requires proof of pregnancy (ultrasound, doctor's certificate), accomplished Notice of Allocation of Maternity Leave Credits (CS Form No. 6a) if needed, and states that seconded female employees get full pay in the recipient agency.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>5. Paternity leave - 7 days:</strong> Requires proof of child's delivery (birth certificate, medical certificate, marriage contract).
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>6. Special Privilege leave - 3 days:</strong> Requires filing/approval at least one week prior, except for emergencies. Travel within the Philippines or abroad must be indicated for travel authority and clearance.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>7. Solo Parent leave - 7 days:</strong> Requires filing in advance or five days prior with an updated Solo Parent Identification Card.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>8. Study leave* - up to 6 months:</strong> Requires meeting agency's internal requirements and a contract between the agency head/authorized representative and the employee.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>9. VAWC leave - 10 days:</strong> Requires filing in advance or immediately upon return. Supporting documents include a Barangay Protection Order (BPO), Temporary/Permanent Protection Order (TPO/PPO), a certification of filing for BPO/TPO/PPO, or a police report and medical certificate at the supervisor's discretion.
                  </div>
                </div>
              </td>

              {/* Right Column */}
              <td style={{ width: '50%', paddingLeft: '10px', verticalAlign: 'top' }}>
                <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>10. Rehabilitation leave* - up to 6 months:</strong> Requires application within one week of the accident (unless longer period warranted), a letter request with relevant reports (e.g., police report), a medical certificate detailing injuries, treatment, and need for recuperation, and written concurrence from a government physician if the attending physician is private.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>11. Special leave benefits for women* - up to 2 months:</strong> Requires application at least five days prior to scheduled gynecological surgery, or immediately upon return for emergencies (with agency notification during confinement). A medical certificate with a clinical summary, histopathological report, operative technique, duration of surgery, and estimated recuperation period is required.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>12. Special Emergency (Calamity) leave up to 5 days:</strong> Can be applied for a maximum of five straight working days or staggered within thirty days of the calamity. It's a once-a-year privilege. The head of office is responsible for verification, including place of residence and calamity area declaration.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>13. Monetization of leave credits:</strong> Requires a letter request to the head of the agency stating valid and justifiable reasons for monetizing 50% or more of accumulated leave credits.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>14. Terminal leave*:</strong> Requires proof of employee's resignation, retirement, or separation from service.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>15. Adoption Leave:</strong> Requires filing with an authenticated copy of the Pre-Adoptive Placement Authority from the Department of Social Welfare and Development (DSWD).
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaveFormPdf;
