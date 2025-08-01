import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "IEEE SUSTech Student Branch",
  description: "Official Volunteer Web Application for the IEEE SUSTech Student Branch",
  keywords: ['IEEE Sudan University of Science and Technology Student Branch', 'IEEE Sudan University of Science and Technology', 'IEEE SUSTech Student Branch', 'IEEE SUSTech', 'IEEE Student Branch', 'IEEE', 'SUSTech', 'Student', 'Student Branch'],
  icons: [{ rel: "icon", url: "/favicon2.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-[url('/background.jpg')]">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html >
  );
}
