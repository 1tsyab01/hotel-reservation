import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import Navbar from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lumière Grand Hotel — Luxury Stays',
  description: 'Experience unparalleled luxury at Lumière Grand Hotel. Book your perfect room with breathtaking views, world-class amenities, and exceptional service.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0A0A0A] text-white min-h-screen`}>
        <Navbar />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
