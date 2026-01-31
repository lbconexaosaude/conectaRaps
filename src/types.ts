export interface User {
  nomeCompleto: string;
  matricula: string;
  funcao: string;
  modulo: string;
}

export interface PatientRecord {
  id: string;
  nome: string;
  nascimento: string;
  sexo: string;
  idade: string;
  bairro: string;
  zona: string;
  gps: string;
  diagnostico: string;
  reincidente: string;
  medicacao: string;
  motivo_nao_med: string;
  apoio_fam: string;
  motivo_nao_fam: string;
  apoio_raps: string;
  observacoes: string;
  entrada: string;
}

export interface DashboardData {
  total: number;
  reincidentes: number;
  clinico: {
    diag: number;
    med: number;
    fam: number;
    raps: number;
  };
  masculino: number;
  feminino: number;
  idades: Record<string, number>;
  zonas: Record<string, number>;
  bairros: Record<string, number>;
  dias: Record<string, number>;
  mensal: Record<string, number>;
  dadosBrutos: any[][];
}

export interface KPIStats {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendIcon?: string;
  bgGradient: string;
  accentColor: string;
  subTextColor: string;
}
