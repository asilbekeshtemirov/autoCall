# Sipuni Autocall - Web Management Platform

A secure, modern web application for managing Sipuni Autocall campaigns with enterprise-grade architecture. Built with Next.js 14, MongoDB, and TypeScript.

## 🚀 Features

- **🔐 Secure Authentication**: User management with MongoDB + JWT tokens
- **🛡️ Server-Side Security**: Sipuni token never exposed to frontend
- **📊 Campaign Management**: Create, list, edit, and manage autocall campaigns
- **📞 Phone Number Upload**: Batch upload phone numbers for campaigns
- **▶️ Campaign Control**: Start/stop campaigns with a single click
- **📈 Results Monitoring**: View detailed call results with filtering
- **👥 Multi-User Support**: Multiple users can access the same Sipuni account
- **🔄 Single Source of Truth**: All data directly from Sipuni API
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **🚀 Production Ready**: Scalable architecture with security best practices

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB (local or MongoDB Atlas)
- Active Sipuni account with API access
- Sipuni admin JWT token (from lk.sipuni.com)

## 🔧 Installation

### 1. Clone or Download the Project

```bash
cd sipuni-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

```bash
# Sipuni API Configuration (Server-side ONLY)
SIPUNI_API_BASE_URL=https://apilk.sipuni.com/api/ver2
SIPUNI_TOKEN=your_sipuni_jwt_token_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sipuni-app

# JWT Secret (for user authentication)
JWT_SECRET=your_super_secret_jwt_key_change_this

# Environment
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEBUG=false
```

**Important**:
- Get your `SIPUNI_TOKEN` from https://lk.sipuni.com (admin account)
- Use a strong `JWT_SECRET` (generate with `openssl rand -base64 32`)
- For production, use MongoDB Atlas for `MONGODB_URI`

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Authentication Flow

### New Architecture (Secure)

1. **User Registration**: Users create accounts in our MongoDB
2. **Login**: Users login with email/password
3. **JWT Token**: Our backend generates JWT token (7 days expiry)
4. **Token Storage**: JWT stored in browser localStorage (`auth_token`)
5. **API Requests**: Frontend sends JWT to our backend
6. **Backend Proxy**: Our backend uses SIPUNI_TOKEN (.env) to call Sipuni API
7. **Response**: Data from Sipuni API returned to frontend

### Why This is Secure?

✅ **SIPUNI_TOKEN never leaves the server**
✅ **Frontend never knows Sipuni credentials**
✅ **User authentication managed separately**
✅ **Multiple users can access safely**
✅ **No data sync issues (single source of truth)**

See `ARCHITECTURE.md` for detailed architecture documentation.

## 📱 Using the Application

### Dashboard
- View all your campaigns in a grid layout
- See campaign status at a glance (Active, Paused, Stopped)
- Access campaign details with a single click

### Create Campaign
1. Click "Create New Campaign" button
2. Fill in campaign details:
   - Campaign name (required)
   - Description
   - Assign operator
   - Assign line
   - Answer text/message
   - Max retries (0-10)
   - Retry interval (seconds)
3. Click "Create Campaign"

### Upload Phone Numbers
1. Open campaign details
2. Click "Upload Numbers" button
3. Choose upload method:
   - **Paste**: Copy-paste phone numbers (one per line)
   - **File**: Upload .txt or .csv file
4. Format: `+[country code][number]` (e.g., `+998901234567`)
5. Click "Upload Numbers"

### Launch Campaign
1. Open campaign details
2. Click "Start Campaign" button
3. Campaign status will change to "Active"
4. Monitor progress in "View Results" tab

### Monitor Results
1. Open campaign
2. Click "View Results" tab
3. Filter by status:
   - **All**: All calls
   - **Answered**: Successfully connected calls
   - **Failed**: Failed call attempts
   - **Busy**: Busy signals
4. View call details:
   - Phone number
   - Call status
   - Duration
   - Assigned operator
   - Call timestamp
5. Retry failed numbers (coming soon)

## 📊 Campaign Details View

### Details Tab
- Campaign ID
- Current status
- Creation date
- Full campaign information

### Operators Tab
- View assigned operators
- View assigned lines/extensions
- Current operator status

### Settings Tab
- View campaign configuration
- See all campaign settings from Sipuni

## 🔗 API Endpoints

### Our Backend APIs (Used by Frontend)

#### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | JWT |

#### Campaigns
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/campaigns` | List campaigns | JWT |
| POST | `/api/campaigns` | Create campaign | JWT |
| GET | `/api/campaigns/:id` | Get details | JWT |
| PUT | `/api/campaigns/:id` | Update campaign | JWT |
| DELETE | `/api/campaigns/:id` | Delete campaign | JWT |
| POST | `/api/campaigns/:id/start` | Start campaign | JWT |
| POST | `/api/campaigns/:id/stop` | Stop campaign | JWT |
| GET | `/api/campaigns/:id/operators` | Get operators | JWT |
| GET | `/api/campaigns/:id/results` | Get results | JWT |

