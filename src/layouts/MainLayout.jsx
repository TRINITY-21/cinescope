import Footer from '../components/navigation/Footer';
import Navbar from '../components/navigation/Navbar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent-peach focus:text-bg-primary focus:font-semibold focus:outline-none"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
