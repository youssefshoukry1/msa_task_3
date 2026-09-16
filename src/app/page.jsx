import MowixHeader from "./components/mowix/MowixHeader";
import Hero from "./components/mowix/Hero";
import Stats from "./components/mowix/Stats";
import Services from "./components/mowix/Services";
import About from "./components/mowix/About";
import ParallaxBand from "./components/mowix/ParallaxBand";
import Process from "./components/mowix/Process";
import Projects from "./components/mowix/Projects";
import Testimonials from "./components/mowix/Testimonials";
import Cta from "./components/mowix/Cta";
import Blog from "./components/mowix/Blog";
import MowixFooter from "./components/mowix/MowixFooter";
import ElementorFrontend from "./components/mowix/frontend/ElementorFrontend";

export const metadata = {
  title: "Mowix – Unabhängige Immobilienfinanzierung in Österreich",
  description: "Persönliche Beratung, unabhängiger Bankenvergleich und maßgeschneiderte Finanzierungslösungen für Ihre Immobilie in Österreich.",
  icons: {
    icon: [
      { url: "/mowix/images/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/mowix/images/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/mowix/images/brand/apple-touch-icon.png",
  },
};

export default function Home() {
  return (
    // elementor-kit-3 scopes the site's global colors, typography and element styles to this page
    <div className="elementor-kit-3">
      <a className="skip-link screen-reader-text" href="#content">Zum Inhalt springen</a>
      <MowixHeader />
      <div id="content" data-elementor-type="wp-page" data-elementor-id="971" className="elementor elementor-971">
        <Hero />
        <Stats />
        <Services />
        <About />
        <ParallaxBand />
        <Process />
        <Projects />
        <Testimonials />
        <Cta />
        <Blog />
      </div>
      <MowixFooter />
      <ElementorFrontend />
    </div>
  );
}
