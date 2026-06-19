import { useState } from 'react';
import { LayoutDashboard, Building2, Users, DollarSign, Wrench } from 'lucide-react';
import Dashboard  from './pages/Dashboard';
import Properties from './pages/Properties';
import Tenants    from './pages/Tenants';
import Rental     from './pages/Rental';
import Works      from './pages/Works';
import Toast      from './components/Toast';
import './index.css';

const NAV = [
  { id:'dashboard',   label:'Dashboard', icon:LayoutDashboard, page:Dashboard  },
  { id:'properties',  label:'Properties',icon:Building2,        page:Properties },
  { id:'tenants',     label:'Tenants',   icon:Users,            page:Tenants    },
  { id:'rental',      label:'Rental',    icon:DollarSign,       page:Rental     },
  { id:'works',       label:'Works',     icon:Wrench,           page:Works      },
];

export default function App() {
  const [active, setActive] = useState('dashboard');
  const current = NAV.find(n => n.id === active);
  const Page = current.page;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{maxWidth:'480px',margin:'0 auto'}}>
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <Page key={active} />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40"
           style={{maxWidth:'480px', margin:'0 auto', left:'50%', transform:'translateX(-50%)', paddingBottom:'env(safe-area-inset-bottom,0px)'}}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const on = active === id;
          return (
            <button key={id} onClick={() => setActive(id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${on ? 'text-blue-600' : 'text-gray-400'}`}>
              <Icon size={21} strokeWidth={on ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold leading-none`}>{label}</span>
            </button>
          );
        })}
      </nav>

      <Toast />
    </div>
  );
}
