import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skimbox - Email-First X Bookmarks Resurfacer',
  description: 'Your X bookmarks, delivered daily. Plain text emails with 5-10 bookmarks, one-tap actions to pin, hide, pause, or get more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
