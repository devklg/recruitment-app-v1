# Talk Fusion Recruitment App - Project Checklist

## Overview
This document provides a comprehensive overview of all files in the Talk Fusion recruitment app, their purposes, and how they interact to create a fully functional MERN stack application.

## Project Structure

```
talk-fusion-app/ # Frontend React application
├── public/       # Static assets
└── src/          # Source code
    ├── assets/     # Images and other assets
    ├── components/ # React components
    ├── contexts/   # Context providers
    ├── hooks/      # Custom React hooks
    ├── pages/      # Page components
    ├── services/   # API service functions
    └── utils/      # Utility functions

server/             # Backend Node.js application
├── config/       # Configuration files
├── controllers/  # Request handlers
├── middleware/   # Express middleware
├── models/       # MongoDB schemas
├── routes/       # API routes
├── services/   # Business logic
└── utils/      # Utility functions
```

## Frontend Files

### Configuration Files
| File | Purpose |
|---|---|
| `vite.config.js` | Configures Vite bundler and development server |
| `tailwind.config.js` | Tailwind CSS configuration with custom colors |
| `index.html` | Entry HTML file for the React application |
| `package.json` | Defines dependencies and scripts |

### Main Application Files
| File | Purpose |
|---|---|
| `src/main.jsx` | Application entry point that sets up React and providers |
| `src/App.jsx` | Main component with routing configuration |
| `src/index.css` | Global styles and Tailwind imports |

### Context Providers
| File | Purpose |
|---|---|
| `src/contexts/AuthContext.jsx` | Manages user authentication state |
| `src/contexts/TeamContext.jsx` | Manages team and pre-enrollment data |

### Custom Hooks
| File | Purpose |
|---|---|
| `src/hooks/useAuth.js` | Hook for accessing authentication context |
| `src/hooks/useTeam.js` | Hook for accessing team context |

### API Services
| File | Purpose |
|---|---|
| `src/services/api.js` | Configures Axios for API requests |
| `src/services/auth.js` | Authentication API functions |
| `src/services/team.js` | Team and pre-enrollment API functions |
| `src/services/admin.js` | Admin-specific API functions |
| `src/services/user.js` | User profile API functions |

### Utility Functions
| File | Purpose |
|---|---|
| `src/utils/constants.js` | Application constants |
| `src/utils/formatters.js` | Data formatting functions |
| `src/utils/validators.js` | Form validation functions |

### Page Components
| File | Purpose |
|---|---|
| `src/pages/LandingPage.jsx` | Marketing landing page |
| `src/pages/LoginPage.jsx` | User login page |
| `src/pages/PreEnrollmentPage.jsx` | Pre-enrollment registration form |
| `src/pages/PreEnrolleeDashboard.jsx` | Dashboard for pre-enrolled users |
| `src/pages/PromoterDashboard.jsx` | Dashboard for active promoters |
| `src/pages/AdminDashboard.jsx` | Admin control panel |

### Layout Components
| File | Purpose |
|---|---|
| `src/components/layout/Header.jsx` | Site header with navigation |
| `src/components/layout/Footer.jsx` | Site footer |
| `src/components/layout/Sidebar.jsx` | Dashboard sidebar navigation |
| `src/components/layout/DashboardLayout.jsx` | Layout wrapper for dashboards |

### Common Components
| File | Purpose |
|---|---|
| `src/components/common/Button.jsx` | Reusable button component |
| `src/components/common/Card.jsx` | Content container component |
| `src/components/common/CountdownTimer.jsx` | Countdown timer display |
| `src/components/common/Notification.jsx` | Toast notification component |
| `src/components/common/StatCard.jsx` | Statistics display card |

### Dashboard Components
| File | Purpose |
|---|---|
| `src/components/dashboard/ActivityFeed.jsx` | Real-time activity feed |
| `src/components/dashboard/FinancialSummary.jsx` | Financial data summary |
| `src/components/dashboard/PreEnrolleeCountdown.jsx` | Pre-enrollment countdown |
| `src/components/dashboard/TeamGrowthVisualization.jsx` | Team structure visualization |
| `src/components/dashboard/UserProfile.jsx` | User profile display |
| `src/components/dashboard/ReplicatedSiteSettings.jsx` | Replicated site configuration |

