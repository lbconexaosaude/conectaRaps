import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import {
  GenderPieChart, AgeBarChart, ZoneChart, NeighborhoodsChart, TrendChart, ClinicalRadarChart,
  MedicationChart, SupportChart, DiagnoseChart, RaceChart, NationalityChart
} from './Charts';
import { api } from '../../services/api';
import MapComponent from './MapComponent';
import { DashboardData } from '../../types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // Report Generator State
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');

  const generateReport = (selectedRow: any[]) => {
    // 1. Find ALL records for this patient to build history
    const pacienteNome = selectedRow[1];
    const allRecords = data?.dadosBrutos.filter((r: any[]) => r[1] === pacienteNome) || [];

    // Sort by Entry Date (Descending) to get the latest info
    // Col 19 is string date, we might need to parse it if format varies, but usually ISO or standard
    // Assuming the format from updated GAS is "dd/mm/yyyy HH:mm:ss | Por..."
    // For sorting, we can rely on ID if sequential, or just reverse the array if it comes chronological

    const historico = allRecords.map((r: any[]) => {
      // Extract data from "dd/mm/yyyy HH:mm:ss | Por: ..."
      const entradaRaw = r[19] || '';
      return {
        data: entradaRaw.split('|')[0]?.trim() || '-',
        responsavelFull: entradaRaw, // The full string "Data | Por: Nome"
        endereco: `${r[5]}, ${r[6]} - ${r[7]} (${r[8]})`, // End, Num, Bairro, Zona
        gps: r[9] || 'Não georreferenciado',
        bairro: r[7],
        zona: r[8]
      };
    });

    // Latest record (first in the list if we assume latest is last added, but safer to take the selected one or last one)
    // The `selectedRow` comes from the search, let's assume it's the one we want to base the ID details on.
    const latest = selectedRow;

    // Formatting Helpers
    const formatDate = (isoDate: string) => {
      if (!isoDate) return '-';
      try {
        // Try parsing ISO first
        const d = new Date(isoDate);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
        return isoDate; // Fallback
      } catch { return isoDate; }
    };

    // Extract Data for Report
    const nasc = formatDate(latest[2]);
    const idade = latest[4];
    const sexo = latest[3];
    const raca = latest[22] || 'NÃO INFORMADO';
    const nacionalidade = latest[23] || 'BRASILEIRO';
    const bairroAtual = latest[7];
    const zonaAtual = latest[8];
    const diag = latest[11] || 'EM ANÁLISE';

    const medicacao = latest[13]; // Sim/Não
    const motivoNaoMed = latest[14] || '-';
    const apoioFam = latest[15]; // Sim/Não
    const apoioRaps = latest[17]; // Sim/Não

    // --- LOGIC: DECISION TREE (CENÁRIOS) ---
    let analiseGestao = '';
    let corAlerta = ''; // Using emoji for visual representation in text

    const isReincidente = latest[12] === 'Sim' || historico.length > 3; // Rule provided: Reincidente = Sim OR High frequency

    if (isReincidente && apoioRaps === 'Não') {
      // CADEIA 1: Cenário Crítico (VERMELHO)
      corAlerta = '🔴 ALERTA VERMELHO';
      analiseGestao = `CADEIA 1: Cenário Crítico\n` +
        `Análise de Gestão (${corAlerta}): Identificado fenômeno de "Porta Giratória" (Reinternações Sucessivas). O sistema sinaliza falha grave na continuidade do cuidado longitudinal. Recomenda-se o Matriciamento Emergencial entre o SAMU 192 e o CAPS de referência para a repactuação do Projeto Terapêutico Singular (PTS), visando a estabilização urgente do paciente no território e a mitigação de riscos agudos.`;

    } else if (!isReincidente && (medicacao === 'Não' || apoioFam === 'Não')) {
      // CADEIA 2: Cenário Intermediário (AMARELO) (Logic: Not reincident BUT failing med or family)
      // *Note: User said "Reincidente = 'Não' (ou pouco)". I'll stick to logic !isReincidente OR frequency <= 3
      corAlerta = '🟡 ALERTA AMARELO';
      analiseGestao = `CADEIA 2: Cenário Intermediário (Alerta de Risco)\n` +
        `Análise de Gestão (${corAlerta}): Identificada instabilidade no suporte terapêutico. Embora não apresente ciclo de porta giratória, o sistema detecta fragilidade no apoio familiar e irregularidade medicamentosa. Recomenda-se Busca Ativa Preventiva pela equipe de Atenção Básica do território e vinculação ao CAPS para evitar a cronificação da reincidência e o agravamento do quadro psicossocial.`;

    } else {
      // CADEIA 3: Cenário Estável (VERDE)
      corAlerta = '🟢 ALERTA VERDE';
      analiseGestao = `CADEIA 3: Cenário Estável (Monitoramento de Rotina)\n` +
        `Análise de Gestão (${corAlerta}): Fluxo assistencial considerado dentro da normalidade. O sistema indica que o paciente possui suporte familiar e adesão ao tratamento, sugerindo que o acionamento do SAMU foi um evento isolado de crise. Recomenda-se apenas o encaminhamento de rotina via ficha de referência para atualização do PTS na unidade de origem, mantendo o monitoramento territorial padrão.`;
    }

    // Protocol Generation (Random Sequential Simulation)
    const protocoloNum = Math.floor(Math.random() * 900) + 100; // 100 to 999
    const protocolo = `REL-${protocoloNum}-${new Date().getFullYear()}`;
    const dataEmissao = new Date().toLocaleString('pt-BR');

    // Aggregate Lists
    const listaDatas = historico.map(h => h.data).join(', ');
    const listaEnderecos = historico.map((h, i) => `${i + 1}. ${h.endereco}`).join('\n');
    const listaResponsaveis = historico.map(h => `(${h.responsavelFull})`).join('\n');

    const texto =
      `📑 RELATÓRIO DE INTELIGÊNCIA E GESTÃO DE FLUXO - CONEXÃO RAPS
Protocolo: ${protocolo} | Data de Emissão: ${dataEmissao}

1. IDENTIFICAÇÃO DO PACIENTE
Nome: ${pacienteNome}
Data de Nascimento: ${nasc} (Idade: ${idade} anos)
Sexo: ${sexo} | Raça/Etnia: ${raca} | Nacionalidade: ${nacionalidade}
Território: ${bairroAtual} (Zona: ${zonaAtual})

2. ANÁLISE DE REINCIDÊNCIA (INDICADOR DE FLUXO)
Frequência: Este paciente possui ${historico.length} atendimentos registrados no sistema.
Datas de Acionamento: ${listaDatas}

Diagnóstico Principal: ${diag}

Localização Georreferenciada (Histórico de Ocorrências):
${listaEnderecos}

3. AVALIAÇÃO DE VULNERABILIDADE E SUPORTE (GARGALOS)
Adesão Terapêutica: ${medicacao} ${medicacao === 'Não' ? `(Motivo: ${motivoNaoMed})` : ''}
Suporte Social/Familiar: ${apoioFam} ${apoioFam === 'Não' ? `(Motivo: ${latest[16] || '-'})` : ''}
Vínculo com a RAPS: ${apoioRaps}

4. OBSERVAÇÕES TÉCNICAS (CAMPO)
"${latest[18] || 'Sem observações.'}"

Responsável pelo(s) registro(s):
${listaResponsaveis}

5. PARECER DE GESTÃO E CONDUTA RECOMENDADA
${analiseGestao}
`;

    setGeneratedReport(texto);
    setReportSearchTerm('');
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await api.carregarEstatisticas();
        setData(stats);
      } catch (e) {
        console.error("Erro ao carregar estatísticas", e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f3f4f6] dark:bg-background-dark">
        <div className="text-primary font-bold animate-pulse">Carregando dados RAPS...</div>
      </div>
    );
  }

  // Transform Data for Charts
  const sexData = data ? [
    { name: 'Masc', value: data.masculino },
    { name: 'Fem', value: data.feminino }
  ] : [];

  const ageData = data ? Object.entries(data.idades).map(([k, v]) => ({ name: k, value: v })) : [];
  const zoneData = data ? Object.entries(data.zonas).map(([k, v]) => ({ name: k, value: v })) : [];

  const bairroData = data ? Object.entries(data.bairros)
    .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
    .slice(0, 10)
    .map(([k, v]) => ({ name: k, value: v })) : [];

  const weeklyData = data ? Object.entries(data.dias).map(([k, v]) => ({ name: k, value: v })) : [];
  const monthlyData = data ? Object.entries(data.mensal).map(([k, v]) => ({ name: k, value: v })) : [];

  const clinicalData = data ? [
    { subject: 'Diagnóstico', A: (data.clinico.diag / data.total) * 100, fullMark: 100 },
    { subject: 'Medicação', A: (data.clinico.med / data.total) * 100, fullMark: 100 },
    { subject: 'Família', A: (data.clinico.fam / data.total) * 100, fullMark: 100 },
    { subject: 'RAPS', A: (data.clinico.raps / data.total) * 100, fullMark: 100 },
  ] : [];

  // New Data Transformations
  const medData = data ? [
    { name: 'Com Medicação', value: data.clinico.med },
    { name: 'Sem Medicação', value: data.total - data.clinico.med }
  ] : [];

  const supportData = data ? [
    { name: 'Apoio Familiar', value: data.clinico.fam },
    { name: 'Vínculo RAPS', value: data.clinico.raps }
  ] : [];

  const diagData = data ? [
    { name: 'Diagnosticados', value: data.clinico.diag },
    { name: 'Em Análise', value: data.total - data.clinico.diag }
  ] : [];

  // Calculate Race and Nationality Stats
  const raceStats = data ? data.dadosBrutos.reduce((acc: any, curr: any[]) => {
    const race = curr[22] || 'NÃO INFORMADO';
    acc[race] = (acc[race] || 0) + 1;
    return acc;
  }, {}) : {};
  const raceData = Object.entries(raceStats).map(([name, value]: any) => ({ name, value }));

  const natStats = data ? data.dadosBrutos.reduce((acc: any, curr: any[]) => {
    const nat = curr[23] || 'NÃO INFORMADO';
    acc[nat] = (acc[nat] || 0) + 1;
    return acc;
  }, {}) : {};
  const nationalityData = Object.entries(natStats).map(([name, value]: any) => ({ name, value }));


  // Filter Table
  const tableData = data ? data.dadosBrutos.filter(row =>
    row.some((cell: any) => cell && cell.toString().toLowerCase().includes(filter.toLowerCase()))
  ) : [];

  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-background-dark overflow-hidden font-display">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden w-8"></div> {/* Space for sidebar toggle */}
            <div>
              <h2 className="text-sm md:text-lg font-bold text-gray-800 dark:text-white truncate max-w-[200px] md:max-w-none">
                Dashboard de Monitoramento RAPS
              </h2>
              <div className="text-[10px] md:text-xs text-gray-500">Plataforma de Integração de Dados Assistenciais</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">Boa Vista - RR</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#f3f4f6]">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-6">

            {/* KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-[#003366] rounded-xl p-5 text-center shadow-lg text-white group relative">
                <div className="text-xs opacity-80 mb-1 uppercase tracking-wider">Atendimentos Total</div>
                <h1 className="text-3xl md:text-4xl font-bold">{data?.total || 0}</h1>
                <p className="text-[10px] mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded">Volume acumulado de intervenções pré-hospitalares em saúde mental no período vigente.</p>
              </div>
              <div className="bg-[#ED1C24] rounded-xl p-5 text-center shadow-lg text-white group relative">
                <div className="text-xs opacity-80 mb-1 uppercase tracking-wider">Taxa Reincidência</div>
                <h1 className="text-3xl md:text-4xl font-bold">{data ? Math.round((data.reincidentes / data.total) * 100) : 0}%</h1>
                <p className="text-[10px] mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded">Percentual de pacientes com múltiplos acionamentos do SAMU, indicando necessidade de revisão do Projeto Terapêutico Singular (PTS).</p>
              </div>
              <div className="bg-[#00AEEF] rounded-xl p-5 text-center shadow-lg text-white sm:col-span-2 md:col-span-1 group relative">
                <div className="text-xs opacity-80 mb-1 uppercase tracking-wider">Vínculo RAPS</div>
                <h1 className="text-3xl md:text-4xl font-bold">{data ? Math.round((data.clinico.raps / data.total) * 100) : 0}%</h1>
                <p className="text-[10px] mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded">Índice de pacientes com acompanhamento ativo na rede; valores baixos sinalizam urgência em busca ativa territorial.</p>
              </div>
            </section>

            {/* Row 1 Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-96">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Gênero</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Distribuição epidemiológica por sexo, auxiliando no planejamento de políticas de saúde específicas.</p>
                </div>
                <div className="flex-1"><GenderPieChart data={sexData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-96">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Faixa Etária</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Mapeamento geracional dos surtos; identifica grupos vulneráveis para ações preventivas focais.</p>
                </div>
                <div className="flex-1"><AgeBarChart data={ageData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-96">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Casos por Zona</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Análise da pressão assistencial por território, definindo as áreas prioritárias para matriciamento.</p>
                </div>
                <div className="flex-1"><ZoneChart data={zoneData} /></div>
              </div>
            </section>

            {/* Row 2 Charts - Diversity (New) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Raça / Etnia</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Análise da diversidade étnica atendida, essencial para a implementação de protocolos interculturais.</p>
                </div>
                <div className="flex-1"><RaceChart data={raceData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Nacionalidade</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Monitoramento do impacto dos fluxos migratórios na rede de urgência e planejamento de suporte linguístico.</p>
                </div>
                <div className="flex-1"><NationalityChart data={nationalityData} /></div>
              </div>
            </section>

            {/* Row 3 Charts - Care Analysis */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-96">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Diagnósticos</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Prevalência das principais patologias atendidas, essencial para o dimensionamento de insumos.</p>
                </div>
                <div className="flex-1"><DiagnoseChart data={diagData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-96">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Adesão à Medicação</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Indicador crítico de estabilidade; correlaciona a falta de medicamento com o aumento das crises.</p>
                </div>
                <div className="flex-1"><MedicationChart data={medData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-96">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Rede de Apoio</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Avaliação do suporte familiar e comunitário; principal preditor para o fenômeno de 'Porta Giratória'.</p>
                </div>
                <div className="flex-1"><SupportChart data={supportData} /></div>
              </div>
            </section>

            {/* Row 4 Charts - Advanced Analysis */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-96">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Volume por Bairro (Top 10)</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Identificação das manchas territoriais com maior demanda por socorro psicossocial.</p>
                </div>
                <div className="flex-1"><NeighborhoodsChart data={bairroData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-96">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">Indicadores Clínicos (Radar)</h3>
                  <p className="text-[10px] text-gray-400 mb-2 leading-tight">Visão multidimensional da estabilidade do paciente; avalia equilíbrio entre suporte clínico e social.</p>
                </div>
                <div className="flex-1"><ClinicalRadarChart data={clinicalData} /></div>
              </div>
            </section>

            {/* Table Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#003366] dark:text-white uppercase text-sm">Espelho da Planilha: DADOS SAMU</h3>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-3xl leading-tight">Visualização estruturada do banco de dados assistencial em tempo real. Esta interface permite a auditoria detalhada de cada prontuário, garantindo a rastreabilidade das informações desde o acionamento da viatura até o desfecho do atendimento.</p>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 w-full md:w-80 transition-all focus-within:ring-2 focus-within:ring-[#003366]">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
                  <input
                    type="text"
                    placeholder="Filtrar por nome, bairro, ID..."
                    className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 text-gray-700 dark:text-gray-200"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse text-[10px] whitespace-nowrap">
                  <thead className="bg-[#003366] sticky top-0 z-10 shadow-sm">
                    <tr>
                      {["ID", "NOME", "NASC", "SEXO", "IDADE", "RAÇA", "NACIONALIDADE", "BAIRRO", "ZONA", "DIAGNOSTICO", "REINCIDENTE", "MEDICACAO", "MOTIVO_NAO_MED", "APOIO_FAM", "MOTIVO_NAO_FAM", "APOIO_RAPS", "OBSERVACOES", "RESPONSÁVEL", "ENTRADA"].map(h => (
                        <th key={h} className="px-3 py-3 font-bold text-white border-b border-white/10 uppercase tracking-tighter">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tableData.filter((row: any[]) => row[0]) // Filter out rows without ID (Column A)
                      .map((row: any[], i: number) => {

                        // Format Date Helper
                        const formatDate = (dateString: string) => {
                          if (!dateString) return '-';
                          try {
                            const d = new Date(dateString);
                            if (isNaN(d.getTime())) return dateString; // Return original if not a valid date
                            return d.toLocaleDateString('pt-BR');
                          } catch { return dateString; }
                        };

                        // Mapping to original column order from Backend
                        // 0:ID, 1:Nome, 2:Nasc, 3:Sexo, 4:Idade, 5:End, 6:Num, 7:Bairro, 8:Zona, 9:GPS, 10:Ref
                        // 11:Diag, 12:Reinc, 13:Med, 14:PqMed, 15:Fam, 16:PqFam, 17:RAPS, 18:Obs, 19:DataEntrada
                        // 20:Responsavel, 21:Vazio, 22:Raca, 23:Nacionalidade

                        const displayRow = [
                          row[0], // ID
                          "****************", // Nome (Masked)
                          formatDate(row[2]), // Nasc (Formatted)
                          row[3], // Sexo
                          row[4], // Idade
                          row[22] || '-', // Raça (New)
                          row[23] || '-', // Nacionalidade (New)
                          row[7], // Bairro
                          row[8], // Zona
                          // GPS Removed
                          row[11], // Diag
                          row[12], // Reinc
                          row[13], // Med
                          row[14], // Motivo nao med
                          row[15], // Fam
                          row[16], // Motivo nao fam
                          row[17], // RAPS
                          row[18], // Obs/Info Extra
                          row[20] || 'Desconhecido', // Responsável
                          row[19] // Entrada (Timestamp - already formatted string from GAS hopefully, or raw)
                        ];

                        return (
                          <tr key={i} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                            {displayRow.map((cell, j) => (
                              <td key={j} className="px-3 py-2 border-r border-gray-50 last:border-r-0 text-gray-700 dark:text-gray-300">
                                {cell || '-'}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Map Section */}
            <section className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-[#003366] flex items-center gap-2 uppercase text-sm">
                  <span className="material-symbols-outlined">location_on</span>
                  Monitoramento Geográfico em Tempo Real
                </h3>
              </div>
              <div className="w-full h-[550px] relative z-0">
                <MapComponent data={data ? data.dadosBrutos : []} />
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-gray-600 text-xs leading-relaxed">
                <h4 className="font-bold text-[#003366] mb-2 uppercase">Análise Territorial e Monitoramento de Fluxo Assistencial em Tempo Real</h4>
                <p className="mb-2">Esta interface cartográfica processa a "Geografia do Cuidado" em Boa Vista, convertendo dados assistenciais em indicadores espaciais de vulnerabilidade. O sistema utiliza uma <strong>Categorização Cromática Tripartite (Semáforo de Gestão)</strong> para triagem epidemiológica imediata:</p>
                <ul className="list-none space-y-1 mb-2 pl-2 border-l-2 border-gray-200">
                  <li><span className="text-red-500 font-bold">● Pontos Vermelhos (Crise de Fluxo):</span> Sinalizam o fenômeno de "Porta Giratória", identificando pacientes com alta reincidência e fragilidade de vínculo com a RAPS.</li>
                  <li><span className="text-yellow-500 font-bold">● Pontos Amarelos (Risco Assistencial):</span> Indicam instabilidade no suporte terapêutico, barreiras linguísticas ou falhas na adesão medicamentosa.</li>
                  <li><span className="text-green-500 font-bold">● Pontos Verdes (Estabilidade):</span> Representam atendimentos com suporte familiar preservado e fluxo assistencial dentro da normalidade.</li>
                </ul>
                <p>Além da localização das ocorrências (Pinos), a camada de <strong>Mapa de Calor</strong> sobrepõe a densidade de chamados aos equipamentos públicos e áreas de vulnerabilidade, permitindo que os gestores identifiquem onde a rede precisa fortalecer as ações de matriciamento e busca ativa territorial.</p>
              </div>
            </section>

            {/* [NEW] Report Generator Widget */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="flex items-center gap-2 font-bold text-[#003366] dark:text-white uppercase text-sm mb-4">
                <span className="material-symbols-outlined">assignment</span>
                Gerador de Relatório Clínico Automático
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 border-r border-gray-100 dark:border-gray-700 pr-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Buscar Paciente</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
                    <input
                      type="text"
                      placeholder="Digite o nome..."
                      value={reportSearchTerm}
                      onChange={(e) => setReportSearchTerm(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] text-sm uppercase"
                    />
                    {reportSearchTerm.length > 2 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 shadow-lg rounded-b-lg max-h-40 overflow-y-auto">
                        {data?.dadosBrutos
                          .filter((row: any[]) => row[1] && row[1].toString().includes(reportSearchTerm))
                          .slice(0, 5)
                          .map((row: any[], idx: number) => (
                            <div
                              key={idx}
                              className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-xs uppercase text-gray-700 border-b border-gray-50"
                              onClick={() => generateReport(row)}
                            >
                              {row[1]}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    * Digite para buscar no banco de dados carregado.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prévia do Relatório</label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 h-96 overflow-y-auto text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                    {generatedReport || "Aguardando seleção de paciente..."}
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => {
                        if (generatedReport) {
                          navigator.clipboard.writeText(generatedReport);
                          alert("Copiado!");
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#003366] hover:bg-blue-900 rounded shadow-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      COPIAR RELATÓRIO
                    </button>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Footer */}
          <footer className="mt-12 mb-6 text-center text-[10px] text-gray-400 max-w-2xl mx-auto leading-relaxed">
            "O Dashboard Conexão RAPS utiliza algoritmos de geoprocessamento e inteligência de dados para transformar registros assistenciais em indicadores de vigilância em saúde mental, promovendo a integração intercultural e a fluidez do fluxo assistencial em Boa Vista – RR."
          </footer>

        </main>
      </div>
    </div>
  );
};


export default Dashboard;
