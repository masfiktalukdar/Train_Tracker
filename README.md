# 🚆 Train Nojor

> A real-time train tracking system for Bangladesh Railway with predictive ETAs and comprehensive administrative controls.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 📋 Overview

Train Nojor is a full-stack monorepo application designed to provide real-time operational visibility for Bangladesh Railway passengers. The system eliminates schedule uncertainty through live tracking, intelligent arrival predictions, and comprehensive station status monitoring.

### Problem Statement

Railway passengers frequently face uncertainty about train locations and accurate arrival times, leading to unnecessary wait times and missed connections. Traditional static schedules fail to account for real-world operational variances.

### Solution

Train Nojor bridges this gap by providing:
- **Real-time location tracking** with visual progress indicators
- **Predictive ETA calculations** based on 7-day historical journey patterns
- **Station-centric views** displaying current platform occupancy and incoming trains
- **Administrative control panel** for live journey management and system configuration

---

## ✨ Features

### Public Application (React)

#### Core Functionality
- **Live Train Tracking**: Real-time train position visualization with progress bars and departure countdowns
- **Intelligent ETA Prediction**: Machine learning-inspired arrival time estimation using 7-day historical performance data (`useTrainPrediction.ts`)
- **Station Status Dashboard**: Real-time view of trains currently on platform and approaching arrivals
- **Route-based Search**: Intuitive train discovery by selecting origin-destination pairs
- **User Feedback System**: Built-in contact mechanism for bug reports and feature requests

#### User Experience
- First-time user onboarding flow
- Personalized user dashboard
- Secure authentication and authorization
- Responsive mobile-first design

### Administrative Control Panel (React)

#### Management Console
- **Analytics Dashboard**: Comprehensive metrics including user growth charts (Recharts), system entity counts, and operational statistics
- **Visual Route Builder**: Drag-and-drop interface (`adminWhiteboardBuilder.tsx`) for intuitive route topology design
- **Entity Management (CRUD)**: Full administrative control over:
  - Stations (station name, locations, metadata)
  - Routes (station sequences)
  - Trains (train info, schedules, routes, current and future stations)
  
#### Live Operations Control
- **Journey Management Interface**: Real-time train operation controls (`adminTrainJourneyModal.tsx`)
- **Station Event Logging**: Arrival/Departure timestamp recording that propagates to public user interface
- **Feedback Management**: Centralized inbox for user submissions with filtering and status tracking

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth + JWT (role-based access control)
- **API Architecture**: RESTful with separate public/admin route namespaces
- **Middleware**: CORS, custom JWT validation (`adminAuth.ts`)

### Frontend
- **Framework**: React 19 with Vite
- **Language**: TypeScript (strict mode)
- **Routing**: React Router v7
- **State Management**:
  - Server State: TanStack Query v5 (data fetching, caching, synchronization)
  - Client State: Zustand (authentication, UI state)
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts
- **HTTP Client**: Axios
- **Icons**: lucide-react

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication Provider**: Supabase Auth
- **API Layer**: Express.js REST API

---

## 🏗️ Architecture

### Application Flow

#### Public User Journey
```
Registration/Login → Onboarding → Homepage
                                    ├─→ Train Search → Route Selection → Train Status (Live Tracking + ETA)
                                    └─→ Station Search → Station Selection → Platform Status (On Platform + Arriving)
```

#### Administrative Workflow
```
Admin Login → Dashboard
              ├─→ Stations Management (CRUD)
              ├─→ Routes Management (Visual Builder)
              ├─→ Trains Management (CRUD)
              ├─→ Live Operations (Arrival/Departure Control)
              └─→ Feedback Management (Inbox)
```

### Data Flow
1. **Admin marks arrival/departure** → Backend API receives event
2. **Backend updates `daily_status` table** → PostgreSQL persists state change
3. **Public clients poll `/api/public/status/:trainId`** → Receive updated position
4. **React Query cache invalidation** → UI re-renders with new data
5. **Prediction engine runs** → `useTrainPrediction.ts` calculates ETA from 7-day history

