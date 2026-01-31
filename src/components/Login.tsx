import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGIN_BG_PATTERN } from '../constants';
import { api } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Registration fields
  const [regData, setRegData] = useState({
    nomeCompleto: '',
    cpf: '',
    matricula: '',
    funcao: '',
    usuario: '',
    senha: '',
    confirmarSenha: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setRegData(prev => ({ ...prev, [id]: value }));
  };

  const validateCpf = (cpf: string) => {
    return cpf.replace(/\D/g, '').length === 11;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Preencha todos os campos!");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await api.login(username, password);

      if (data.result === 'success') {
        localStorage.setItem('user_info', JSON.stringify({
          nomeCompleto: data.nomeCompleto,
          modulo: data.modulo
        }));
        setSuccess(data.message || 'Login realizado com sucesso!');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError(data.message || 'Erro ao realizar login');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Object.values(regData).some(val => !val)) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (!validateCpf(regData.cpf)) {
      setError("O CPF deve conter 11 dígitos.");
      return;
    }

    if (regData.senha !== regData.confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const result = await api.registrar(regData);
      if (result.result === 'success') {
        setSuccess(result.message);
        setTimeout(() => {
          setIsLogin(true);
          setSuccess('');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erro ao processar o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden items-center justify-center bg-background-light dark:bg-background-dark py-12 px-4">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-5%] h-[600px] w-[600px] rounded-full bg-brand-medium/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-brand-accent/10 blur-[100px] pointer-events-none"></div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `url('${LOGIN_BG_PATTERN}')`, maskImage: 'linear-gradient(to bottom, white, transparent)' }}
      ></div>

      <div className="layout-container relative z-10 flex w-full max-w-[500px] flex-col items-center">
        <div className="w-full rounded-3xl bg-card-light dark:bg-card-dark shadow-2xl border border-white/50 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden transition-all duration-500">

          <div className="flex flex-col items-center px-8 pt-10 pb-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-light to-white shadow-md border border-brand-light dark:from-slate-700 dark:to-slate-800 dark:border-slate-600 group transition-all duration-300">
              <span className="material-symbols-outlined text-brand-medium dark:text-brand-accent transition-transform duration-300 group-hover:rotate-12" style={{ fontSize: '32px' }}>
                health_metrics
              </span>
            </div>
            <h1 className="text-brand-dark dark:text-white text-2xl font-black tracking-tight mb-1">CONECTA RAPS</h1>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-semibold uppercase tracking-widest opacity-80">Saúde & Tecnologia</p>
          </div>

          <div className="flex px-8 mb-4">
            <div className="flex w-full bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
              <button
                onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-medium dark:text-brand-accent' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Login
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${!isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-medium dark:text-brand-accent' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Registrar
              </button>
            </div>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4 px-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase" htmlFor="username">Usuário</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-slate-400 group-focus-within:text-brand-medium transition-colors">person</span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu usuário"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-medium/5 outline-none transition-all uppercase font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase" htmlFor="password">Senha</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-slate-400 group-focus-within:text-brand-medium transition-colors">lock</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full h-12 pl-12 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-medium/5 outline-none transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-medium"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold text-center animate-shake">{error}</div>}
              {success && <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-xl text-xs font-bold text-center animate-bounce-short">{success}</div>}

              <button
                disabled={loading}
                type="submit"
                className="h-12 w-full mt-2 rounded-xl bg-brand-medium text-white font-bold shadow-lg shadow-brand-medium/20 hover:bg-brand-dark hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                  <>Acessar Painel <span className="material-symbols-outlined text-[18px]">login</span></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-3 px-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[450px] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1" htmlFor="nomeCompleto">Nome Completo</label>
                  <input id="nomeCompleto" value={regData.nomeCompleto} onChange={handleInputChange} className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1" htmlFor="cpf">CPF (Números)</label>
                    <input id="cpf" maxLength={11} value={regData.cpf} onChange={handleInputChange} className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium" placeholder="00000000000" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1" htmlFor="matricula">Matrícula</label>
                    <input id="matricula" value={regData.matricula} onChange={handleInputChange} className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1" htmlFor="funcao">Função / Cargo</label>
                  <input id="funcao" value={regData.funcao} onChange={handleInputChange} className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1" htmlFor="usuario">Nome de Usuário</label>
                  <input id="usuario" value={regData.usuario} onChange={handleInputChange} className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1" htmlFor="senha">Nova Senha</label>
                    <input id="senha" type="password" value={regData.senha} onChange={handleInputChange} className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1" htmlFor="confirmarSenha">Confirmar</label>
                    <input id="confirmarSenha" type="password" value={regData.confirmarSenha} onChange={handleInputChange} className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium" />
                  </div>
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold text-center mt-2">{error}</div>}
              {success && <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-xl text-xs font-bold text-center mt-2">{success}</div>}

              <button
                disabled={loading}
                type="submit"
                className="h-12 w-full mt-4 rounded-xl bg-brand-medium text-white font-bold shadow-lg shadow-brand-medium/20 hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Criar Minha Conta"}
              </button>
            </form>
          )}

          <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/50 px-8 py-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Desenvolvido por <span className="text-brand-medium dark:text-brand-accent">Lucivaldo Oliveira Barroso</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
