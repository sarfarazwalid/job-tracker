# JobTracker – AI-Powered Job Application Management Platform

## Overview

JobTracker is a modern full-stack web application designed to help job seekers organize, track, and optimize their job search process. The platform provides application management, company tracking, analytics, notifications, AI-powered resume analysis, and an intelligent career assistant, all wrapped in a modern and responsive user experience.

The goal of JobTracker is to provide a centralized workspace where users can efficiently manage their job applications, monitor progress, prepare for interviews, and improve their chances of landing their next opportunity.

---

## Features

### Application Management

* Create, update, and delete job applications
* Track application status throughout the hiring process
* Organize applications by stage
* Monitor application deadlines and progress

### Company Management

* Maintain a database of target companies
* Store recruiter and company information
* Track company-specific applications
* Manage notes and company details

### Dashboard & Analytics

* Application overview dashboard
* Job search performance metrics
* Success rate tracking
* Visual analytics and statistics
* Recent activity monitoring

### Notifications

* Interview reminders
* Application updates
* Important job search alerts
* Real-time unread notification tracking

### AI Resume Analyzer

* Upload resume or paste resume content
* Paste job requirements or job descriptions
* Analyze resume-job compatibility
* Generate an AI-powered matching score
* Identify matching and missing skills
* Provide actionable insights for improvement

### AI Career Assistant

* Interactive AI chatbot
* Resume guidance
* Interview preparation assistance
* Career-related Q&A
* Job search recommendations
* Application strategy suggestions

### User Account Management

* Secure authentication
* Profile management
* Username updates
* Email updates
* Password management
* Account deletion

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Framer Motion
* Lucide React

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JWT Authentication

### AI Features

* Resume Analysis Engine
* AI Chat Assistant

---

## Project Structure

```text
JobTracker/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── styles/
│
├── README.md
└── .gitignore
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/job-tracker.git
cd job-tracker
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

---

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:5001
```

---

## Future Improvements

* Advanced AI resume recommendations
* Resume version management
* Job market insights
* Calendar integration
* Email synchronization
* Advanced interview preparation tools
* Mobile application support

---

## Author

Walid

Computer Science Engineer

---

## License

MIT License