---

## ⚡ Performance & Scalability

### Current Capacity
The application is architected for demonstration and portfolio purposes with the following characteristics:

**Concurrent Users**: ~50-100 simultaneous users  
**Polling Frequency**: 10-second intervals  
**Database**: Supabase free tier connection limits  
**Server**: Single Node.js process  

### Bottlenecks
1. **Monolithic Express Server**: Single-threaded execution limits request throughput
2. **Polling Architecture**: Frequent status checks create N×requests/second load
3. **Database Connection Pool**: Free tier limitations on concurrent connections

### Production Scaling Strategy

To support production-grade traffic (1,000+ concurrent users):

#### Infrastructure Upgrades
- **Serverless Migration**: Decompose monolith into Vercel/Netlify Functions for auto-scaling
- **Database Tier**: Upgrade to Supabase Pro for increased connection limits and performance
- **CDN Integration**: Static asset delivery via Cloudflare/Vercel Edge Network

#### Architectural Improvements
- **WebSocket Implementation**: Replace polling with bidirectional real-time connections (Socket.io/Supabase Realtime)
- **Redis Caching Layer**: Cache frequently accessed data (train schedules, station lists) with 5-minute TTL
- **Read Replicas**: Distribute read operations across PostgreSQL replicas
- **Rate Limiting**: Implement token bucket algorithm for API endpoint protection

#### Monitoring & Observability
- Application Performance Monitoring (APM) via Sentry/Datadog
- Database query performance tracking
- Real-time alerting for error rate spikes

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: npm or yarn
- **Supabase Account**: [Create free account](https://supabase.com)

### 1. Database Setup

#### Create Supabase Project
1. Navigate to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Navigate to **SQL Editor**

#### Execute Schema Migrations

```sql
-- Stations table
CREATE TABLE stations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  station_id UUID DEFAULT gen_random_uuid() NOT NULL,
  station_name TEXT NOT NULL,
  station_location TEXT,
  station_location_url TEXT,
  CONSTRAINT stations_station_id_key UNIQUE (station_id)
);

-- Routes table
CREATE TABLE routes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  stations JSONB DEFAULT '[]'::jsonb
);

-- Trains table
CREATE TABLE trains (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  direction TEXT NOT NULL,
  route_id BIGINT REFERENCES routes(id) ON DELETE SET NULL,
  stoppages JSONB DEFAULT '[]'::jsonb
);

-- Daily operational status
CREATE TABLE daily_status (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id BIGINT REFERENCES trains(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  lap_completed BOOLEAN DEFAULT false,
  arrivals JSONB DEFAULT '[]'::jsonb,
  departures JSONB DEFAULT '[]'::jsonb,
  last_completed_station_id UUID,
  CONSTRAINT daily_status_train_id_date_key UNIQUE (train_id, date)
);

-- User feedback
CREATE TABLE feedback (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT NOT NULL,
  reason TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new'::text NOT NULL
);

-- User profiles with role-based access control
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user'::text NOT NULL
);
```

#### Configure Authentication Trigger

Navigate to **Authentication → Triggers** and create:

- **Trigger Name**: `on_auth_user_created`
- **Event**: User Signed Up
- **Schema**: public
- **Table**: profiles
- **Operation**: INSERT
- **Column Mappings**:
  - `id` → User ID
  - `email` → Email

#### Retrieve API Credentials

Navigate to **Project Settings → API**:
- Copy `Project URL`
- Copy `service_role` key (secret key)

### 2. Backend Configuration

```bash
cd Backend
npm install
```

Create `.env` file:

```env
# Server configuration
PORT=3000

# Supabase credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# JWT secret (generate using: openssl rand -base64 32)
JWT_SECRET=your-cryptographically-secure-random-string
```

Start development server:

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:3000
Database connected successfully
```

### 3. Frontend Configuration

```bash
cd Frontend
npm install
```

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Start development server:

```bash
npm run dev
```

Application available at: `http://localhost:5173`

---

## 📱 Usage Guide

### Public User Workflow

1. **Account Creation**: Register via `/register` endpoint
2. **Authentication**: Login to access personalized dashboard
3. **Onboarding**: Complete first-time user tutorial
4. **Train Tracking**:
   - Select "Trains" from homepage
   - Choose route (e.g., Dhaka → Chattogram)
   - Select specific train
   - View live position, progress bar, and predictive ETAs
5. **Station Monitoring**:
   - Select "Stations" from homepage
   - Choose station
   - View trains currently on platform and approaching arrivals

### Administrator Workflow

#### Initial Setup

##### 1. Create Admin Account

Navigate to Supabase Dashboard → **Authentication → Users**:
- Add new user with email/password
- Navigate to **Table Editor → profiles**
- Locate created user row
- Update `role` column from `user` to `admin`

##### 2. System Configuration

Login at: `http://localhost:5173/admin/login`

**Configure Stations**:
```
Admin Panel → Stations → Add Station
- Name: Dhaka
- Location: Dhaka Division
- Coordinates URL: Google Maps link
```

**Build Routes**:
```
Admin Panel → Routes → Create Route → Visual Builder
- Drag stations to canvas
- Connect stations in sequence
- Save route topology
```

**Register Trains**:
```
Admin Panel → Trains → Add Train
- Name: Subarna Express
- Code: 701
- Direction: Up/Down
- Assign Route: Dhaka-Chattogram
- Configure stoppages with scheduled times
```

#### Daily Operations

**Manage Live Journeys**:
```
Admin Panel → Trains → [Select Train] → View Journey

For each station:
1. Click "Arrive" when train reaches platform
2. Click "Depart" when train leaves station

Changes propagate to public user interface in real-time
```

**Review Feedback**:
```
Admin Panel → Feedback
- Filter by status (new/read/archived)
- Review user submissions
- Update status accordingly
```

---

## 🔌 API Reference

### Authentication Endpoints

#### `POST /api/auth/register`
Create new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**: `201 Created`
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "token": "jwt-token"
}
```

#### `POST /api/auth/login`
Authenticate user/admin

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**: `200 OK`
```json
{
  "user": { "id": "uuid", "email": "user@example.com", "role": "user" },
  "token": "jwt-token"
}
```

### Public Endpoints

#### `GET /api/public/stations`
Retrieve all stations

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "station_id": "uuid",
    "station_name": "Dhaka",
    "station_location": "Dhaka Division",
    "station_location_url": "https://maps.google.com/..."
  }
]
```

#### `GET /api/public/trains`
Retrieve all trains

#### `GET /api/public/status/:trainId`
Get real-time train status

**Response**: `200 OK`
```json
{
  "train": { "id": 1, "name": "Subarna Express", "code": "701" },
  "status": {
    "currentStation": "uuid",
    "lastArrival": "2025-11-13T10:30:00Z",
    "lastDeparture": "2025-11-13T10:35:00Z",
    "progress": 45.5
  }
}
```

#### `GET /api/public/history/:trainId`
Retrieve 7-day journey history for ETA predictions

#### `POST /api/public/feedback`
Submit user feedback

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "reason": "bug",
  "message": "Feedback message"
}
```

### Admin Endpoints (Requires JWT Authorization)

#### `GET /api/admin/dashboard/stats`
Retrieve dashboard analytics

**Headers**: `Authorization: Bearer {jwt-token}`

**Response**: `200 OK`
```json
{
  "totalUsers": 150,
  "totalStations": 25,
  "totalRoutes": 8,
  "totalTrains": 42,
  "userGrowth": [...]
}
```

#### `POST /api/admin/status/update`
Record train arrival/departure event

**Request Body**:
```json
{
  "trainId": 1,
  "stationId": "uuid",
  "eventType": "arrival",
  "timestamp": "2025-11-13T10:30:00Z"
}
```

#### Station Management
- `POST /api/admin/stations` - Create station
- `PUT /api/admin/stations/:id` - Update station
- `DELETE /api/admin/stations/:id` - Delete station

#### Route Management
- `POST /api/admin/routes` - Create route
- `PUT /api/admin/routes/:id` - Update route
- `DELETE /api/admin/routes/:id` - Delete route

#### Train Management
- `POST /api/admin/trains` - Create train
- `PUT /api/admin/trains/:id` - Update train
- `DELETE /api/admin/trains/:id` - Delete train

#### Feedback Management
- `GET /api/admin/feedback` - List all feedback
- `PATCH /api/admin/feedback/:id/status` - Update feedback status

---

## 🧪 Development

### Project Structure

```
train-tracker/
├── Backend/
│   ├── src/
│   │   ├── config/           # DB Management
│   │   ├── middleware/       # Auth, CORS, validation
│   │   ├── routes/           # API route definitions
│   │   └── server.ts   
│   ├── .env
│   ├── package.lock.json
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/
│   ├── src/
│   │   ├── assets/           # Static assets (images, fonts)
│   │   ├── components/       # Reusable React components
│   │   ├── features/         # Feature-based modules
│   │   │   ├── admin/
│   │   │   │   ├── api/      # Admin API calls
│   │   │   │   ├── components/
│   │   │   │   └── pages/    # Admin pages
│   │   │   ├── auth/
│   │   │   │   └── api/      # Auth API (authApi.ts)
│   │   │   └── user/
│   │   │       ├── api/      # User API calls
│   │   │       ├── components/
│   │   │       ├── hooks/    # Custom hooks (useTrainPrediction)
│   │   │       ├── pages/    # User pages
│   │   │       └── utils/    # User-specific utilities
│   │   ├── hooks/            # Shared hooks
│   │   ├── lib/              # Third-party library configs
│   │   ├── pages/            # Top-level route pages
│   │   ├── store/            # Zustand stores
│   │   ├── styles/           # Global styles
│   │   ├── types/            # TypeScript type definitions
│   │   ├── App.tsx           # Root component
│   │   ├── main.tsx          # Application entry point
│   │   └── .gitignore
│   ├── .env
│   └── package.json
│
└── README.md
```

### Code Style

This project follows strict TypeScript configurations and React best practices:
- ESLint for code linting
- Prettier for code formatting
- Conventional Commits for version control

### Testing (Future Implementation)

Planned testing infrastructure:
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Playwright for critical user flows

---

## 🤝 Contributing

This is a portfolio project designed to demonstrate full-stack development capabilities. The codebase is not open for contributions or distribution.

For inquiries, please contact the repository owner.

---

## 📄 License

**Proprietary - All Rights Reserved**

This project is a portfolio demonstration piece. The source code, documentation, and all associated materials are the exclusive property of the author.

**Restrictions**:
- ❌ No copying, modification, or distribution
- ❌ No commercial use
- ❌ No derivative works
- ✅ Viewing for educational/portfolio review purposes only

---

## 🎯 Project Goals

This application was built to demonstrate:
- **Full-stack development** expertise across modern web technologies
- **Real-time systems** architecture and implementation
- **Complex state management** with multiple data sources
- **Production-ready code** with proper error handling and validation
- **Scalable architecture** design with clear upgrade paths
- **User-centric design** for both public and administrative interfaces

---

## 📞 Contact

For questions about this project or collaboration opportunities:

**LinkedIn**: [Masfik Talukdar](https://www.linkedin.com/in/masfik-talukdar/)  
**Email**: masfik.dev@gmail.com

---

<div align="center">

**Built with ❤️ by Masfik Talukdar**

*Showcasing modern full-stack development practices*

</div>