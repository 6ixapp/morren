# Morren Backend API

Custom REST API backend for the Morren marketplace application.

**Deploy to Railway:** See [DEPLOY_RAILWAY.md](../DEPLOY_RAILWAY.md) in the repo root for step-by-step Railway deployment (PostgreSQL + backend service, env vars, frontend API URL).

## Features

- JWT-based authentication
- PostgreSQL database
- RESTful API endpoints
- Role-based access control (buyer, seller, admin, shipping_provider)
- Complete CRUD operations for all resources

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials. Use `127.0.0.1` (not `localhost`) in DATABASE_URL on Windows to avoid IPv6 connection issues:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@127.0.0.1:5432/morren_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
CORS_ORIGIN=http://localhost:3000
WHATSAPP_AUTOMATION_ENABLED=false
DEFAULT_AUCTION_DURATION_DAYS=1
INTERAKT_BASE_URL=https://api.interakt.ai/v1/public
INTERAKT_API_KEY=your-interakt-api-key
INTERAKT_CHANNEL_NUMBER=
INTERAKT_WEBHOOK_SECRET=your-interakt-webhook-secret
```

### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE morren_db;
```

### 4. Run Migrations

```bash
npm run migrate
```

This will create all the necessary tables and indexes.

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`.

### Troubleshooting: ECONNREFUSED ::1:5432

- **PostgreSQL not running**: Start PostgreSQL (e.g. Windows: start the postgres service; Mac: `brew services start postgresql`).
- **Wrong host**: In `backend/.env`, set `DATABASE_URL` with `127.0.0.1` (not `localhost`) so the client uses IPv4; on Windows `localhost` can resolve to `::1` and fail.
- **Wrong port/password**: Use the same port (default 5432) and password as your local Postgres. Create the database: `psql -U postgres -c "CREATE DATABASE morren_db;"`.

In development, if migrations fail the server still starts so you can hit `/health`; fix `DATABASE_URL` and restart to run migrations.

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user (buyer or shipping_provider only)
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user (requires auth)
- `POST /auth/logout` - Logout (requires auth)

### Users

- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id` - Update user
- `POST /api/users/seller` - Create seller account (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Items

- `GET /api/items` - List all items
- `GET /api/items/active` - List active items
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create item
- `PATCH /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Orders

- `GET /api/orders` - List all orders (admin only)
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/buyer/:buyerId` - Get orders by buyer
- `GET /api/orders/seller/:sellerId` - Get pending orders for seller to bid
- `GET /api/orders/seller/:sellerId/items` - Get orders for seller's items
- `GET /api/orders/shipping` - Get accepted orders for shipping
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Bids

- `GET /api/bids` - List all bids (admin only)
- `GET /api/bids/:id` - Get bid by ID
- `GET /api/bids/order/:orderId?maskSellerInfo=true` - Get bids by order
- `GET /api/bids/seller/:sellerId` - Get bids by seller
- `POST /api/bids` - Create bid
- `PATCH /api/bids/:id` - Update bid
- `DELETE /api/bids/:id` - Delete bid

### Shipping Bids

- `GET /api/shipping-bids` - List all shipping bids (admin only)
- `GET /api/shipping-bids/:id` - Get shipping bid by ID
- `GET /api/shipping-bids/order/:orderId?maskProviderInfo=true` - Get shipping bids by order
- `GET /api/shipping-bids/provider/:providerId` - Get shipping bids by provider
- `POST /api/shipping-bids` - Create shipping bid
- `PATCH /api/shipping-bids/:id` - Update shipping bid
- `DELETE /api/shipping-bids/:id` - Delete shipping bid

### Stats

- `GET /api/stats/buyer/:buyerId` - Get buyer dashboard stats
- `GET /api/stats/seller/:sellerId` - Get seller dashboard stats
- `GET /api/stats/admin` - Get admin dashboard stats

### RFQs

- `GET /api/rfqs?buyerId=:id` - List RFQs (optionally filtered by buyer)
- `GET /api/rfqs/:id` - Get RFQ by ID
- `GET /api/rfqs/by-invite/:token` - Get RFQ by invite token (public)
- `POST /api/rfqs` - Create RFQ
- `PATCH /api/rfqs/:id` - Update RFQ
- `POST /api/rfqs/:id/invites` - Add supplier invite
- `PATCH /api/rfqs/invites/viewed` - Mark invite as viewed (public)
- `POST /api/rfqs/:id/quote` - Submit or update quote (public)
- `POST /api/rfqs/:id/award` - Award RFQ to supplier

### Suppliers

- `GET /api/suppliers` - List all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create supplier
- `PATCH /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Market Prices

- `GET /api/market-prices?productName=:name` - List market prices
- `POST /api/market-prices` - Add market price
- `DELETE /api/market-prices/:id` - Delete market price

### Buyer Profiles

- `GET /api/buyer-profiles/:buyerId` - Get buyer profile
- `PUT /api/buyer-profiles/:buyerId` - Update buyer profile

### WhatsApp Automation (Interakt)

- `POST /api/whatsapp/interakt/webhook` - Interakt webhook for seller replies
- `POST /api/whatsapp/order/:orderId/broadcast` - Manual auction broadcast/rebroadcast
- Commands sellers can send: `BID <orderId> <amount>`, `STATUS <orderId>`, `RANK <orderId>`
- If `INTERAKT_WEBHOOK_SECRET` is set, webhook requests must include `x-interakt-secret` (or `x-webhook-secret`) header with the same value.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations

## Testing with cURL

### Register a new buyer:

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@test.com","password":"password123","name":"Test Buyer","role":"buyer"}'
```

### Login:

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@test.com","password":"password123"}'
```

### Get current user (replace TOKEN with your access token):

```bash
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── db/               # Database connection and migrations
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── index.ts          # Main application file
├── .env                  # Environment variables
├── .env.example          # Example environment variables
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## License

ISC
