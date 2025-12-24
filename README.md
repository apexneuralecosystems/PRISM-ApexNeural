# PRISM Platform

Landing page for PRISM Platform with demo request functionality. The original project design is available at https://www.figma.com/design/7CsiFY1kbg4ql0wmp9zs0Z/Landing-Page-Layout-Design.

## Project Structure

```
PRISM/
├── backend/              # FastAPI backend
│   ├── services/        # Email service
│   ├── main.py          # FastAPI application
│   ├── requirements.txt # Python dependencies
│   └── .env             # Environment variables (create from .env.example)
├── frontend/            # React frontend
│   ├── src/            # Source code
│   │   ├── components/ # React components
│   │   ├── config/     # API configuration
│   │   └── ...
│   ├── build/          # Production build output
│   ├── node_modules/   # Dependencies
│   ├── package.json    # Frontend dependencies
│   └── ...
└── README.md           # This file
```

## Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL:**
   - Copy `.env.example` to `.env` in the frontend directory
   - Update `VITE_API_BASE_URL` with your backend URL (e.g., `http://localhost:8000` or `http://192.168.1.100:8000`)
   - Defaults to `http://localhost:8000` if not set

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```
   
   The build output will be in `frontend/build/`

## Backend Setup

See [backend/README.md](backend/README.md) for detailed backend setup instructions.

### Quick Start:

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in the backend directory
   - Fill in all required values:
     - `MONGO_URL`: MongoDB connection string
     - `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: Secret keys for JWT tokens (use strong random strings)
     - `FROM_EMAIL` and `EMAIL_PASSWORD`: Email credentials for sending emails
     - `TO_EMAIL`: Recipient email for demo requests
     - `SMTP_SERVER` and `SMTP_PORT`: SMTP server configuration (defaults to Gmail)
     - `CORS_ORIGINS`: Comma-separated list of frontend URLs (e.g., `http://localhost:5173,http://192.168.1.100:5173`)

4. **Run the FastAPI server:**
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:8000`

## Features

- **Demo Request Form**: Submit demo requests with company details
- **Email Notifications**: Automatic email notifications sent to the team
- **FastAPI Backend**: RESTful API for handling demo requests
- **React Frontend**: Modern, responsive UI built with React and TypeScript

## API Endpoints

- `POST /api/demo-request` - Submit a demo request
- `GET /health` - Health check endpoint

For more details, see [backend/README.md](backend/README.md).
