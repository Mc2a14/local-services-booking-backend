# Local Services Booking Backend

A production-ready backend API for a local services booking platform with AI-powered customer service.

## Features

- ✅ User Authentication (JWT)
- ✅ Provider & Customer Management
- ✅ Service Management (CRUD)
- ✅ Booking System
- ✅ AI Customer Service (OpenAI Integration)
- ✅ Business Info Management
- ✅ Clean Architecture (Routes → Controllers → Services → DB)

## Tech Stack

- Node.js + Express
- PostgreSQL
- JWT Authentication
- OpenAI API
- Railway Deployment Ready

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=sk-your-openai-key-here
PORT=3000
NODE_ENV=development
RUN_MIGRATIONS=false
```

### 3. Run Database Migrations

```bash
RUN_MIGRATIONS=true npm start
```

Or set `RUN_MIGRATIONS=true` in `.env` file.

### 4. Start Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server runs on `http://localhost:3000`

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing instructions.

## Project Structure

```
src/
├── app.js              # Express app setup
├── server.js           # Server startup
├── config/             # Configuration
│   ├── index.js        # Config exports
│   └── database.js     # DB connection
├── db/                 # Database layer
│   ├── index.js        # Query helpers
│   └── schema.sql      # Database schema
├── routes/             # API routes
│   ├── auth.js
│   ├── providers.js
│   ├── services.js
│   ├── bookings.js
│   ├── businessInfo.js
│   └── ai.js
├── controllers/        # Request handlers
├── services/           # Business logic
└── middleware/         # Express middleware
    └── auth.js         # JWT authentication
```

## Environment Variables

| Variable | Required | Description |
|---------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `OPENAI_API_KEY` | No* | OpenAI API key for AI features |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `RUN_MIGRATIONS` | No | Set to "true" to run migrations on startup |

*Required only for AI chat features

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Providers
- `POST /api/providers` - Create provider profile
- `GET /api/providers/me` - Get my provider profile
- `PUT /api/providers/me` - Update provider profile

### Services
- `POST /api/services` - Create service (provider)
- `GET /api/services` - List my services (provider)
- `GET /api/services/browse` - Browse services (public)
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service (provider)
- `DELETE /api/services/:id` - Delete service (provider)

### Bookings
- `POST /api/bookings` - Create booking (customer)
- `GET /api/bookings/my-bookings` - My bookings (customer)
- `GET /api/bookings/provider/my-bookings` - Provider bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update status (provider)
- `PUT /api/bookings/:id/cancel` - Cancel booking (customer)

### Business Info
- `POST /api/business-info` - Create/update business info (provider)
- `GET /api/business-info/me` - Get my business info (provider)

### AI Chat
- `POST /api/ai/chat` - Ask AI a question (public)

### Health
- `GET /health` - Health check

## Deployment

### Railway

1. Push code to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy!

Railway will automatically:
- Detect Node.js
- Install dependencies
- Run `npm start`
- Provide `DATABASE_URL` automatically

## Development

### Run Migrations

```bash
RUN_MIGRATIONS=true npm start
```

### Check Health

```bash
curl http://localhost:3000/health
```

## License

ISC

## Support

See [FEATURE_SUGGESTIONS.md](./FEATURE_SUGGESTIONS.md) for suggested enhancements.







