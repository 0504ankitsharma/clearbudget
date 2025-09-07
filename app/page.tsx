'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400 to-blue-400 rounded-full opacity-10 animate-spin" style={{animationDuration: '20s'}}></div>
      </div>

      <header className="relative z-10 bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-300">
              <span className="text-white font-bold text-xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ClearBudget
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/sign-in" 
              className="text-gray-700 hover:text-indigo-600 font-medium transition-all duration-200 hover:scale-105 px-3 py-2 rounded-lg hover:bg-white/50"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <div className="relative py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl transform rotate-6 hover:rotate-12 transition-transform duration-300 shadow-xl">
                    <div className="w-full h-full bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center">
                      <span className="text-4xl">📊</span>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-lg">✨</span>
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6">
                <span className="block bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text text-transparent mb-2">
                  Money Made
                </span>
                <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Simple
                </span>
              </h1>
              
              <p className="mt-6 max-w-3xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed">
                🎓 Perfect for students! Track expenses, manage budgets, and get AI-powered insights 
                <span className="font-semibold text-indigo-600">all in one beautiful app</span> 
                that actually makes finance fun.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
                <Link 
                  href="/sign-up" 
                  className="group relative inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-base sm:text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center">
                    🚀 Start Free Today
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                
                <Link 
                  href="#features" 
                  className="group inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 bg-white/80 backdrop-blur-lg text-gray-700 text-base sm:text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 hover:border-indigo-300 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                >
                  <span className="flex items-center">
                    💡 See Features
                  </span>
                </Link>
              </div>
              
              <div className="mt-12 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-500 px-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>100% Free for Students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>AI-Powered Insights</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Privacy First</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full mb-4">
                ✨ Student-Friendly Features
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
                Everything you need to manage your money
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Built specifically for students who want to take control of their finances without the complexity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Chat Feature */}
              <div className="group relative">
                <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-4">Chat-based Tracking</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Just type &quot;Spent 250 on lunch&quot; or &quot;Got 5000 from part-time job&quot; - our AI understands natural language!
                  </p>
                  <div className="mt-6 text-sm text-blue-600 font-medium">
                    Try: &quot;Bought coffee for 50&quot; →
                  </div>
                </div>
              </div>

              {/* Analytics Feature */}
              <div className="group relative">
                <div className="h-full bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-4">Visual Insights</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Beautiful charts and graphs that make sense of your spending patterns - no accounting degree required!
                  </p>
                  <div className="mt-6 flex space-x-2">
                    <div className="w-4 h-2 bg-purple-400 rounded"></div>
                    <div className="w-3 h-2 bg-pink-400 rounded"></div>
                    <div className="w-5 h-2 bg-indigo-400 rounded"></div>
                  </div>
                </div>
              </div>

              {/* AI Tips Feature */}
              <div className="group relative">
                <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-4">Smart AI Tips</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Get personalized suggestions to save money and build better financial habits - like having a finance buddy!
                  </p>
                  <div className="mt-6 text-sm text-green-600 font-medium">
                    💡 &quot;Try meal prepping to save ₹20,000/month&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CTA Section */}
      <div className="relative py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Ready to take control of your finances? 💪
          </h2>
          <p className="text-base sm:text-xl text-white/90 mb-8">
            Join thousands of students who are already managing their money like pros!
          </p>
          <Link 
            href="/sign-up" 
            className="inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 bg-white text-gray-900 text-base sm:text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
          >
            🎆 Start Your Financial Journey
          </Link>
        </div>
      </div>

      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">💰</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ClearBudget
              </span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 mb-2">
                Made with ❤️ for students, by{' '}
                <a 
                  href="https://www.tinyurl.com/iamankitsharma" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-200 hover:underline"
                >
                  Ankit Sharma
                </a>
              </p>
              <p className="text-sm text-gray-500">
                &copy; 2025 ClearBudget. Making finance fun since 2025.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}