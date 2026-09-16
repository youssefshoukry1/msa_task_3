import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar/Navbar";
import Footer from "./Footer/Footer";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  style: "normal",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Mowix – Unabhängige Immobilienfinanzierung",
  description: "Individuelle Finanzierungslösungen und unabhängiger Bankenvergleich in Österreich.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={`${manrope.variable} ${playfair.variable}`}>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
