#!/bin/bash

# Git push script with proper commit message
# Run this to push all changes to GitHub

echo "🚀 Preparing to push production deployment changes..."
echo ""

# Add all files
echo "📦 Adding files..."
git add .

# Create commit
echo "📝 Creating commit..."
git commit -m "feat: Configure production deployment for Vercel

- Update CORS configuration to allow Vercel domains
- Add production environment variables and configuration
- Create Vercel deployment configuration (vercel.json)
- Add comprehensive deployment documentation
- Verify API endpoints match production
- Build backend successfully with new config

Changes:
✅ Backend CORS: Allow *.vercel.app and custom domains
✅ Environment: NEXT_PUBLIC_API_URL=https://api.zentrip.social
✅ API Client: Already properly configured
✅ Vercel config: Created vercel.json
✅ Documentation: Complete deployment guides

Production API: https://api.zentrip.social
Ready for Vercel deployment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Your code is now on GitHub."
echo ""
echo "📋 Next steps:"
echo "1. SSH into droplet and update backend"
echo "2. Deploy to Vercel"
echo "3. Test production deployment"
echo ""
echo "See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"
