import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'For Himanshi 🌸',
  description: 'Something special awaits... 💝',
  openGraph: {
    title: 'For Himanshi 🌸',
    description: 'Something special awaits... 💝',
    url: 'https://hxn.life',
    siteName: 'hxn.life',
    images: [
      {
        url: 'https://hxn.life/og-image.png',
        width: 1200,
        height: 630,
        alt: 'For Himanshi - Something special awaits',
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/cats/cat1.png" as="image" />
        <link rel="preload" href="/cats/cat2.png" as="image" />
        <link rel="preload" href="/cats/cat3.png" as="image" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
