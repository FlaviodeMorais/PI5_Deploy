import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileMenu } from '../dashboard/MobileMenu';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-[#071427] text-white overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Mobile menu overlay */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#081a33] to-[#071427] -z-10"></div>
        
        {/* Efeito de partículas/bolhas sutis (simulado com elementos posicionados) */}
        <div className="absolute inset-0 overflow-hidden -z-5 opacity-10 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-blue-400/20"
              style={{
                width: `${Math.random() * 8 + 4}rem`,
                height: `${Math.random() * 8 + 4}rem`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: 'blur(8px)',
                animation: `float ${Math.random() * 10 + 20}s infinite ease-in-out`,
                opacity: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
        
        <Header onMenuClick={toggleMobileMenu} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
