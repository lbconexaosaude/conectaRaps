import React, { useState, useEffect, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import Sidebar from './Sidebar';
import { api } from '../../services/api';

const libraries: ("places" | "visualization")[] = ['places', 'visualization'];

const InsertionForm: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [bairrosZonas, setBairrosZonas] = useState<Record<string, string[]>>({});
    const [patientNames, setPatientNames] = useState<string[]>([]);
    const [msg, setMsg] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        id: '',
        nome: '',
        nascimento: '',
        idade: '',
        sexo: '',
        endereco: '',
        numero: '',
        bairro: '',
        zona: '',
        loc: '', // lat, lng
        ref: '',
        diag: '',
        reinc: '',
        med: 'Sim',
        pq_med: '',
        fam: 'Sim',
        pq_fam: '',
        raps: 'Não',
        info: ''
    });



    // Load initial data (bairros)
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await api.carregarBairros();
                setBairrosZonas(data.bairros);
                setPatientNames(data.nomes);
            } catch (e) {
                console.error("Erro ao carregar dados iniciais", e);
            }
        };
        loadData();
    }, []);

    const addressInputRef = useRef<HTMLInputElement>(null);



    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyBWQmTwPhctTH66wTRaiPUsmGaf6rpyRqE",
        libraries,
        language: 'pt-BR',
        region: 'br'
    });

    // Initialize Google Maps Autocomplete
    useEffect(() => {
        if (isLoaded && addressInputRef.current && (window as any).google) {
            const google = (window as any).google;

            // Bounds for Boa Vista, Roraima
            const boaVistaBounds = {
                north: 2.95,
                south: 2.70,
                east: -60.60,
                west: -60.80
            };

            const options = {
                bounds: boaVistaBounds,
                componentRestrictions: { country: "br" },
                fields: ["address_components", "geometry", "name"],
                strictBounds: false
            };

            try {
                const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, options);

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place.address_components) return;

                    let newAddr = '';
                    let newNum = '';
                    let newBairro = '';
                    let newCity = '';

                    place.address_components.forEach((c: any) => {
                        const type = c.types;
                        if (type.includes("route")) newAddr = c.long_name.toUpperCase();
                        if (type.includes("street_number")) newNum = c.long_name.toUpperCase();
                        // Try multiple types for 'Bairro'
                        if (type.includes("sublocality") || type.includes("sublocality_level_1") || type.includes("neighborhood")) {
                            newBairro = c.long_name.toUpperCase();
                        }
                        if (type.includes("administrative_area_level_2")) {
                            newCity = c.long_name.toUpperCase();
                        }
                    });

                    // Fallback to name if route is missing but name exists (e.g. business name as address)
                    if (!newAddr && place.name) {
                        newAddr = place.name.toUpperCase();
                    }

                    const latLng = place.geometry?.location ? `${place.geometry.location.lat()}, ${place.geometry.location.lng()}` : '';

                    setFormData(prev => {
                        const updated = {
                            ...prev,
                            endereco: newAddr,
                            numero: newNum,
                            loc: latLng
                        };

                        // Logic to auto-select Bairro if it matches our list
                        if (newBairro) {
                            // First, try direct match
                            let finalBairro = '';
                            let foundZone = '';

                            // Normalize function for comparison
                            const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

                            for (const [zona, bairrosList] of Object.entries(bairrosZonas)) {
                                const bairros = bairrosList as string[];
                                const normalizedNewBairro = normalize(newBairro);

                                // Findings: Direct match, Includes, or Normalized match
                                const match = bairros.find(b =>
                                    b === newBairro ||
                                    normalize(b) === normalizedNewBairro ||
                                    newBairro.includes(b) || // Google: "Bairro Treze de Setembro" -> System: "13 DE SETEMBRO"? (Hard)
                                    b.includes(newBairro)
                                );

                                if (match) {
                                    finalBairro = match;
                                    foundZone = zona;
                                    break;
                                }
                            }

                            if (finalBairro) {
                                updated.bairro = finalBairro;
                                updated.zona = foundZone;
                            } else {
                                // If google returns a Bairro we don't have, maybe prompt user or leave empty?
                                // User asked to "fix" it visually. Let's just set what we found, even if not in list (user can correct)
                                // But select assumes value is in list.
                                // If not in list, it won't show in select unless we add it or just let it be blank.
                                // Let's try to set it, if it fails to valid option, select might show empty.
                                // Better: Only set if matched.
                            }
                        }
                        return updated;
                    });
                });
                addressInputRef.current?.setAttribute('autocomplete', 'off');
            } catch (e) {
                console.error("Erro ao inicializar Google Maps:", e);
            }
        }
    }, [isLoaded, bairrosZonas]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        // Special handling for uppercase text inputs
        const val = (e.target.tagName === 'INPUT' && e.target.type === 'text') || e.target.tagName === 'TEXTAREA' ? value.toUpperCase() : value;

        setFormData(prev => {
            const newData = { ...prev, [id]: val };

            // Auto-calculate age
            if (id === 'nascimento' && val) {
                const hoje = new Date();
                const nasc = new Date(val);
                let idade = hoje.getFullYear() - nasc.getFullYear();
                const m = hoje.getMonth() - nasc.getMonth();
                if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) { idade--; }
                newData.idade = idade.toString();

                // Trigger search when birth date is selected
                checkPatient(newData.nome, val);
            }

            // Auto-zone
            if (id === 'bairro') {
                for (const [zona, bairrosList] of Object.entries(bairrosZonas)) {
                    const bairros = bairrosList as string[];
                    if (bairros.includes(val)) {
                        newData.zona = zona;
                        break;
                    }
                }
            }

            return newData;
        });
    };

    const [foundPatient, setFoundPatient] = useState<any>(null);

    const checkPatient = async (nome: string, nascimento: string) => {
        if (!nome || !nascimento) return;
        try {
            const data = await api.verificarPaciente(nome, nascimento);
            if (data.result === 'exists') {
                setFoundPatient(data.p);
                setMsg({ type: 'info', text: '📋 Histórico encontrado! Deseja carregar os dados?' });
            } else {
                setFoundPatient(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadPatientHistory = () => {
        if (!foundPatient) return;
        const p = foundPatient;
        setFormData(prev => {
            const updated = {
                ...prev,
                sexo: p.sexo || prev.sexo,
                endereco: p.endereco || prev.endereco,
                numero: p.num || prev.numero,
                bairro: p.bairro || prev.bairro,
                localizacao: p.loc || prev.loc,
                referencia: p.ref || prev.referencia,
                diagnosticado: p.diag || prev.diagnosticado,
                reincidente: 'SIM'
            };

            // Recalc zone
            if (p.bairro) {
                for (const [zona, bairrosList] of Object.entries(bairrosZonas)) {
                    const bairros = bairrosList as string[];
                    if (bairros.includes(p.bairro)) {
                        updated.zona = zona;
                        break;
                    }
                }
            }
            return updated;
        });
        setMsg({ type: 'success', text: '✅ Dados carregados com sucesso!' });
        setTimeout(() => setMsg(null), 3000);
        setFoundPatient(null);
    };

    const handleBlurName = () => {
        checkPatient(formData.nome, formData.nascimento);
    };

    const handleGetGPS = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(p => {
                setFormData(prev => ({ ...prev, loc: `${p.coords.latitude}, ${p.coords.longitude}` }));
            });
        } else {
            alert("Geolocalização não suportada.");
        }
    };

    const handleSubmit = async () => {
        if (!formData.nome) {
            alert("Nome é obrigatório!");
            return;
        }
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
            const payload = {
                id_paciente: formData.id,
                nome: formData.nome,
                nascimento: formData.nascimento,
                sexo: formData.sexo,
                idade: formData.idade,
                endereco: formData.endereco,
                numero: formData.numero,
                bairro: formData.bairro,
                zona: formData.zona,
                localizacao: formData.loc,
                referencia: formData.ref,
                diagnosticado: formData.diag,
                reincidente: formData.reinc,
                medicacao: formData.med,
                pq_med: formData.pq_med,
                apoio_fam: formData.fam,
                porque_fam: formData.pq_fam,
                apoio_raps: formData.raps,
                info_extra: formData.info,
                responsavel: userInfo.nomeCompleto || 'Desconhecido'
            };

            const data = await api.salvarSamu(payload);
            if (data.result === 'success') {
                setMsg({ type: 'success', text: '✅ Registro salvo com sucesso!' });
                // Reset form or redirect? Original reloads.
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setMsg({ type: 'error', text: 'Erro ao salvar.' });
            }

        } catch (e) {
            setMsg({ type: 'error', text: 'Erro de conexão.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#f3f4f6] dark:bg-background-dark overflow-hidden font-body">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto p-4 md:p-8">

                <div className="max-w-4xl mx-auto w-full bg-white dark:bg-card-dark rounded-xl shadow-card border-t-[6px] border-brand-dark p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-white text-center mb-1">Ficha de Atendimento SAMU</h2>
                    <p className="text-center text-gray-500 text-sm mb-8">Preencha os dados com atenção</p>

                    {msg && (
                        <div className={`mb-6 p-4 rounded-lg text-center font-medium ${msg.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                            msg.type === 'info' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                            {msg.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Nome */}
                        <div>
                            <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1 flex justify-between items-center">
                                Nome do Paciente
                                {foundPatient && (
                                    <button
                                        type="button"
                                        onClick={loadPatientHistory}
                                        className="text-brand-medium hover:text-brand-dark flex items-center gap-1 text-[11px] animate-pulse bg-brand-light/20 px-2 py-0.5 rounded-full"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">history</span>
                                        CARREGAR ÚLTIMOS DADOS?
                                    </button>
                                )}
                            </label>
                            <input
                                type="text"
                                id="nome"
                                list="lista-nomes"
                                value={formData.nome}
                                onChange={handleChange}
                                onBlur={handleBlurName}
                                placeholder="NOME COMPLETO"
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium focus:border-transparent uppercase"
                            />
                            <datalist id="lista-nomes">
                                {patientNames.map((n, i) => <option key={i} value={n} />)}
                            </datalist>
                        </div>

                        {/* ID & Nascimento Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">ID (Auto)</label>
                                <input type="text" id="id" value={formData.id} readOnly placeholder="Gerado automaticamente" className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Data de Nascimento</label>
                                <input type="date" id="nascimento" value={formData.nascimento} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium" />
                            </div>
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Idade (Auto)</label>
                                <input type="text" id="idade" value={formData.idade} readOnly className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500" />
                            </div>
                        </div>

                        {/* Sexo */}
                        <div>
                            <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Sexo</label>
                            <select id="sexo" value={formData.sexo} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium">
                                <option value="">Selecione</option>
                                <option>Masculino</option>
                                <option>Feminino</option>
                            </select>
                        </div>

                        {/* Endereço Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Endereço (Busca Google Maps)</label>
                                <input
                                    ref={addressInputRef}
                                    type="text"
                                    id="endereco"
                                    value={formData.endereco}
                                    onChange={handleChange}
                                    placeholder="DIGITE A RUA OU LOCAL..."
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Número</label>
                                <input type="text" id="numero" value={formData.numero} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium uppercase" />
                            </div>
                        </div>

                        {/* Bairro & Zona */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Bairro</label>
                                <select id="bairro" value={formData.bairro} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium">
                                    <option value="">Selecione o Bairro</option>
                                    {Object.entries(bairrosZonas).map(([zona, bairrosList]) => {
                                        const bairros = bairrosList as string[];
                                        return (
                                            <optgroup key={zona} label={zona}>
                                                {bairros.map(b => <option key={b} value={b}>{b}</option>)}
                                            </optgroup>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Zona (Automática)</label>
                                <input type="text" id="zona" value={formData.zona} readOnly className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500" placeholder="Selecione o bairro" />
                            </div>
                        </div>

                        {/* GPS & Localização */}
                        <div className={`p-4 rounded-lg border border-dashed transition-colors ${formData.loc ? 'bg-green-50 border-green-300 dark:bg-green-900/10 dark:border-green-800' : 'bg-gray-50 border-gray-300 dark:bg-slate-800/50 dark:border-gray-600'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm">
                                    Localização (Coordenadas)
                                </label>
                                {formData.loc && (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full animate-pulse">
                                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                        GEOCODIFICADO
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="loc"
                                    value={formData.loc}
                                    readOnly
                                    placeholder="Aguardando endereço ou GPS..."
                                    className={`w-full p-2.5 border rounded-lg text-sm transition-colors ${formData.loc ? 'bg-white border-green-400 text-green-800 font-medium' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                                />
                                <button
                                    onClick={handleGetGPS}
                                    className="bg-brand-medium hover:bg-brand-dark text-white px-4 rounded-lg shadow-sm transition-colors"
                                    title="Usar minha localização atual"
                                >
                                    <span className="material-symbols-outlined">my_location</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 pl-1">
                                * Preechido automaticamente ao selecionar um endereço válido ou clicar no ícone de GPS.
                            </p>
                        </div>

                        {/* Ponto de ref */}
                        <div>
                            <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Ponto de Referência</label>
                            <input type="text" id="ref" value={formData.ref} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium uppercase" />
                        </div>

                        {/* Diagnostico & Reincidente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Já é Diagnosticado?</label>
                                <select id="diag" value={formData.diag} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium">
                                    <option value="">Selecione</option>
                                    <option>Não</option>
                                    <option>Sim</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Reincidente?</label>
                                <select id="reinc" value={formData.reinc} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium">
                                    <option value="">Selecione</option>
                                    <option>Não</option>
                                    <option>Sim</option>
                                </select>
                            </div>
                        </div>

                        {/* Medicação */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Utiliza Medicação?</label>
                                <select id="med" value={formData.med} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium">
                                    <option>Sim</option>
                                    <option>Não</option>
                                </select>
                            </div>
                            {formData.med === 'Não' && (
                                <div>
                                    <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Se não, por quê?</label>
                                    <input type="text" id="pq_med" list="sugestoes-negativa" value={formData.pq_med} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium uppercase" placeholder="Selecione ou escreva..." />
                                </div>
                            )}
                        </div>

                        {/* Apoio Fam */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Tem Apoio Familiar?</label>
                                <select id="fam" value={formData.fam} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium">
                                    <option>Sim</option>
                                    <option>Não</option>
                                </select>
                            </div>
                            {formData.fam === 'Não' && (
                                <div>
                                    <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Se não, por quê?</label>
                                    <input type="text" id="pq_fam" list="sugestoes-negativa" value={formData.pq_fam} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium uppercase" placeholder="Selecione ou escreva..." />
                                </div>
                            )}
                        </div>

                        <datalist id="sugestoes-negativa">
                            <option value="NEGATIVA DE UTILIZAÇÃO" />
                            <option value="PRIMEIRO SURTO" />
                            <option value="OUTRO" />
                        </datalist>

                        {/* RAPS */}
                        <div>
                            <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Tem Apoio da RAPS?</label>
                            <select id="raps" value={formData.raps} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium">
                                <option>Não</option>
                                <option>Sim</option>
                            </select>
                        </div>

                        {/* Info */}
                        <div>
                            <label className="block text-brand-dark dark:text-white font-semibold text-sm mb-1">Demais Informações</label>
                            <textarea id="info" rows={4} value={formData.info} onChange={handleChange} placeholder="Detalhes relevantes..." className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium uppercase"></textarea>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-brand-dark hover:bg-brand-medium text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'PROCESSANDO...' : 'SALVAR NO BANCO DE DADOS'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsertionForm;