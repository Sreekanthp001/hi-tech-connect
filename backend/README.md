# Hi-Tech Connect Backend

Production-ready Express.js backend for Hi-Tech Connect.

## Tech Stack

- **Express.js**: Web framework
- **Prisma**: Next-generation ORM
- **PostgreSQL**: Relational database
- **JWT**: Secure authentication
- **bcrypt**: Password hashing
- **Helmet**: Security headers
- **Morgan**: Request logging

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and update values.
   ```bash
   cp .env.example .env
   ```

4. Initialize Prisma:
   ```bash
   npx prisma generate
   ```

### Development

Run the server with nodemon:
```bash
npm run dev
```

The server will start at `http://localhost:5000`.

## API Routes

- `GET /api/health`: Check server status
- `POST /api/auth/register`: Register new user (Placeholder)
- `POST /api/auth/login`: User login (Placeholder)
