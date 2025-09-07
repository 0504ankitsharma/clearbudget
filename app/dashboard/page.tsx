'use client';
import { useState, useEffect, useCallback } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { getUserTransactions, saveTransaction, updateTransaction, deleteTransaction, Transaction } from '@/utils/supabase';
import { parseFinanceMessage, generateFinancialTips, generateFinancialAdvice, ParsedFinanceData } from '@/utils/ai';
import { exportTransactionsToExcel } from '@/utils/export';
import Loading, { SmallLoading } from '@/components/Loading';
import { format, isToday, isYesterday, parseISO, startOfDay, isSameDay } from 'date-fns';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type ChatMessage = {
  sender: 'user' | 'bot';
  text: string;
}

type ViewType = 'chat' | 'summary' | 'chart' | 'tips';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [transactions, setTransactions] = useState<ParsedFinanceData[]>([]);
  const [view, setView] = useState<ViewType>('chat');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [tips, setTips] = useState<string[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    
    setDataLoading(true);
    try {
      const data = await getUserTransactions(user.id);
      setTransactions(data);
      
      // Generate tips based on transaction history (non-blocking)
      generateFinancialTips(data)
        .then(setTips)
        .catch(err => {
          console.error('Error generating tips:', err);
          setTips(['Track your expenses regularly', 'Create a monthly budget', 'Look for savings opportunities']);
        });
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (user) {
      loadTransactions();
    }
  }, [user, isLoaded, loadTransactions]);

  // Handle transaction deletion
  async function handleDeleteTransaction(transactionId: string) {
    if (!user) return;
    
    try {
      await deleteTransaction(transactionId, user.id);
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  }

  // Handle transaction editing
  async function handleUpdateTransaction(transaction: Transaction) {
    if (!user) return;
    
    try {
      await updateTransaction(
        transaction.id,
        user.id,
        parseFloat(transaction.amount.toString()),
        transaction.category,
        transaction.type,
        transaction.description
      );
      await loadTransactions();
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  }

  // Handle Excel export
  async function handleExportToExcel() {
    try {
      setExportLoading(true);
      // Convert ParsedFinanceData to Transaction format for export
      const transactionsForExport = transactions.map(t => ({
        ...t,
        description: t.description || 'No description'
      })) as Transaction[];
      await exportTransactionsToExcel(transactionsForExport);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setExportLoading(false);
    }
  }

  // Group transactions by date
  function groupTransactionsByDate(transactions: ParsedFinanceData[]) {
    const groups: Record<string, ParsedFinanceData[]> = {};
    
    transactions.forEach(transaction => {
      const date = format(new Date(transaction.created_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    return groups;
  }

  // Format date for display
  function formatDateForDisplay(dateString: string) {
    const date = new Date(dateString + 'T00:00:00');
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEE, MMM dd, yyyy');
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const userMessage = message;
    setMessage('');
    
    // Add user message to chat immediately
    const newChatHistory = [...chatHistory, { sender: 'user', text: userMessage } as ChatMessage];
    setChatHistory(newChatHistory);

    if (userMessage.toLowerCase().includes('show summary')) {
      setView('summary');
      setChatHistory([...newChatHistory, {
        sender: 'bot',
        text: "Here's your financial summary!"
      } as ChatMessage]);
      return;
    }

    if (userMessage.toLowerCase().includes('show chart')) {
      setView('chart');
      setChatHistory([...newChatHistory, {
        sender: 'bot',
        text: "Here's a breakdown of your spending by category."
      } as ChatMessage]);
      return;
    }

    if (userMessage.toLowerCase().includes('show tips')) {
      setView('tips');
      setChatHistory([...newChatHistory, {
        sender: 'bot',
        text: 'Here are some personalized financial tips for you!'
      } as ChatMessage]);
      return;
    }

    // Check if this is a financial advice question (not a transaction)
    const isAdviceQuestion = userMessage.match(/(\?|how|what|should|can|advice|tip|help|budget|save|invest|emergency|app|clearbudget)/i) && 
                             !userMessage.match(/(spent|paid|bought|received|earned|got|made)\s+\d+/i);
    
    if (isAdviceQuestion) {
      try {
        setLoading(true);
        const advice = await generateFinancialAdvice(userMessage, transactions);
        setChatHistory([...newChatHistory, {
          sender: 'bot',
          text: advice
        } as ChatMessage]);
        return;
      } catch (error) {
        console.error('Error generating advice:', error);
        setChatHistory([...newChatHistory, {
          sender: 'bot',
          text: "I'd love to help with your financial questions! You can ask me about budgeting, saving, investing, or how to use ClearBudget. For expense tracking, just tell me like 'spent 200 on food'."
        } as ChatMessage]);
        return;
      } finally {
        setLoading(false);
      }
    }

    try {
      setLoading(true);
      // Parse the financial message
      const parsedData = await parseFinanceMessage(userMessage);
      
      // Save to database
      await saveTransaction(
        user.id,
        parsedData.amount,
        parsedData.category,
        parsedData.type,
        parsedData.description || userMessage
      );
      
      // Reload transactions
      await loadTransactions();
      
      // Confirm to the user
      const confirmMessage = parsedData.type === 'income'
        ? `Great! I've recorded ₹${parsedData.amount} as income from ${parsedData.description || 'your source'}.`
        : `Got it! I've recorded ₹${parsedData.amount} spent on ${parsedData.category}.`;
      
      setChatHistory([...newChatHistory, { sender: 'bot', text: confirmMessage } as ChatMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      let helpfulMessage = "I'm having trouble understanding that message. ";
      
      if (errorMessage.includes('parse') || errorMessage.includes('JSON')) {
        helpfulMessage += "The AI response was unclear, but I'll try to help! ";
      } else if (errorMessage.includes('API') || errorMessage.includes('network')) {
        helpfulMessage += "There's a connectivity issue with the AI service. ";
      }
      
      helpfulMessage += "Please try phrases like:\n\n💰 'Spent 250 on lunch'\n📱 'Received 5000 from salary'\n🛒 'Bought groceries for 800'\n💻 'Got 2000 from freelance work'\n\n✨ Make sure to include the amount and what it was for!";
      
      setChatHistory([...newChatHistory, {
        sender: 'bot',
        text: helpfulMessage
      } as ChatMessage]);
    } finally {
      setLoading(false);
    }
  }

  // Calculate financial summary
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  
  const balance = totalIncome - totalExpenses;

  // Prepare chart data
  const categoryData: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryData[t.category] = (categoryData[t.category] || 0) + parseFloat(t.amount.toString());
    });

  const chartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        label: 'Spending by Category',
        data: Object.values(categoryData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
      },
    ],
  };

  // Show loading while user data is being loaded
  if (!isLoaded) {
    return <Loading message="Initializing dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <span className="text-white font-bold text-xl">💰</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ClearBudget
                </h1>
                <p className="text-sm text-gray-500">Your Finance Companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
                <div className="text-sm font-medium text-green-800">
                  {user?.firstName ? `👋 Hey ${user.firstName}!` : '👋 Welcome!'}
                </div>
              </div>
              <div className="relative group">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-12 h-12 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ring-2 ring-white/50 hover:ring-indigo-200 transform hover:scale-110",
                      userButtonPopoverCard: "bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-4",
                      userButtonPopoverMain: "p-4",
                      userButtonPopoverFooter: "hidden",
                      userPreviewMainIdentifier: "text-gray-800 font-semibold text-lg",
                      userPreviewSecondaryIdentifier: "text-gray-500 text-sm",
                      userButtonPopoverActionButton: "text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all duration-200 px-4 py-2",
                      userButtonPopoverActionButtonText: "text-sm font-medium",
                      userButtonPopoverActionButtonIcon: "w-4 h-4"
                    },
                    variables: {
                      colorPrimary: "#6366f1",
                      colorBackground: "rgba(255, 255, 255, 0.95)",
                      colorInputBackground: "rgba(249, 250, 251, 0.8)",
                      colorInputText: "#1f2937",
                      colorText: "#1f2937",
                      colorTextSecondary: "#6b7280",
                      borderRadius: "1rem"
                    }
                  }}
                  afterSignOutUrl="/"
                  showName={false}
                />
                
                {/* Hover tooltip */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-gray-800 text-white text-xs py-2 px-3 rounded-lg whitespace-nowrap shadow-lg">
                    {user?.firstName ? `Account: ${user.firstName}` : 'Account Settings'}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stats Cards */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-black">
                  📏 Quick Actions
                </h3>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                
                {dataLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse bg-gray-200 h-20 rounded-xl"></div>
                    <div className="animate-pulse bg-gray-200 h-20 rounded-xl"></div>
                    <div className="animate-pulse bg-gray-200 h-20 rounded-xl"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Income Card */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-1">💰 Total Income</p>
                          <p className="text-2xl font-bold text-green-800">₹{totalIncome.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="text-2xl">📈</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expenses Card */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100 hover:border-red-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-1">💳 Total Expenses</p>
                          <p className="text-2xl font-bold text-red-800">₹{totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="text-2xl">📉</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Balance Card */}
                    <div className={`group relative overflow-hidden bg-gradient-to-br ${balance >= 0 ? 'from-blue-50 to-indigo-50' : 'from-orange-50 to-red-50'} rounded-xl p-4 border ${balance >= 0 ? 'border-blue-100 hover:border-blue-200' : 'border-orange-100 hover:border-orange-200'} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'} mb-1`}>
                            {balance >= 0 ? '✨ Current Balance' : '⚠️ Current Balance'}
                          </p>
                          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                            ₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </p>
                        </div>
                        <div className={`w-12 h-12 ${balance >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <span className="text-2xl">{balance >= 0 ? '💵' : '😱'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                  <h2 className="text-xl font-bold text-black mb-4">
                    📈 Quick Stats
                  </h2>
                <div className="space-y-3">
                  <button 
                    onClick={() => setView('chat')}
                    className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      view === 'chat' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-white/60 hover:bg-white/80 text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200'
                    }`}
                  >
                    <span className="text-xl">💬</span>
                    <span>AI Chat</span>
                    {view === 'chat' && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                  </button>
                  
                  <button 
                    onClick={() => setView('summary')}
                    className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      view === 'summary' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-white/60 hover:bg-white/80 text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200'
                    }`}
                  >
                    <span className="text-xl">📋</span>
                    <span>Summary</span>
                    {view === 'summary' && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                  </button>
                  
                  <button 
                    onClick={() => setView('chart')}
                    className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      view === 'chart' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-white/60 hover:bg-white/80 text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200'
                    }`}
                  >
                    <span className="text-xl">📈</span>
                    <span>Analytics</span>
                    {view === 'chart' && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                  </button>
                  
                  <button 
                    onClick={() => setView('tips')}
                    className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      view === 'tips' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-white/60 hover:bg-white/80 text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200'
                    }`}
                  >
                    <span className="text-xl">💡</span>
                    <span>Smart Tips</span>
                    {view === 'tips' && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              {view === 'chat' && (
                <div className="flex flex-col h-[600px]">
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🤖</span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">AI Finance Assistant</h3>
                        <p className="text-white/80 text-sm">Ready to help you track expenses!</p>
                      </div>
                      <div className="ml-auto flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white/80 text-sm">Online</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <span className="text-4xl">💬</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Hey there, financial buddy! 🚀</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          I can help you track expenses, give financial advice, and answer questions about ClearBudget!
                        </p>
                        <div className="space-y-3 max-w-lg mx-auto">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-3 text-left shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="font-medium text-green-800 text-sm mb-1">💰 Track Expenses</div>
                            <span className="text-gray-700">&quot;Spent 250 on lunch&quot; or &quot;Bought coffee for 50&quot;</span>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3 text-left shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="font-medium text-blue-800 text-sm mb-1">📈 Record Income</div>
                            <span className="text-gray-700">&quot;Got 5000 from part-time job&quot; or &quot;Received 2000 salary&quot;</span>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl px-4 py-3 text-left shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="font-medium text-purple-800 text-sm mb-1">🤔 Get Financial Advice</div>
                            <span className="text-gray-700">&quot;How can I save money?&quot; or &quot;Should I invest?&quot;</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {chatHistory.map((msg, index) => (
                          <div 
                            key={index} 
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                          >
                            {msg.sender === 'bot' && (
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white text-sm">🤖</span>
                              </div>
                            )}
                            <div 
                              className={`max-w-[calc(100%-4rem)] sm:max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                msg.sender === 'user' 
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-br-md shadow-lg' 
                                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            {msg.sender === 'user' && (
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center ml-3 flex-shrink-0">
                                <span className="text-white text-sm">👤</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {loading && (
                          <div className="flex justify-start animate-fadeIn">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                              <span className="text-white text-sm">🤖</span>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                              <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                                <span className="text-gray-500 text-sm">AI is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Modern Chat Input */}
                  <div className="border-t border-gray-200 bg-white px-6 py-4">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Track expenses, record income, or ask for financial advice... (e.g., 'Spent 250 on lunch' or 'How can I save money?')"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 hover:border-gray-400 transition-all duration-200 shadow-sm"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-2xl">💬</span>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className={`group relative px-4 py-3 sm:px-6 sm:py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 ${
                          loading || !message.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>🚀</span>
                            <span className="hidden sm:inline">Send</span>
                          </>
                        )}
                      </button>
                    </form>
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-500">
                        💡 Tip: Say &quot;Bought coffee for 50&quot;, &quot;Got 2000 salary&quot;, or ask &quot;How can I budget better?&quot;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {view === 'summary' && (
                <div className="p-6">
                  {/* Header with Export and Add buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📈</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          Transaction History
                        </h2>
                        <p className="text-sm text-gray-500">Manage your financial records</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                      <button
                        onClick={() => setShowAddTransaction(true)}
                        className="group flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full"
                      >
                        <span className="text-sm">➕</span>
                        <span>Add Transaction</span>
                      </button>
                      
                      <button
                        onClick={handleExportToExcel}
                        disabled={exportLoading || transactions.length === 0}
                        className={`group flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-200 transform hover:scale-105 w-full ${
                          exportLoading || transactions.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl'
                        }`}
                      >
                        {exportLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Exporting...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">📄</span>
                            <span>Export Excel</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-green-700">Total Income</h3>
                          <p className="text-xl font-bold text-green-600">₹{totalIncome.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl border border-red-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-red-700">Total Expenses</h3>
                          <p className="text-xl font-bold text-red-600">₹{totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                        <span className="text-2xl">💳</span>
                      </div>
                    </div>
                    
                    <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-50 to-indigo-50' : 'from-orange-50 to-red-50'} p-4 rounded-xl border ${balance >= 0 ? 'border-blue-100' : 'border-orange-100'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-sm font-medium ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Balance</h3>
                          <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            ₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </p>
                        </div>
                        <span className="text-2xl">{balance >= 0 ? '✨' : '⚠️'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transactions Table */}
                  {transactions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">📈</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">No Transactions Yet</h3>
                      <p className="text-gray-600 max-w-md mx-auto mb-6">
                        Start tracking your expenses and income to see them organized here by date.
                      </p>
                      <button
                        onClick={() => setView('chat')}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <span>💬</span>
                        <span>Start Adding Transactions</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupTransactionsByDate(transactions)).map(([dateString, dayTransactions]) => (
                        <div key={dateString} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 overflow-hidden shadow-sm">
                          {/* Date Header */}
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 border-b border-indigo-100">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-indigo-800">
                                {formatDateForDisplay(dateString)}
                              </h3>
                              <span className="text-sm text-indigo-600">
                                {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Transactions for this date */}
                          <div className="divide-y divide-gray-100">
                            {dayTransactions.map((transaction) => (
                              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors duration-200 group">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                  <div className="flex items-center space-x-4 flex-1 mb-2 sm:mb-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      transaction.type === 'income' 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-red-100 text-red-600'
                                    }`}>
                                      <span className="text-sm font-bold">
                                        {transaction.type === 'income' ? '+' : '-'}
                                      </span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-3">
                                        <p className="font-medium text-gray-900 truncate">
                                          {transaction.description}
                                        </p>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          {transaction.category}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-500">
                                        {format(new Date(transaction.created_at), 'h:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                                    <p className={`text-lg font-bold ${
                                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {transaction.type === 'income' ? '+' : '-'}₹{parseFloat(transaction.amount.toString()).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </p>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <button
                                        onClick={() => setEditingTransaction({
                                          ...transaction,
                                          description: transaction.description || 'No description'
                                        } as Transaction)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                                        title="Edit transaction"
                                      >
                                        <span className="text-sm">✏️</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Are you sure you want to delete this transaction?')) {
                                            handleDeleteTransaction(transaction.id);
                                          }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                        title="Delete transaction"
                                      >
                                        <span className="text-sm">🗑️</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {view === 'chart' && (
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-6 text-black">Financial Tips</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-4 text-black">Spending by Category</h3>
                      <div className="h-64 w-full">
                        <Pie data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-4 text-black">Category Breakdown</h3>
                      <div className="h-64 w-full">
                        <Bar 
                          data={chartData} 
                          options={{ 
                            maintainAspectRatio: false,
                            responsive: true,
                            scales: {
                              y: {
                                beginAtZero: true
                              }
                            }
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === 'tips' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">💡</span>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-black">
                        Smart Financial Tips
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">Personalized insights based on your spending patterns</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {tips.length > 0 ? (
                      tips.map((tip, index) => {
                        // Extract emoji and text from tip
                        const emojiMatch = tip.match(/^([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)/u);
                        const emoji = emojiMatch ? emojiMatch[1] : '💡';
                        const text = tip.replace(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '');
                        
                        return (
                          <div key={index} className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 p-6 rounded-2xl border border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <span className="text-2xl">{emoji}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-800 font-medium leading-relaxed">{text || tip}</p>
                              </div>
                            </div>
                            <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                              <span className="text-3xl">✨</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                          <span className="text-4xl">📊</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">No Tips Yet</h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-6">
                          Start logging your expenses and income to get personalized financial insights and tips!
                        </p>
                        <button className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg w-full max-w-sm">
                          <span>💬</span>
                          <span>Start by adding a transaction in the chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {tips.length > 0 && (
                    <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🎯</span>
                        <div>
                          <h4 className="font-semibold text-green-800">Pro Tip</h4>
                          <p className="text-green-700 text-sm">
                            These tips are generated based on your spending patterns. Keep tracking to get more personalized advice!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Edit Transaction</h3>
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <span className="text-lg">✕</span>
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateTransaction(editingTransaction);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Type</label>
                  <select
                    value={editingTransaction.type}
                    onChange={(e) => setEditingTransaction({...editingTransaction, type: e.target.value as 'income' | 'expense'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-black"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={isNaN(editingTransaction.amount) ? '' : editingTransaction.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseFloat(value);
                      setEditingTransaction({...editingTransaction, amount: isNaN(numValue) ? 0 : numValue});
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-black"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Category</label>
                  <select
                    value={editingTransaction.category}
                    onChange={(e) => setEditingTransaction({...editingTransaction, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-black"
                  >
                    <option value="food">Food</option>
                    <option value="transport">Transport</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="shopping">Shopping</option>
                    <option value="rent">Rent</option>
                    <option value="salary">Salary</option>
                    <option value="freelance">Freelance</option>
                    <option value="others">Others</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Description</label>
                  <input
                    type="text"
                    value={editingTransaction.description}
                    onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-black placeholder-gray-600"
                    placeholder="Transaction description"
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200 w-full"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Add New Transaction</h3>
                <button
                  onClick={() => setShowAddTransaction(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <span className="text-lg">✕</span>
                </button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const type = formData.get('type') as 'income' | 'expense';
                const amount = parseFloat(formData.get('amount') as string);
                const category = formData.get('category') as string;
                const description = formData.get('description') as string;
                
                try {
                  if (user) {
                    await saveTransaction(user.id, amount, category, type, description);
                    await loadTransactions();
                    setShowAddTransaction(false);
                  }
                } catch (error) {
                  console.error('Error adding transaction:', error);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Type</label>
                  <select
                    name="type"
                    defaultValue="expense"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-black"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Amount (₹)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-black placeholder-gray-600"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Category</label>
                  <select
                    name="category"
                    defaultValue="others"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-black"
                  >
                    <option value="food">Food</option>
                    <option value="transport">Transport</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="shopping">Shopping</option>
                    <option value="rent">Rent</option>
                    <option value="salary">Salary</option>
                    <option value="freelance">Freelance</option>
                    <option value="others">Others</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Description</label>
                  <input
                    name="description"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors duration-200 text-black placeholder-gray-600"
                    placeholder="What was this transaction for?"
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full"
                  >
                    Add Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTransaction(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200 w-full"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
