import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css"; 
import { ReferrerTracker } from "@/app/ReferrerTracker";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Using Next.js's generateMetadata to have more control over meta tags
export async function generateMetadata() {
  return {
    title: " Buy memecoins with 1-click from Twitter!",
    description: "Use any EVM wallet to buy your favorite memecoin from any EVM chain! Trade and refer others to earn Winks points.",
    // Twitter specific meta tags
    other: {
      'twitter:card': 'player',
      'twitter:site': '@winksdotfun',
      'twitter:title': ' Buy memecoins with 1-click from Twitter!',
      'twitter:description': 'Use any EVM wallet to buy your favorite memecoin from any EVM chain! Trade and refer others to earn Winks points.',
      'twitter:player': 'https://buymemes.winks.fun',
      'twitter:player:width': '360',
      'twitter:player:height': '560',
      'twitter:image': 'https://res.cloudinary.com/dvddnptpi/image/upload/v1739442596/rq0wjymypjel3pg6xziu.png',
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReferrerTracker />
        {children}
      </body>
    </html>
  );
}