### Admin Components
| File | Purpose |
|---|---|
| `src/components/admin/UserDetail.jsx` | User details for admin |
| `src/components/admin/UserSponsorEdit.jsx` | Sponsor/enroller editing |
| `src/components/admin/PrintableUserList.jsx` | Printable user list |

## Backend Files

### Configuration Files
| File | Purpose |
|---|---|
| `server/package.json` | Backend dependencies and scripts |
| `server/.env` | Environment variables |
| `server/config/db.js` | Database connection configuration |

### Main Application Files
| File | Purpose |
|---|---|
| `server/server.js` | Express application setup and entry point |

### Middleware
| File | Purpose |
|---|---|
| `server/middleware/auth.js` | JWT authentication middleware |
| `server/middleware/error.js` | Global error handler |
| `server/middleware/async.js` | Async handler wrapper |

### Models
| File | Purpose |
|---|---|
| `server/models/User.js` | User data schema |
| `server/models/TeamStructure.js` | Binary team structure schema |
| `server/models/PreEnrollment.js` | Pre-enrollment queue schema |

### Controllers
| File | Purpose |
|---|---|
| `server/controllers/authController.js` | Authentication handlers |
| `server/controllers/preEnrollmentController.js` | Pre-enrollment handlers |
| `server/controllers/teamController.js` | Team management handlers |
| `server/controllers/adminController.js` | Admin functionality handlers |
| `server/controllers/userController.js` | User profile handlers |

### Routes
| File | Purpose |
|---|---|
| `server/routes/auth.js` | Authentication routes |
| `server/routes/preEnrollment.js` | Pre-enrollment routes |
| `server/routes/team.js` | Team management routes |
| `server/routes/admin.js` | Admin routes |
| `server/routes/users.js` | User profile routes |

### Services
| File | Purpose |
|---|---|
| `server/services/placement.js` | Team placement algorithms |

### Utilities
| File | Purpose |
|---|---|
| `server/utils/errorResponse.js` | Custom error response class |
| `server/utils/constants.js` | Backend constants |

## Interaction Flow

1. **User Registration Process**:
   - User enters details on `PreEnrollmentPage`
   - Form submits to `/api/pre-enrollment` endpoint
   - `preEnrollmentController.js` creates user and pre-enrollment records
   - User is redirected to `PreEnrolleeDashboard`

2. **User Activation Process**:
   - Pre-enrollee upgrades via `PreEnrolleeDashboard`
   - Request sent to `/api/pre-enrollment/activate/:userId`
   - User is placed in team structure using `placement.js` algorithms
   - User becomes a promoter and gets redirected to `PromoterDashboard`

3. **Team Building Visualization**:
   - `TeamContext` provides team data to components
   - `TeamGrowthVisualization` shows binary structure
   - `ActivityFeed` displays real-time team activity

4. **Administrative Functions**:
   - Admin logs in and accesses `AdminDashboard`
   - Can view, edit, and print user data
   - Can change user sponsors/enrollers
   - Can manage system settings

## Deployment Requirements

### Frontend (Hostinger)
- Node.js environment
- Build command: `npm run build`
- Output directory: `dist`
- Domain configuration: `www.getpaidin1minute.com`

### Backend (Hostinger)
- Node.js environment
- MongoDB database setup
- Environment variables configuration
- Process manager (PM2 recommended)

## Development Commands

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Backend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production server
npm start
```

## Database Collections
- Users Collection: All user accounts
- TeamStructure Collection: Binary tree structure
- PreEnrollment Collection: Pre-enrollment queue

## Key Features Implemented
- User authentication and authorization
- Pre-enrollment system with expiry
- Binary team structure visualization
- Real-time activity simulations
- Admin management dashboard
- Sponsor/enroller editing
- Printable reports
- Customizable replicated sites
