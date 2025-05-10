"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "../components/theme-provider"
import { MusicProvider } from "../contexts/music-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Study Station",
  description: "Your all-in-one platform for focused studying",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <MusicProvider>{children}</MusicProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
