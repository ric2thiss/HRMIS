# Documentation Guide

## 📋 Purpose

This guide provides standards and best practices for creating and maintaining documentation for the DICT Project. Consistent documentation ensures that all team members can understand, maintain, and extend the system effectively.

## 🎯 Documentation Principles

### 1. **Clarity**
- Write in clear, simple language
- Avoid jargon unless necessary (and define it when used)
- Use examples to illustrate complex concepts

### 2. **Completeness**
- Document all features, APIs, and configurations
- Include edge cases and common issues
- Provide troubleshooting guides

### 3. **Currency**
- Keep documentation up-to-date with code changes
- Mark deprecated features clearly
- Update version history

### 4. **Accessibility**
- Use proper markdown formatting
- Include a table of contents for long documents
- Provide cross-references to related documentation

## 📁 Documentation Structure

### Main Documentation (`docs/`)

```
docs/
├── README.md                    # Main documentation index
├── DOCUMENTATION_GUIDE.md       # This file
├── setup/                       # Installation and setup guides
├── general/                     # Architecture and conventions
├── modules/                     # Feature-specific documentation
└── diagram/                     # Visual documentation
    ├── erd/                    # Entity Relationship Diagrams
    └── process-flow/           # Process flow diagrams
```

## ✍️ Writing Standards

### Markdown Conventions

#### Headings
- Use `#` for document title (once per document)
- Use `##` for major sections
- Use `###` for subsections
- Use `####` for sub-subsections

#### Code Blocks
Always specify the language for syntax highlighting:

```javascript
// Good
const example = "with language specified";
```

#### Links
- Use descriptive link text
- Prefer relative links for internal documentation
- Example: `[Installation Guide](./setup/INSTALLATION.md)`

#### Lists
- Use `-` for unordered lists
- Use `1.` for ordered lists
- Indent nested lists with 2 spaces

### Code Examples

Include working code examples:
- Keep examples concise but complete
- Add comments to explain non-obvious code
- Test examples to ensure they work

### API Documentation

For each endpoint, document:
- **Method**: GET, POST, PUT, DELETE, etc.
- **URL**: The endpoint path
- **Auth Required**: Yes/No and type
- **Permissions**: Required role/permissions
- **Request Parameters**: Query params, body params
- **Request Example**: Sample request with data
- **Success Response**: Status code and response body
- **Error Response**: Possible error codes and messages

Example:

```markdown
### Create Leave Application

**Method**: `POST`

**URL**: `/api/leave/applications`

**Auth Required**: Yes (Bearer Token)

**Permissions**: Employee, HR, Admin

**Request Body**:
```json
{
  "leave_type_id": 1,
  "start_date": "2025-01-15",
  "end_date": "2025-01-17",
  "reason": "Family vacation"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "leave_type_id": 1,
    "status": "pending",
    ...
  }
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid or missing token
- `422 Unprocessable Entity` - Validation errors
- `403 Forbidden` - Insufficient leave credits
```

## 📝 Document Templates

### Feature Module Template

Use this template for documenting features in `docs/modules/`:

```markdown
# [Module Name]

## Overview
Brief description of what this module does and why it exists.

## Features
- Feature 1
- Feature 2
- Feature 3

## User Roles
- **Admin**: Can do X, Y, Z
- **HR**: Can do A, B, C
- **Employee**: Can do P, Q, R

## Database Schema
List relevant tables and key fields.

## API Endpoints
Document all endpoints for this module.

## Frontend Components
List main components and their purposes.

## State Management
Describe stores/state used.

## Business Rules
Important logic and rules.

## Workflows
Step-by-step process flows.

## Common Issues & Troubleshooting
Known issues and solutions.

## Future Enhancements
Planned improvements.
```

### Setup Guide Template

```markdown
# [Setup Title]

## Prerequisites
- Requirement 1
- Requirement 2

## Step-by-Step Instructions

### Step 1: [Title]
Description and commands.

### Step 2: [Title]
Description and commands.

## Verification
How to verify the setup was successful.

## Troubleshooting
Common issues and solutions.
```

## 🔄 Update Process

### When to Update Documentation

Update documentation when:
1. Adding new features or modules
2. Modifying existing functionality
3. Changing API contracts
4. Updating dependencies
5. Fixing bugs that affect documented behavior
6. Changing configuration or setup procedures

### Review Process

1. **Create**: Write documentation for your changes
2. **Review**: Have documentation reviewed alongside code
3. **Test**: Verify examples and instructions work
4. **Merge**: Update documentation with code changes

### Version Control

- Keep documentation in the same repository as code
- Update documentation in the same commit/PR as code changes
- Tag documentation versions with release versions

## 📊 Diagrams

### Tools for Diagrams

Recommended tools:
- **ERD**: dbdiagram.io, draw.io, Lucidchart
- **Flowcharts**: draw.io, Lucidchart, Mermaid
- **Architecture**: draw.io, Lucidchart
- **Wireframes**: Figma, Adobe XD

### Diagram Standards

- Save source files in the appropriate diagram folder
- Export to PNG or SVG for inclusion in markdown
- Include a legend if needed
- Keep diagrams simple and focused

### Embedding Diagrams

```markdown
![Diagram Title](./diagram/erd/user-management.png)
```

## 🎨 Formatting Guidelines

### Emphasis
- Use **bold** for important terms and UI elements
- Use *italics* for emphasis
- Use `code` for code elements, file names, commands

### Tables
Use tables for structured data:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

### Admonitions

Use blockquotes with emoji for important notes:

```markdown
> ⚠️ **Warning**: This action cannot be undone.

> 💡 **Tip**: Use keyboard shortcuts for faster navigation.

> ℹ️ **Note**: This feature requires admin privileges.

> ✅ **Success**: Installation completed successfully.
```

## 📚 Resources

### Markdown References
- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### Documentation Best Practices
- [Write the Docs](https://www.writethedocs.org/)
- [Google Developer Documentation Style Guide](https://developers.google.com/style)

## ✅ Documentation Checklist

Before finalizing documentation:

- [ ] All sections are complete
- [ ] Code examples are tested and working
- [ ] Links are valid and point to correct locations
- [ ] Spelling and grammar are correct
- [ ] Formatting is consistent
- [ ] Screenshots/diagrams are up-to-date
- [ ] Version information is included
- [ ] Related documents are cross-referenced

## 🤝 Contributing to Documentation

Everyone is encouraged to contribute to documentation:

1. Found an error? Fix it!
2. Something unclear? Clarify it!
3. Missing information? Add it!
4. Better example? Include it!

Small improvements make a big difference.

## 📞 Questions?

If you have questions about documentation standards or need help:
- Review existing documentation for examples
- Ask the team during code reviews
- Suggest improvements to this guide

---

*Remember: Good documentation is as important as good code!*

