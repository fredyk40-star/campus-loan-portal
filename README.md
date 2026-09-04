# Campus Student Loan Portal

A transparent student funding and tracking platform built with Node.js serverless functions for Vercel deployment.

## Features

- **Landing Page** - Welcome page with navigation to dashboard and calculator
- **Repayment Calculator** - Calculate monthly payments using standard amortization formula
- **Student Dashboard** - Submit and track loan applications
- **Database Integration** - MySQL/TiDB Cloud for data persistence

## Deployment to Vercel

### Prerequisites

1. [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/cli) (optional, for local development)

### Environment Variables

Set these in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `MYSQL_HOST` | Database host (e.g., gateway01.eu-central-1.prod.aws.tidbcloud.com) |
| `MYSQL_PORT` | Database port (default: 4000) |
| `MYSQL_NAME` | Database name |
| `MYSQL_USER` | Database username |
| `MYSQL_PASS` | Database password |
| `MYSQL_SSL` | Set to `1` for SSL connections |

### Deploy

**Option 1: Deploy via Vercel Dashboard**
1. Push this code to a GitHub repository
2. Import the repository in Vercel
3. Add environment variables in Project Settings
4. Deploy

**Option 2: Deploy via Vercel CLI**
```bash
# Install dependencies
npm install

# Deploy to Vercel
vercel

# For production deployment
vercel --prod
```

## Project Structure

```
campus-loan-portal/
├── api/
│   ├── index.js          # Landing page
│   ├── calculator.js     # Loan repayment calculator
│   ├── dashboard.js      # Student dashboard
│   └── applications.js   # Loan applications API
├── package.json          # Node.js dependencies
├── vercel.json           # Vercel configuration
└── .env                  # Environment variables (local only)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/index` | GET | Landing page |
| `/api/calculator` | GET/POST | Calculator page and calculation |
| `/api/dashboard` | GET | Dashboard page with recent applications |
| `/api/applications` | GET | Get recent loan applications (JSON) |
| `/api/applications` | POST | Submit new loan application |

## Tech Stack

- **Runtime**: Node.js Serverless Functions
- **Database**: TiDB Cloud (MySQL-compatible)
- **CSS**: Tailwind CSS (CDN)
- **Platform**: Vercel