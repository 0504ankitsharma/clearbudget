# 💰 ClearBudget - Personal Finance Tracker

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-Latest-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase">
</div>

<div align="center">
  <h3>🎓 Perfect for students! Track expenses, manage budgets, and get AI-powered insights all in one beautiful app that actually makes finance fun.</h3>
  
  <a href="https://clearbudget.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_App-4F46E5?style=for-the-badge" alt="Live Demo">
  </a>
  
  <a href="https://github.com/0504ankitsharma/clearbudget.git">
    <img src="https://img.shields.io/badge/⭐_Star_on-GitHub-181717?style=for-the-badge&logo=github" alt="Star on GitHub">
  </a>
</div>

---

## ✨ Features

### 💬 **Chat-based Expense Tracking**
- **Natural Language Processing**: Just type "Spent 250 on lunch" or "Got 5000 from part-time job"
- **AI-Powered Parsing**: Advanced AI understands context and automatically categorizes transactions
- **Conversational Interface**: Ask questions like "How can I save money?" and get personalized advice

### 📊 **Visual Analytics Dashboard**
- **Beautiful Charts**: Interactive pie charts and bar graphs using Chart.js
- **Category Breakdown**: See exactly where your money goes
- **Real-time Updates**: All charts update instantly as you add transactions

### 🤖 **Smart AI Financial Tips**
- **Personalized Insights**: AI analyzes your spending patterns to give custom advice
- **Contextual Recommendations**: Tips based on your actual financial data
- **Student-Friendly**: Advice tailored for student budgets and lifestyle

### 📋 **Advanced Transaction Management**
- **CRUD Operations**: Add, edit, delete, and view all transactions
- **Date-wise Organization**: Transactions grouped by date (Today, Yesterday, etc.)
- **Time Tracking**: See exact time when each transaction was made
- **Excel Export**: Export your financial data to Excel with one click

### 🔐 **Secure Authentication**
- **Clerk Integration**: Secure, modern authentication system
- **User Profiles**: Beautiful user management interface
- **Data Privacy**: Your financial data is completely private and secure

### 🎨 **Modern UI/UX**
- **Glassmorphism Design**: Beautiful, modern interface with backdrop blur effects
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Dark Theme Support**: Easy on the eyes for extended use
- **Smooth Animations**: Delightful micro-interactions throughout the app

---

## 🚀 Live Demo

Visit the live application: **[clearbudget.vercel.app](https://clearbudget.vercel.app)**

### Sample Features to Try:
1. **Sign up** and create your account
2. **Chat with the AI**: Type "spent 100 on coffee"
3. **View Analytics**: Check your spending breakdown
4. **Get AI Tips**: Ask "how can I save money?"
5. **Export Data**: Download your transactions as Excel

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|----------|
| **Next.js** | React Framework | 15.5.2 |
| **React** | Frontend Library | 19.1.0 |
| **TypeScript** | Type Safety | Latest |
| **TailwindCSS** | Styling | 4.0 |
| **Supabase** | Database & Auth Backend | Latest |
| **Clerk** | Authentication | 6.31.9 |
| **Chart.js** | Data Visualization | 4.5.0 |
| **Google Gemini AI** | Natural Language Processing | API |
| **XLSX** | Excel Export | Latest |
| **Date-fns** | Date Manipulation | Latest |

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/0504ankitsharma/clearbudget.git
cd clearbudget
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Database Setup
Run the SQL schema in your Supabase database:

```sql
-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
```

### 5. Run Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🏗️ Project Structure

```
clearbudget/
├── app/                      # Next.js App Router
│   ├── dashboard/           # Main dashboard page
│   ├── sign-in/            # Authentication pages
│   ├── sign-up/            
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx           # Landing page
├── components/             # Reusable components
│   └── Loading.tsx        # Loading components
├── utils/                  # Utility functions
│   ├── ai.ts              # AI processing & tips generation
│   ├── export.ts          # Excel export functionality
│   └── supabase.ts        # Database operations
├── public/                # Static assets
└── middleware.ts          # Route protection
```

---

## 🎯 Key Features Breakdown

### 1. **AI-Powered Expense Parsing** (`utils/ai.ts`)
```typescript
// Example: "spent 250 on lunch" → 
{
  type: "expense",
  amount: 250,
  category: "food",
  description: "lunch"
}
```

### 2. **Smart Financial Tips Generation**
- Analyzes spending patterns
- Generates personalized recommendations
- Provides actionable insights

### 3. **Excel Export** (`utils/export.ts`)
- Formatted spreadsheet with summary
- Date/time breakdown
- Category analysis

### 4. **Real-time Chat Interface**
- Natural language processing
- Contextual responses
- Transaction history integration

---

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

### Manual Deployment
```bash
npm run build
npm start
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use TailwindCSS for styling
- Add proper error handling
- Write meaningful commit messages

---

## 📸 Screenshots

<div align="center">
  
### 🏠 Landing Page
*Beautiful hero section with feature highlights*

### 📊 Dashboard
*Complete financial overview with interactive charts*

### 💬 AI Chat Interface
*Natural language expense tracking*

### 📋 Transaction Management
*Advanced CRUD operations with Excel export*

</div>

---

## 🚧 Roadmap

- [ ] **Mobile App** (React Native)
- [ ] **Budget Goals & Alerts**
- [ ] **Multi-currency Support**
- [ ] **Bank Account Integration**
- [ ] **Investment Tracking**
- [ ] **Expense Sharing (Split bills)**
- [ ] **Advanced Analytics & Reports**
- [ ] **Voice Input Support**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ankit Sharma**
- Website: [tinyurl.com/iamankitsharma](https://tinyurl.com/iamankitsharma)
- GitHub: [@0504ankitsharma](https://github.com/0504ankitsharma)
- LinkedIn: [Connect with me](https://linkedin.com/in/0504ankitsharma)

---

## 🙏 Acknowledgments

- **Google Gemini AI** for natural language processing
- **Supabase** for backend infrastructure
- **Clerk** for authentication services
- **Vercel** for hosting and deployment
- **Chart.js** for beautiful data visualizations

---

## ⭐ Show Your Support

If this project helped you, please consider:
- ⭐ **Starring** the repository
- 🍴 **Forking** for your own projects
- 📢 **Sharing** with friends and colleagues
- 🐛 **Reporting** bugs and issues
- 💡 **Suggesting** new features

---

<div align="center">
  <h3>Made with ❤️ for students, by <a href="https://tinyurl.com/iamankitsharma">Ankit Sharma</a></h3>
  <p>© 2025 ClearBudget. Making finance fun since 2025.</p>
</div>
