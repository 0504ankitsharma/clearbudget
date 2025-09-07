import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignedIn,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ClearBudget - Personal Finance Tracker',
  description: 'AI-powered personal finance tracker',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#4f46e5',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          borderRadius: '0.5rem',
          fontFamily: 'inherit',
        },
        elements: {
          formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-sm normal-case shadow-sm transition-all duration-200 ease-in-out",
          footerActionLink: "text-indigo-600 hover:text-indigo-700 font-medium",
          card: "shadow-xl border-0 rounded-lg",
          headerTitle: "text-indigo-600 font-bold text-2xl",
          headerSubtitle: "text-gray-600",
          socialButtonsBlockButton: "border-gray-300 hover:border-gray-400 transition-colors duration-200",
          formFieldInput: "rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
          dividerLine: "bg-gray-200",
          dividerText: "text-gray-500 text-sm",
          formButtonReset: "text-indigo-600 hover:text-indigo-700",
          alertText: "text-red-600",
          identityPreviewText: "text-gray-700",
          identityPreviewEditButton: "text-indigo-600 hover:text-indigo-700",
        }
      }}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning={true}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}