import Navbar from '../components/navigation/Navbar';
import Footer from '../components/navigation/Footer';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary overflow-x-hidden">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
