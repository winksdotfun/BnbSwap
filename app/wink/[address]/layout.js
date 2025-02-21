// app/wink/[address]/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import { Providers } from "@/app/providers";
import { ReferrerTracker } from "@/app/ReferrerTracker";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }) {
  const url = typeof window !== 'undefined' ? window.location.href : '';


  console.log("Current URL:", url);
  const baseUrl = "https://buymemes.winks.fun";
  const {address} = await params;

  console.log("baseUrl", baseUrl);
  console.log("address", address);
  console.log("params", address);

  const playerUrl = `${baseUrl}/wink/${address}`;

  return {
    title: " Buy memecoins with 1-click from Twitter!",
    description: "Use any EVM wallet to buy your favorite memecoin from any EVM chain! Trade and refer others to earn Winks points.",
    metadataBase: new URL(baseUrl),
    other: {
      "twitter:card": "player",
      "twitter:site": "@winksdotfun",
      "twitter:title": " Buy memecoins with 1-click from Twitter!",
      "twitter:description": "Use any EVM wallet to buy your favorite memecoin from any EVM chain! Trade and refer others to earn Winks points.",
      "twitter:player": `${playerUrl}`,
      "twitter:player:width": "360",
      "twitter:player:height": "560",
      "twitter:image":
        "https://res.cloudinary.com/dvddnptpi/image/upload/v1739442596/rq0wjymypjel3pg6xziu.png",
    },
  };
}

export default function AddressLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ReferrerTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}