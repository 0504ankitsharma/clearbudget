'use client';
import { SignUp } from "@clerk/nextjs";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SignUpPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-green-400 to-blue-400 rounded-full opacity-10 animate-bounce" style={{animationDuration: '4s'}}></div>
      </div>

      <div className="relative z-10 flex flex-col justify-center py-12 sm:px-6 lg:px-8 min-h-screen">
        {/* Header Section */}
        <div className={`sm:mx-auto sm:w-full sm:max-w-md transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl transform -rotate-6 hover:rotate-6 transition-transform duration-300 shadow-xl flex items-center justify-center">
                  <span className="text-3xl">🎆</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-sm">🚀</span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Join ClearBudget!
            </h1>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Start Your Journey</h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              🎓 Perfect for students! Create your free account and take control of your finances today.
            </p>
          </div>
        </div>

        {/* Sign Up Card */}
        <div className={`sm:mx-auto sm:w-full sm:max-w-md transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-white/80 backdrop-blur-lg py-10 px-8 shadow-2xl rounded-3xl border border-white/20 hover:shadow-3xl transition-all duration-300">
            <SignUp 
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              redirectUrl="/dashboard"
              afterSignUpUrl="/dashboard"
              appearance={{
                elements: {
                  card: "shadow-none border-0 bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "w-full justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-indigo-300 transition-all duration-200 transform hover:scale-[1.02]",
                  socialButtonsBlockButtonText: "text-gray-700 font-semibold",
                  formButtonPrimary: "w-full justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-[1.02]",
                  formFieldInput: "mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white",
                  formFieldLabel: "block text-sm font-semibold text-gray-700 mb-2",
                  footerActionLink: "font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200",
                  dividerLine: "bg-gray-300",
                  dividerText: "text-gray-500 text-sm px-2 font-medium",
                  alertText: "text-red-600 text-sm font-medium",
                  formButtonReset: "text-indigo-600 hover:text-indigo-500 font-semibold",
                  formFieldSuccessText: "text-green-600 text-sm font-medium",
                  formFieldWarningText: "text-yellow-600 text-sm font-medium",
                  formFieldAction__password: "text-indigo-600 hover:text-indigo-500 font-semibold text-sm",
                }
              }}
            />
          </div>
          
          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>🔒 100% Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>🎓 Student Friendly</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>✨ Always Free</span>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-100">
              <p className="text-sm text-gray-600">
                Already part of the ClearBudget family?{' '}
                <Link 
                  href="/sign-in" 
                  className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors duration-200 hover:underline"
                >
                  🚀 Sign in to your account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
