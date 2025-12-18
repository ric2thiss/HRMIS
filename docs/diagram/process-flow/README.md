# Process Flow Diagrams

## 📋 Overview

This folder contains process flow diagrams illustrating business processes, user workflows, and system interactions in the DICT Project.

## 📁 Contents

Place your process flow diagrams here:

- `auth-login-flow.png` - User login process
- `auth-password-reset-flow.png` - Password reset workflow
- `leave-application-flow.png` - Leave application process
- `leave-approval-flow.png` - Leave approval workflow
- `attendance-time-in-out-flow.png` - Attendance recording
- `pds-submission-flow.png` - PDS submission process
- `user-registration-flow.png` - New user registration

## 🎯 Common Workflows

### 1. Authentication Flow

**Login Process:**
```
Start → Enter Credentials → Validate → Create Session → Dashboard
                              ↓
                          Show Error (if invalid)
```

**Password Reset:**
```
Forgot Password → Enter Email → Send Reset Link → 
Click Link → New Password → Reset → Login
```

### 2. Leave Management Flow

**Application:**
```
Request Leave → Fill Form → Check Credits → Submit →
Notify Approver → Wait for Approval → 
[Approved → Update Credits | Rejected → Notify User]
```

**Approval:**
```
Receive Notification → Review Application → 
[Approve → Deduct Credits | Reject → Add Comments] →
Notify Employee
```

### 3. Attendance Flow

**Daily Attendance:**
```
Arrive at Work → Time In → Work → Time Out → 
Calculate Hours → Update Record
```

### 4. PDS Flow

**Submission:**
```
Access PDS Form → Fill Sections → Upload Documents →
Review → Submit → Notify HR → HR Reviews → Approve
```

## 🛠️ Creating Flow Diagrams

### Standard Symbols

- **Oval**: Start/End
- **Rectangle**: Process/Action
- **Diamond**: Decision
- **Parallelogram**: Input/Output
- **Document**: Document/Report
- **Data Storage**: Database
- **Arrow**: Flow direction

### Color Coding

- **Blue**: Normal flow
- **Green**: Success path
- **Red**: Error/rejection path
- **Yellow**: Pending/waiting state

### Best Practices

1. Start from top or left
2. Use clear, concise labels
3. Show decision points clearly
4. Indicate success and failure paths
5. Include user interactions
6. Show system responses
7. Add notes for complex steps

## 📝 Naming Convention

`[module]-[process]-flow.[format]`

Examples:
- `auth-login-flow.png`
- `leave-approval-flow.png`
- `attendance-daily-flow.png`

## 🛠️ Recommended Tools

- [draw.io](https://draw.io/) - Free, feature-rich
- [Lucidchart](https://www.lucidchart.com/) - Professional diagrams
- [Mermaid](https://mermaid.js.org/) - Text-based flowcharts
- [Figma](https://www.figma.com/) - Design and prototyping

## 📚 Resources

- [Flowchart Symbols Guide](https://www.smartdraw.com/flowchart/flowchart-symbols.htm)
- [Process Mapping Best Practices](https://www.lucidchart.com/pages/process-mapping)
- [Business Process Modeling](https://www.bpmn.org/)

---

*Place your process flow diagrams in this folder with descriptive names.*

