# Swiss Bank App

A comprehensive banking application with modern UI and robust backend API.

## Features

### Frontend (React)
- Modern, responsive banking interface
- User authentication and registration
- Dashboard with account overview
- Transaction history and management
- Money transfer functionality
- Currency converter
- Admin dashboard
- Dark mode support
- Real-time notifications

### Backend (Node.js/Express)
- RESTful API with JWT authentication
- User management and profiles
- Transaction processing and history
- Security middleware (Helmet, rate limiting, CORS)
- MongoDB database integration
- Input validation and error handling

## Quick Start (Simulator Mode)

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (for full functionality) or run in demo mode

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd swiss-bank-app

   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

2. **Environment Setup:**
   ```bash
   # Copy backend environment file
   cp backend/.env.example backend/.env

   # Edit backend/.env with your settings
   # For demo mode, you can use default values
   ```

3. **Start the Application:**

   **Option 1: Full Stack (requires MongoDB)**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev

   # Terminal 2: Start frontend
   cd ..
   npm start
   ```

   **Option 2: Frontend Only (Simulator Mode)**
   ```bash
   # Run frontend with mock data
   npm start
   ```

4. **Access the Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## Demo Mode

The application includes comprehensive mock data and can run without a backend for demonstration purposes. All features work with simulated data, perfect for presentations and investor demos.

### Demo Features
- Pre-populated user accounts
- Mock transactions and balances
- Simulated transfers and payments
- Currency conversion with mock rates
- Admin dashboard with sample data

## Project Structure

```
swiss-bank-app/
├── src/                    # React frontend
│   ├── services/          # API service layer
│   ├── components/        # React components
│   └── App.js            # Main app component
├── backend/               # Express backend
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── server.js         # Server entry point
├── ROADMAP.md            # Development roadmap
├── TODO.md              # Task tracking
└── README.md            # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions/transfer` - Create transfer
- `GET /api/transactions/analytics/spending` - Get spending analytics

## Development Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development phases and timeline.

## Technologies Used

### Frontend
- React 18
- Axios for API calls
- Tailwind CSS (via inline styles)
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Helmet, CORS, rate limiting for security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or support, please contact the development team.
