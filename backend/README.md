# Swiss Bank Backend

## Overview
This is the backend API for the Swiss Bank App. It provides RESTful endpoints for user authentication, user management, transactions, and analytics.

## Technologies
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Helmet and rate limiting for security
- Jest and Supertest for testing

## Project Structure
- `server.js`: Entry point of the application.
- `models/`: Mongoose schemas for User and Transaction.
- `routes/`: Express route handlers for auth, users, and transactions.
- `middleware/`: Authentication middleware.
- `config/`: Configuration files (to be added).
- `tests/`: Unit and integration tests (to be added).

## Setup and Run
1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend` directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/swiss-bank
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. The API will be available at `http://localhost:5000/api`.

## API Endpoints
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Login and receive JWT token.
- `GET /api/users/profile`: Get current user profile.
- `PUT /api/users/profile`: Update user profile.
- `PUT /api/users/password`: Change user password.
- `GET /api/transactions`: Get user transactions.
- `POST /api/transactions/transfer`: Create a new transfer transaction.
- `GET /api/transactions/analytics/spending`: Get spending analytics.

## Roadmap
- Add account management endpoints.
- Implement two-factor authentication.
- Add admin dashboard APIs.
- Add unit and integration tests.
- Add API documentation with Swagger.
- Implement logging and monitoring.

## License
MIT License
