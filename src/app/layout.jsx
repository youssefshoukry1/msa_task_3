import { Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar/Navbar";
import Footer from "./Footer/Footer";

// The only font the Mowix CSS uses; referenced there as var(--font-montserrat).
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Mowix – Unabhängige Immobilienfinanzierung",
  description: "Individuelle Finanzierungslösungen und unabhängiger Bankenvergleich in Österreich.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={montserrat.variable}>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
