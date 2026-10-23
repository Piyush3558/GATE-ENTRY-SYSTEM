# \# Visitor Gate Entry System

# 

# A web-based Visitor Gate Entry System developed to manage visitor registration, employee approval, entry/exit tracking, and visitor records in a structured digital process.

# 

# \## Overview

# 

# The application helps security personnel register visitors and send visit requests to the concerned employee. The employee can approve or reject the visitor request, while security can manage visitor entry and exit information.

# 

# The project was developed as part of my Software Development Internship at UFI Filters.

# 

# \## Tech Stack

# 

# \*\*Frontend\*\*

# \- React.js

# \- Vite

# \- HTML

# \- CSS

# \- Axios

# 

# \*\*Backend\*\*

# \- Node.js

# \- Express.js

# \- REST APIs

# 

# \*\*Database\*\*

# \- PostgreSQL

# 

# \*\*Other Tools\*\*

# \- Git

# \- GitHub

# \- VS Code

# \- Multer for photo uploads

# 

# \## Main Features

# 

# \### Security / Gate Entry

# \- Register new visitors

# \- Enter visitor contact and visit details

# \- Select department and employee to visit

# \- Capture or upload visitor photo

# \- Record visitor entry time

# \- Track visitor approval status

# \- Record visitor checkout / exit time

# 

# \### Employee Approval

# \- Employee login

# \- View visitor requests

# \- Approve visitor requests

# \- Reject visitor requests

# \- Store approval status and approval time

# \- Record rejection reason when required

# 

# \### Visitor Management

# \- Maintain visitor records

# \- Track entry and exit details

# \- Connect visitors with the concerned employee

# \- Store visitor photo information

# \- Maintain approval history

# 

# \## Application Flow

# 

# ```text

# Visitor Arrives

# &#x20;     |

# &#x20;     v

# Security Registers Visitor

# &#x20;     |

# &#x20;     v

# Visitor Details + Photo Captured

# &#x20;     |

# &#x20;     v

# Employee / Official Selected

# &#x20;     |

# &#x20;     v

# Approval Request Created

# &#x20;     |

# &#x20;     v

# Employee Reviews Request

# &#x20;     |

# &#x20;     +-------------------+

# &#x20;     |                   |

# &#x20;     v                   v

# &#x20;  APPROVED            REJECTED

# &#x20;     |                   |

# &#x20;     v                   v

# Visitor Entry        Entry Not Allowed

# &#x20;     |

# &#x20;     v

# Visitor Meets Employee

# &#x20;     |

# &#x20;     v

# Security Records Exit

# ```

# 

# \## Project Structure

# 

# ```text

# gate-entry-system/

# |

# |-- backend/

# |   |-- routes/

# |   |-- uploads/

# |   |-- server.js

# |   |-- package.json

# |   `-- .env

# |

# |-- frontend/

# |   |-- src/

# |   |   |-- components/

# |   |   `-- pages/

# |   |

# |   |-- package.json

# |   `-- vite.config.js

# |

# |-- .gitignore

# `-- README.md

# ```

# 

# > Environment files, database credentials, visitor photos, and other sensitive data are excluded from the GitHub repository.

# 

# \## Backend Functions

# 

# The backend is developed using Node.js and Express.js.

# 

# Some of the main operations include:

# 

# ```text

# Create Visitor

# View Visitors

# View Visitor Details

# Employee Approval

# Employee Rejection

# Visitor Checkout

# Fetch Departments

# Fetch Employees by Department

# ```

# 

# The frontend communicates with the backend using REST APIs.

# 

# \## Database

# 

# PostgreSQL is used to store and manage application information.

# 

# Main data handled by the system includes:

# 

# ```text

# Visitors

# Employees

# Departments

# Visit Information

# Approval Status

# Entry Time

# Exit Time

# Visitor Photo Path

# ```

# 

# \## Key Learning

# 

# Through this project, I gained practical experience in:

# 

# \- React.js frontend development

# \- Node.js and Express.js backend development

# \- REST API creation and integration

# \- PostgreSQL database operations

# \- Frontend and backend integration

# \- File and photo upload handling

# \- Approval workflow development

# \- Debugging and API testing

# \- Git and GitHub version control

# 

# \## Screenshots

# 

# Application screenshots can be added here to demonstrate the user interface and workflow.

# 

# Example:

# 

# ```text

# Login Screen

# Visitor Registration Screen

# Visitor List

# Employee Approval Screen

# Visitor Details

# Check-In / Check-Out Screen

# ```

# 

# \## Author

# 

# \*\*Kashish Verma\*\*

# 

# Software Development Intern  

# MCA Student  

# Diploma in Data Science — IIT Madras

# 

# GitHub: \[kashishverma0902-cmyk](https://github.com/kashishverma0902-cmyk)

# 

# LinkedIn: \[Kashish Verma](https://www.linkedin.com/in/kashish-verma0902/)

