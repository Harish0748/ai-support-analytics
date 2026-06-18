# 🚀 SupportIQ — AI-Powered Customer Support Analytics Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![React](https://img.shields.io/badge/react-18-blue)
![OpenAI](https://img.shields.io/badge/AI-GPT--4o--mini-purple)

> A full-stack AI-powered platform that transforms raw customer support data into intelligent, actionable insights — featuring real-time sentiment analysis, auto ticket categorization, agent performance tracking, and AI-generated responses.

---

## 📸 Screenshots

> Add screenshots of your dashboard here after running the app.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Ticket Categorization** | GPT-4 auto-classifies every ticket into categories |
| 💬 **Sentiment Analysis & NLP** | Real-time sentiment scoring on every message |
| 📊 **Live Analytics Dashboard** | Volume trends, resolution rates, satisfaction scores |
| 🤖 **AI Response Suggestions** | One-click AI-drafted replies for agents |
| 👥 **Agent Performance Metrics** | Per-agent KPIs, resolution rates, satisfaction |
| ⚡ **Real-time Updates** | Socket.io powered live ticket feed |
| 🔐 **Role-based Access** | Admin / Manager / Agent permission tiers |

---

## 🏗️ Architecture

```
ai-support-analytics/
├── backend/                    # Express.js REST API
│   └── src/
│       ├── config/             # DB + OpenAI config
│       ├── controllers/        # Route handlers
│       ├── middleware/         # Auth, error handling
│       ├── models/             # Sequelize ORM models
│       ├── routes/             # API routes
│       ├── services/           # AI + Analytics business logic
│       └── utils/              # Logger, seeder
└── frontend/                   # React + Vite
    └── src/
        ├── components/         # Reusable UI components
        ├── pages/              # Page-level components
        ├── services/           # API + Socket.io clients
        └── store/              # Zustand state management
```

---

## 🛠️ Tech Stack

**Backend**
- Node.js + Express.js
- MySQL + Sequelize ORM
- OpenAI GPT-4o-mini API
- Socket.io (real-time)
- JWT Authentication
- Winston logging

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Recharts (data visualization)
- TanStack Query (server state)
- Zustand (client state)
- React Router v6

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+
- OpenAI API key ([get one here](https://platform.openai.com))

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-support-analytics.git
cd ai-support-analytics
```

### 2. Install all dependencies
```bash
npm run install:all
```

### 3. Configure the backend
```bash
cd backend
cp .env.example .env
```
Edit `.env` and fill in:
```env
DB_HOST=localhost
DB_NAME=ai_support_analytics
DB_USER=root
DB_PASSWORD=your_password
OPENAI_API_KEY=sk-your-key-here
JWT_SECRET=any-long-random-string
```

### 4. Set up the database
```bash
# Create database in MySQL first
mysql -u root -p -e "CREATE DATABASE ai_support_analytics;"

# Then seed with demo data
cd backend
npm run seed
```

### 5. Start the application
```bash
# From root — starts both frontend and backend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health check**: http://localhost:5000/health

### 6. Log in with demo credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@support.com | Admin@123 |
| Manager | sarah@support.com | Manager@123 |
| Agent | john@support.com | Agent@123 |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/tickets` | List tickets (paginated, filtered) |
| POST | `/api/tickets` | Create ticket (AI processes async) |
| PUT | `/api/tickets/:id` | Update ticket status/priority |
| POST | `/api/tickets/:id/messages` | Add message + sentiment analysis |
| GET | `/api/tickets/:id/ai-response` | Generate AI reply suggestion |
| GET | `/api/analytics/dashboard` | Dashboard metrics |
| GET | `/api/analytics/sentiment-trends` | Sentiment over time |
| GET | `/api/analytics/agent-performance` | Per-agent KPIs |
| GET | `/api/analytics/ai-insights` | GPT-4 generated insights |
| GET | `/api/analytics/live` | Real-time stats |

---

## 🔑 Environment Variables

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ai_support_analytics
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
```

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file.

---

## 🙋 Author

Built with ❤️ using React, Express, MySQL, and OpenAI GPT-4
