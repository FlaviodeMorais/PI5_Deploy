import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt'
    },
    {
      href: '/settings',
      label: 'Configurações',
      icon: 'fas fa-cogs'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
      <div className="bg-[#0f172a] w-64 h-full p-6 overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-6">
          <div className="flex flex-col">
            <div className="mb-2">
              <img 
                src="https://univesp.br/sites/527174b7b24a527adc000002/assets/590b74fa9caf4d3c61001001/Univesp_logo_png_rgb.png" 
                alt="UNIVESP Logo" 
                className="h-16 object-contain w-auto"
              />
            </div>
            <div className="flex items-center gap-3">
              <i className="fas fa-water text-2xl text-blue-500"></i>
              <h1 className="text-xl font-semibold">Aquaponia</h1>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <div key={item.href} className="w-full">
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md cursor-pointer", 
                    location === item.href 
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  )}
                  onClick={onClose}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </div>
              </Link>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
