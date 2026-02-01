import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ nome: string; modulo: string; funcao: string } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const info = localStorage.getItem('user_info');
    if (info) {
      const parsed = JSON.parse(info);
      setUser({
        nome: parsed.nomeCompleto,
        modulo: parsed.modulo,
        funcao: parsed.funcao
      });
    }
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // Navigation is visible for all logged in users
  const hasAccess = !!user;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-[#003366] text-white rounded-lg md:hidden shadow-lg border border-white/20"
      >
        <span className="material-symbols-outlined">
          {isMobileMenuOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed md:relative z-40 h-full bg-[#003366] text-white flex flex-col shadow-xl transition-all duration-300 overflow-hidden 
                ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} 
                ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Collapse Toggle for Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute top-6 right-2 z-30 size-8 items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            chevron_left
          </span>
        </button>

        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="h-24 flex items-center gap-3 px-6 shrink-0 z-10 overflow-hidden">
          <div className="size-10 min-w-[40px] rounded-xl bg-white flex items-center justify-center text-[#003366] shadow-lg shadow-black/10">
            <span className="material-symbols-outlined text-[24px]">hub</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap animate-in fade-in duration-500">
              <h1 className="text-white text-lg font-bold leading-none tracking-wide">CONEXÃO RAPS</h1>
              <span className="text-white/60 text-[10px] mt-1 font-medium">Painel de Gestão</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1.5 z-10">
          {!isCollapsed && (
            <div className="text-white/40 text-[11px] font-bold uppercase tracking-wider px-4 mb-2 mt-2">Menu Principal</div>
          )}

          {hasAccess && (
            <>
              {(user.modulo === 'Visualização' || user.modulo === 'Inserção e Visualização') && (
                <button
                  onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                  title={isCollapsed ? 'Dashboard' : ''}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group w-full text-left overflow-hidden ${isActive('/dashboard') ? 'bg-white/15 text-white shadow-lg shadow-black/5 ring-1 ring-white/20' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <span className="material-symbols-outlined min-w-[24px]">dashboard</span>
                  {!isCollapsed && <span className="font-medium whitespace-nowrap">Dashboard</span>}
                </button>
              )}

              {(user.modulo === 'Inserção' || user.modulo === 'Inserção e Visualização') && (
                <button
                  onClick={() => { navigate('/insertion'); setIsMobileMenuOpen(false); }}
                  title={isCollapsed ? 'Nova Inserção' : ''}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group w-full text-left overflow-hidden ${isActive('/insertion') ? 'bg-white/15 text-white shadow-lg shadow-black/5 ring-1 ring-white/20' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <span className="material-symbols-outlined min-w-[24px]">add_circle</span>
                  {!isCollapsed && <span className="font-medium whitespace-nowrap">Nova Inserção</span>}
                </button>
              )}
            </>
          )}

          <div className="mt-auto"></div>

          <button
            onClick={() => {
              localStorage.removeItem('user_info');
              navigate('/');
            }}
            title={isCollapsed ? 'Sair' : ''}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all w-full text-left mt-4 group overflow-hidden"
          >
            <span className="material-symbols-outlined min-w-[24px]">logout</span>
            {!isCollapsed && <span className="font-medium whitespace-nowrap transition-all duration-300">Sair do Sistema</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20 z-10 overflow-hidden">
          <div className="flex items-center gap-3 w-full">
            <div className="size-10 min-w-[40px] rounded-full bg-cover bg-center border-2 border-white/20 shadow-md bg-white flex items-center justify-center text-[#003366] font-bold">
              {user?.nome ? user.nome.charAt(0) : 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1 overflow-hidden animate-in fade-in duration-500">
                <span className="text-sm font-bold text-white leading-tight break-words overflow-visible" title={user?.nome || 'Usuário'}>
                  {user?.nome || 'Usuário Logado'}
                </span>
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider truncate">
                  {user?.funcao || 'Acesso'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
