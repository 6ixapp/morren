# Morren Marketplace - Production Ready

A B2B marketplace with four roles (buyer, seller, shipping provider, admin), custom REST API backend, fixed-price orders, bid requests, RFQ with supplier invites, and market prices.

**🚀 [Deploy to Digital Ocean](DIGITALOCEAN_DEPLOYMENT_GUIDE.md)** | **📖 [Full Documentation](DOCUMENTATION_INDEX.md)** | **💻 [Local Dev Setup](GETTING_STARTED.md)**

**CI/CD:** See [docs/CI_CD.md](docs/CI_CD.md) for GitHub Actions validation and Vercel/Railway production deployment setup.

## 🚀 Quick Deploy to Digital Ocean Droplet

This repository includes automated deployment scripts for Digital Ocean droplets. Follow the comprehensive step-by-step guide:

👉 **[DIGITALOCEAN_DEPLOYMENT_GUIDE.md](DIGITALOCEAN_DEPLOYMENT_GUIDE.md)**

**Deployment time:** ~60 minutes from zero to production  
**Monthly cost:** $18-24 (includes database, backups, monitoring)

## 🎉 Custom Backend Implementation

Complete custom REST API backend built from scratch:

- ✅ **72 REST API endpoints** with JWT authentication
- ✅ **PostgreSQL database** with 11 tables
- ✅ **Role-based authorization** for all 4 user roles
- ✅ **Production-ready** with security best practices
- ✅ **Digital Ocean optimized** deployment scripts
- ✅ **Full TypeScript** support
- ✅ **Comprehensive documentation**

**Deploy to Digital Ocean:** [DIGITALOCEAN_DEPLOYMENT_GUIDE.md](DIGITALOCEAN_DEPLOYMENT_GUIDE.md)  
**Local Development:** [GETTING_STARTED.md](GETTING_STARTED.md)  
**Full Details:** [BACKEND_COMPLETE.md](BACKEND_COMPLETE.md)

## Features Summary

- **Four roles**: Buyer, Seller, Shipping provider, Admin (see [FEATURES.md](./FEATURES.md)).
- **Buyer**: Browse items; place order (fixed price) or place bid request; manage orders and seller/shipping bids; RFQ create/award; stats.
- **Seller**: View buyer orders (bid requests); place bids; track my bids; stats.
- **Shipping provider**: View accepted orders; place shipping bids; track my shipping bids; stats.
- **Admin**: Overview stats; manage items (CRUD); manage orders; users and create seller accounts.
- **RFQ**: Create RFQs, invite suppliers, collect quotes, award; supplier portal via invite token (no login).
- **Market prices**: List/add market prices by product; buyer profile (company name, etc.).
- **Auth**: Sign in / sign up (buyers and shipping providers self-signup; seller/admin restricted); role-based redirect.

## 📊 Data Structure

### Items
Each item includes:
- Name, description, image
- Price, size, category
- Condition (new/used/refurbished)
- Quantity in stock
- Custom specifications (unlimited key-value pairs)
- Seller information
- Status (active/sold/inactive)

### Orders
- Item details
- Buyer information
- Quantity and total price
- Shipping address
- Order notes
- Status tracking

### Bids
- Order reference
- Seller information
- Bid amount
- Estimated delivery date
- Message to buyer
- Status (pending/accepted/rejected)

## Design

- **Modern UI**: Gradient backgrounds, smooth animations, hover effects
- **Responsive**: Works on all screen sizes
- **Color-coded**: Buyer (purple/blue), Seller (emerald/teal), Shipping provider (blue), Admin (rose/orange)
- **Interactive**: Dialogs, alerts, real-time updates
- **Accessible**: Clear labels, contrast, keyboard navigation

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React

### Backend (NEW!)
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 12+
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, Helmet, CORS
- **Development**: nodemon, ts-node

## Project Structure

```
/app
  /dashboard
    /buyer           - Buyer dashboard
    /seller          - Seller dashboard
    /shipping-provider - Shipping provider dashboard
    /admin           - Admin panel
    /rfq/new, /rfq/[id] - RFQ create and detail
    /market-prices   - Market prices
    /settings        - Role-based settings
  /auth              - Sign in / sign up
  /supplier/[token]  - Supplier portal (invite token)
  page.tsx           - Landing page

/lib
  types.ts           - TypeScript interfaces
  supabase-api.ts    - Supabase API layer
  supabase.ts        - Supabase client
  auto-accept.ts     - Auto-accept lowest bid when time expires
  cache.ts           - Buyer cache keys

/components
  dashboard-layout.tsx - Role-based nav and layout
  /ui                 - Reusable UI components
```

## 🚦 Getting Started

### For Production: Deploy to Digital Ocean

Follow the complete Digital Ocean deployment guide:

👉 **[DIGITALOCEAN_DEPLOYMENT_GUIDE.md](DIGITALOCEAN_DEPLOYMENT_GUIDE.md)**

**Time to deploy:** ~60 minutes

**What you'll need:**
- Digital Ocean account (starts at $18/month)
- GitHub repository
- SSH access to your droplet

### For Local Development

#### Prerequisites
- Node.js 16+
- PostgreSQL 12+

#### Quick Start
```bash
# 1. Install PostgreSQL (if not installed)
# Download from: https://www.postgresql.org/download/

# 2. Create database
psql -U postgres
CREATE DATABASE morren_db;
\q

# 3. Setup backend
cd backend
npm install
# Edit .env with your postgres password
npm run migrate
npm run seed        # Optional: creates test accounts
npm run dev        # Start backend (port 5000)

# 4. Setup frontend (new terminal)
cd ..
npm install
# Add to .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev        # Start frontend (port 3000)
```

**Detailed Setup:** [GETTING_STARTED.md](GETTING_STARTED.md) | [BACKEND_CHECKLIST.md](BACKEND_CHECKLIST.md)

**Test Accounts (after seed):**
- Admin: admin@morren.com / admin123
- Buyer: buyer@test.com / buyer123
- Seller: seller@test.com / seller123
- Shipper: shipper@test.com / shipper123

## 📚 Documentation

Complete documentation available:

- **[DIGITALOCEAN_DEPLOYMENT_GUIDE.md](DIGITALOCEAN_DEPLOYMENT_GUIDE.md)** - Deploy to Digital Ocean (production)
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - All documentation files
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Local development setup
- **[BACKEND_CHECKLIST.md](BACKEND_CHECKLIST.md)** - Step-by-step backend setup
- **[backend/README.md](backend/README.md)** - Complete API documentation
- **[FEATURES.md](FEATURES.md)** - Full feature overview

## 🎯 Access the Application

Open [http://localhost:3000](http://localhost:3000) (local) or your Railway URL (production)

### Navigate to Dashboards
- Buyer: `/dashboard/buyer`
- Seller: `/dashboard/seller`
- Shipping provider: `/dashboard/shipping-provider`
- Admin: `/dashboard/admin`
- RFQ list: `/dashboard`; create: `/dashboard/rfq/new`
- Market prices: `/dashboard/market-prices`

## 📝 Sample Data

The application includes sample data for:
- 4 items (including organic tomatoes with full specifications)
- 3 orders
- 2 bids
- 3 users (buyer, seller, admin)

## Future Enhancements

- Real-time notifications (Supabase Realtime)
- Payment processing integration
- Image upload (Supabase Storage)
- Analytics and reporting dashboards
- Export (CSV, PDF)
- Email notifications

## 📄 License

MIT License - feel free to use this project for your own purposes.
