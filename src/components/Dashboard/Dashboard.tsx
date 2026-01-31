import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import {
  GenderPieChart, AgeBarChart, ZoneChart, NeighborhoodsChart, TrendChart, ClinicalRadarChart,
  MedicationChart, SupportChart, DiagnoseChart
} from './Charts';
import { api } from '../../services/api';
import MapComponent from './MapComponent';
import { DashboardData } from '../../types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

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
              <div className="bg-[#003366] rounded-xl p-5 text-center shadow-lg text-white">
                <div className="text-xs opacity-80 mb-1 uppercase tracking-wider">Atendimentos Total</div>
                <h1 className="text-3xl md:text-4xl font-bold">{data?.total || 0}</h1>
              </div>
              <div className="bg-[#ED1C24] rounded-xl p-5 text-center shadow-lg text-white">
                <div className="text-xs opacity-80 mb-1 uppercase tracking-wider">Taxa Reincidência</div>
                <h1 className="text-3xl md:text-4xl font-bold">{data ? Math.round((data.reincidentes / data.total) * 100) : 0}%</h1>
              </div>
              <div className="bg-[#00AEEF] rounded-xl p-5 text-center shadow-lg text-white sm:col-span-2 md:col-span-1">
                <div className="text-xs opacity-80 mb-1 uppercase tracking-wider">Vínculo RAPS</div>
                <h1 className="text-3xl md:text-4xl font-bold">{data ? Math.round((data.clinico.raps / data.total) * 100) : 0}%</h1>
              </div>
            </section>

            {/* Row 1 Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Gênero</h3>
                <div className="flex-1"><GenderPieChart data={sexData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Faixa Etária</h3>
                <div className="flex-1"><AgeBarChart data={ageData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Casos por Zona</h3>
                <div className="flex-1"><ZoneChart data={zoneData} /></div>
              </div>
            </section>

            {/* Row 2 Charts - New Charts Integrated */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Diagnósticos</h3>
                <div className="flex-1"><DiagnoseChart data={diagData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Adesão à Medicação</h3>
                <div className="flex-1"><MedicationChart data={medData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Rede de Apoio</h3>
                <div className="flex-1"><SupportChart data={supportData} /></div>
              </div>
            </section>

            {/* Row 3 Charts - Existing Layout Adjusted */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Volume por Bairro (Top 10)</h3>
                <div className="flex-1"><NeighborhoodsChart data={bairroData} /></div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex flex-col h-80">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wide">Indicadores Clínicos (Radar)</h3>
                <div className="flex-1"><ClinicalRadarChart data={clinicalData} /></div>
              </div>
            </section>

            {/* Table Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-bold text-[#003366] dark:text-white uppercase text-sm">Espelho da Planilha: DADOS SAMU</h3>
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
                      {["ID", "NOME", "NASC", "SEXO", "IDADE", "BAIRRO", "ZONA", "GPS", "DIAGNOSTICO", "REINCIDENTE", "MEDICACAO", "MOTIVO_NAO_MED", "APOIO_FAM", "MOTIVO_NAO_FAM", "APOIO_RAPS", "OBSERVACOES", "RESPONSÁVEL", "ENTRADA"].map(h => (
                        <th key={h} className="px-3 py-3 font-bold text-white border-b border-white/10 uppercase tracking-tighter">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tableData.map((row: any[], i: number) => {
                      // Mapping to original column order
                      const displayRow = [
                        row[0], // ID
                        "****************", // Nome (Masked)
                        row[2], // Nasc
                        row[3], // Sexo
                        row[4], // Idade
                        row[7], // Bairro
                        row[8], // Zona
                        row[9], // GPS
                        row[11], // Diag
                        row[12], // Reinc
                        row[13], // Med
                        row[14], // Motivo nao med
                        row[15], // Fam
                        row[16], // Motivo nao fam
                        row[17], // RAPS
                        row[18], // Obs/Info Extra
                        row[20] || '-', // Responsável
                        row[19] // Entrada (Timestamp)
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
            </section>

          </div>
          <div className="h-10"></div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
