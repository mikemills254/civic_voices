# Todo API

A RESTful API for managing todos with user authentication, password reset functionality, and data validation.

## Features

- User Authentication using JSON Web Tokens (JWT)
- Password reset functionality with email notifications
- Email and password validation using regex
- MongoDB Atlas integration with Mongoose ORM
- Complete CRUD operations for todos
- Input validation and error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mikemills254/civic_voices.git
cd civic-voices
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=8000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email_username
EMAIL_PASSWORD=your_email_password
```

## Database Configuration

This project uses MongoDB Atlas as the database. To configure:

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Replace the MONGODB_URI in `.env` file with your connection string

## API Endpoints

### Authentication

- **POST /api/auth/register**
  - Register a new user
  - Body: `{ "email": "user@example.com", "password": "password123", "username": "username" }`

- **POST /api/auth/login**
  - Login user
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: JWT token

- **POST /api/auth/request-reset**
  - Request password reset
  - Body: `{ "email": "user@example.com" }`

- **POST /api/auth/reset-password**
  - Reset password using token
  - Body: `{ "token": "reset_token", "newPassword": "newpassword123" }`

### Todos

All todo endpoints require authentication (JWT token in Authorization header)

- **GET /api/v1/todo**
  - Get all todos for authenticated user

- **POST /api/todo/create**
  - Create a new todo
  - Body: `{ "title": "Todo title", "description": "Todo description" }`

- **GET /api/v1/todo/:id**
  - Get specific todo by ID

- **PUT /api/todo/:id**
  - Update specific todo
  - Body: `{ "title": "Updated title", "description": "Updated description" }`

- **DELETE /api/todo/:id**
  - Delete specific todo

## Validation

### Email Validation
- Must be a valid email format
- Regex pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Password Validation
- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Regex pattern: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/`

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- 200: Success
- 201: Resource created
- 400: Bad request
- 401: Unauthorized
- 404: Resource not found
- 500: Server error

## Security

- Passwords are hashed using bcrypt before storing
- JWT tokens are used for authentication
- Password reset tokens are time-limited
- Input validation prevents injection attacks
- Environment variables for sensitive data

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details