### Backend → Sipuni API Integration

Our backend automatically proxies requests to:
- `https://apilk.sipuni.com/api/ver2/*`

Using the `SIPUNI_TOKEN` from `.env` file.

## 🚀 Deployment

### Prerequisites for Production

1. **MongoDB Atlas** (recommended)
   - Create free cluster at https://cloud.mongodb.com
   - Get connection string
   - Add to `MONGODB_URI`

2. **Sipuni Token**
   - Login to https://lk.sipuni.com
   - Get JWT token from admin account
   - Add to `SIPUNI_TOKEN`

3. **JWT Secret**
   - Generate: `openssl rand -base64 32`
   - Add to `JWT_SECRET`

### Deploy to Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Add environment variables:
   ```
   SIPUNI_TOKEN=...
   MONGODB_URI=...
   JWT_SECRET=...
   NEXT_PUBLIC_APP_ENV=production
   ```
4. Deploy

### Deploy to Other Platforms

All platforms supporting Next.js 14+ work:
- Vercel (recommended)
- Netlify
- Railway
- Render
- AWS Amplify

### Deploy to Other Platforms

#### AWS Amplify
```bash
amplify init
amplify publish
```

#### Netlify
```bash
npm run build
# Deploy the 'out' directory to Netlify
```

#### Self-Hosted (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security Features

### Enterprise-Grade Security

1. **Server-Side Token Management**
   - SIPUNI_TOKEN stored in `.env` (server-only)
   - Never exposed to frontend or browser
   - Only accessible to backend API routes

2. **User Authentication**
   - MongoDB for user storage
   - Passwords hashed with bcrypt (10 rounds)
   - JWT tokens for session management (7 days expiry)
   - Token validation on every request

3. **API Security**
   - All Sipuni API calls from backend only
   - Frontend → Backend: JWT authentication
   - Backend → Sipuni: Admin token from `.env`
   - HTTPS enforced in production

4. **Data Protection**
   - No sensitive data in frontend code
   - No data duplication (single source of truth)
   - User passwords never logged or exposed
   - Automatic logout on token expiry

### Best Practices

✅ Never commit `.env` to version control
✅ Use strong JWT_SECRET (32+ characters)
✅ Rotate SIPUNI_TOKEN periodically
✅ Use MongoDB Atlas with authentication
✅ Enable HTTPS in production
✅ Monitor API request logs

## 🐛 Troubleshooting

### "User registration failed"
- Check MongoDB connection
- Verify `MONGODB_URI` in `.env`
- Ensure MongoDB is running
- Check console logs for errors

### "Authentication failed"
- Verify email/password are correct
- Check if user exists in MongoDB
- Try registering if you're a new user
- Check browser console for errors

### "Failed to load campaigns"
- Verify `SIPUNI_TOKEN` is valid
- Check token expiry (token has exp date)
- Get fresh token from lk.sipuni.com
- Check server logs

### MongoDB Connection Error
- Ensure MongoDB is running
- Verify connection string format
- Check firewall/network settings
- For Atlas: whitelist your IP address

### "Phone number upload failed"
- Verify phone numbers are in correct format: `+[country][number]`
- Ensure no duplicate numbers
- Check file encoding if uploading file (UTF-8 recommended)
- Verify numbers don't contain spaces or special characters

