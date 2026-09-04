# Campus Student Loan Portal

A transparent student funding and tracking platform built with Node.js serverless functions for Vercel deployment. Features authentication, repayment schedules, file uploads, and notifications.

## Features

### Core Features
- **Landing Page** - Welcome page with navigation
- **Repayment Calculator** - Calculate monthly payments using amortization formula
- **Student Dashboard** - Submit and track loan applications
- **Database Integration** - TiDB Cloud (MySQL-compatible) with SSL

### New Features (v2.0)
- **User Authentication** - Secure login/register with bcrypt password hashing and JWT tokens
- **Role-Based Access** - Student and Admin roles with different permissions
- **Repayment Schedules** - Automatic month-by-month breakdown of approved loans
- **File Uploads** - Attach supporting documents (PDF, JPG, PNG) to applications
- **Notifications** - In-app notifications for status changes with email support
- **Admin Panel** - Manage all applications, approve/reject, generate schedules

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js Serverless Functions (@vercel/node) |
| Database | TiDB Cloud (MySQL-compatible) with SSL |
| Authentication | bcryptjs + JWT (jsonwebtoken) |
| File Storage | Vercel Blob |
| Email | Gmail SMTP (Nodemailer) |
| CSS | Tailwind CSS (CDN) |
| Platform | Vercel |

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Vercel account](https://vercel.com/signup)
- [TiDB Cloud](https://tidb.cloud/) database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/fredyk40-star/campus-loan-portal.git
cd campus-loan-portal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see below)

4. Run database migration:
```bash
mysql --host=<host> --port=4000 --user=<user> -p <database> < migration.sql
```

5. Generate admin password hash:
```bash
node scripts/generate-admin.js yourpassword
```

## Environment Variables

Create a `.env` file locally or set in Vercel Project Settings:

```env
# Database Configuration
MYSQL_HOST=gateway01.eu-central-1.prod.aws.tidbcloud.com
MYSQL_PORT=4000
MYSQL_NAME=campus_loan
MYSQL_USER=your_username
MYSQL_PASS=your_password
MYSQL_SSL=1

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=your_blob_token

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
RESEND_FROM_EMAIL=your-email@gmail.com
```

### Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Google account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the App Password as `SMTP_PASSWORD`

## Project Structure

```
campus-loan-portal/
├── api/
│   ├── index.js              # Landing page
│   ├── calculator.js         # Loan repayment calculator
│   ├── dashboard.js          # Student dashboard (auth required)
│   ├── applications.js       # Applications API (auth required)
│   ├── upload.js             # File upload endpoint
│   ├── auth/
│   │   ├── register.js       # POST: Create account
│   │   ├── login.js          # POST: Login
│   │   ├── logout.js         # POST: Logout
│   │   ├── me.js             # GET: Current user
│   │   ├── login-page.js     # Login page HTML
│   │   └── register-page.js  # Register page HTML
│   ├── admin/
│   │   ├── index.js          # Admin dashboard page
│   │   └── applications.js   # Admin: manage applications
│   ├── repayments/
│   │   ├── index.js          # API: get repayment schedule
│   │   └── page.js           # Repayment schedule view page
│   └── notifications/
│       ├── index.js          # API: get notifications
│       ├── mark-read.js      # POST: mark as read
│       └── page.js           # Notifications page
├── lib/
│   ├── db.js                 # Database connection helper
│   ├── auth.js               # JWT & authentication helpers
│   ├── repayments.js         # Amortization calculations
│   └── notifications.js      # Notification helpers with Gmail SMTP
├── scripts/
│   └── generate-admin.js     # Generate admin password hash
├── migration.sql             # Database schema migration
├── vercel.json               # Vercel configuration
└── package.json              # Dependencies
```

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/index` | Landing page |
| GET | `/api/calculator` | Calculator page |
| POST | `/api/calculator` | Calculate repayment |
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/login-page` | Login page HTML |
| GET | `/api/auth/register-page` | Register page HTML |

### Authenticated Endpoints (Student)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/dashboard` | Student dashboard |
| GET | `/api/applications` | Get own applications |
| POST | `/api/applications` | Submit new application |
| POST | `/api/upload` | Upload file |
| GET | `/api/repayments?loan_id=X` | Get repayment schedule |
| GET | `/api/notifications` | Get notifications |
| POST | `/api/notifications/mark-read` | Mark notifications as read |

### Admin Endpoints (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin` | Admin dashboard |
| GET | `/api/admin/applications` | List all applications |
| PUT | `/api/admin/applications` | Update application status |

## Authentication Flow

1. **Register**: Student creates account → Account linked to student record
2. **Login**: Student logs in → JWT token stored in httpOnly cookie
3. **Access**: Protected routes verify JWT → Allow or deny access
4. **Role Check**: Admin routes verify `role === \'admin\'`

### Roles
| Role | Access |
|------|--------|
| `student` | Own applications, dashboard, notifications |
| `admin` | All applications, approve/reject, generate schedules |

## Repayment Schedule Generation

When an admin approves a loan:
1. Admin provides interest rate and repayment duration
2. System calculates monthly breakdown (principal, interest, remaining balance)
3. Each installment stored in `repayment_schedules` table
4. Student can view their full schedule

## Notification System

Notifications are created automatically when:
- Loan application status changes
- Payment becomes due (future feature)

Students receive:
- In-app notifications in dashboard
- Email notifications via Gmail SMTP

### Email Configuration

The system uses Gmail SMTP for sending emails:
- Status change notifications
- Payment reminders (future)
- Welcome emails (future)

## Deployment to Vercel

### Option 1: Vercel CLI
```bash
vercel login
vercel
vercel --prod
```

### Option 2: GitHub Integration
1. Push code to GitHub
2. Import repository in Vercel Dashboard
3. Add environment variables in Project Settings
4. Deploy

### Database Setup
```bash
mysql --host=<host> --port=4000 --user=<user> -p <database> < migration.sql
```

## Demo Accounts

After running migration:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campusloan.com | admin123 |

Students can register at `/register`.

## License

MIT License
