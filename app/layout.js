import { IBM_Plex_Sans, Sora } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display"
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata = {
  title: "Minimay",
  description: "Dashboard produksi Minimay"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${sora.variable} ${plex.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