### Numbers not appearing in campaign
- Refresh the page
- Check campaign results to confirm upload
- Verify numbers were formatted correctly
- Try uploading smaller batch first

## 📝 Supported Phone Number Formats

- **Uzbekistan**: `+998901234567` (mobile), `+998661234567` (home)
- **Russia**: `+79991234567`
- **Other countries**: Use international format `+[country code][number]`

## 🗂️ Project Structure

```
sipuni-app/
├── app/
│   ├── api/                     # Backend API Routes
│   │   ├── auth/
│   │   │   ├── login/route.ts   # Login endpoint
│   │   │   ├── register/route.ts# Registration endpoint
│   │   │   └── me/route.ts      # Current user endpoint
│   │   └── campaigns/
│   │       ├── route.ts         # List/Create campaigns
│   │       └── [id]/
│   │           ├── route.ts     # Get/Update/Delete campaign
│   │           ├── start/route.ts
│   │           ├── stop/route.ts
│   │           ├── operators/route.ts
│   │           └── results/route.ts
│   ├── dashboard/
│   │   └── page.tsx             # Dashboard UI
│   └── login/
│       └── page.tsx             # Login/Register UI
├── lib/
│   ├── mongodb.ts               # MongoDB connection
│   ├── sipuni-server.ts         # Server-side Sipuni client
│   ├── sipuni-api.ts            # Frontend API client
│   ├── auth-context.tsx         # React Auth Context
│   ├── auth-middleware.ts       # JWT validation
│   ├── use-protected.ts         # Protected route hook
│   └── models/
│       └── user.ts              # User model & auth logic
├── .env                         # Environment variables (DO NOT COMMIT!)
├── .env.example                 # Example environment file
├── ARCHITECTURE.md              # Architecture documentation
├── package.json
└── README.md
```

## 🔄 API Response Handling

All API calls include error handling:

```typescript
try {
  const result = await api.getCampaigns();
  // Handle success
} catch (error) {
  // Errors are displayed to user
  // 401 errors trigger automatic re-authentication
}
```

## 📈 Monitoring & Logging

The application logs API interactions to the browser console for debugging:

```bash
# Open browser Developer Tools (F12)
# Check Console tab for API call logs
```

## 🤝 Support

For issues related to:
- **Sipuni API**: Contact Sipuni support at support@sipuni.com
- **This Application**: Check the GitHub issues or contact your administrator

## 📄 License

This project is proprietary and confidential.

## 🎯 Roadmap

### Current Features
- ✅ Campaign management
- ✅ Phone number upload
- ✅ Campaign launch/stop
- ✅ Results monitoring
- ✅ Operator assignment

### Upcoming Features
- 🔄 Bulk retry for failed numbers
- 🔄 Campaign scheduling
- 🔄 Advanced filtering and search
- 🔄 Call recording playback
- 🔄 Analytics dashboard
- 🔄 SMS integration
- 🔄 CSV export of results

## 💡 Tips for Effective Campaign Management

1. **Test First**: Always test with a small batch of numbers
2. **Monitor Progress**: Check results regularly during campaign
3. **Adjust Retries**: Customize retry settings for your use case
4. **Use Descriptions**: Add clear descriptions to campaigns for tracking
5. **Regular Backups**: Export results regularly for your records
6. **Update Operators**: Keep operator assignments current
7. **Clean Data**: Verify phone numbers before uploading

## 🔐 Privacy & Data Protection

- **User Data**: Stored securely in MongoDB
- **Campaign Data**: Always fetched from Sipuni (no duplication)
- **Passwords**: Hashed with bcrypt (never stored as plaintext)
- **Tokens**: JWT with expiration, stored client-side
- **Sipuni Token**: Server-side only, never exposed

## 📚 Documentation

- **README.md** - This file (getting started)
- **ARCHITECTURE.md** - Detailed architecture documentation
- **API Reference** - See `/app/api/` folder

## 🤝 Contributing

This is a private/internal project. Contact admin for access.

## 📄 License

Proprietary - All Rights Reserved

---

**Version**: 2.0.0
**Architecture**: Server-Driven Integration with Single Source of Truth
**Last Updated**: 2025
**Status**: Production Ready ✅
# autoCall
