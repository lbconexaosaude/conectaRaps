import { AUTH_API_URL, DATA_API_URL } from '../constants';

export const api = {
  // Helper que suporta tanto 'acao' (original Auth) quanto 'action' (legado Data)
  _safeFetch: async (url: string, cmd: string, params: Record<string, string> = {}) => {
    try {
      const fetchUrl = new URL(url);
      // O script de AUTH usa 'acao', o script de DATA usa 'action'
      const paramName = url === AUTH_API_URL ? 'acao' : 'action';
      fetchUrl.searchParams.append(paramName, cmd);
      Object.entries(params).forEach(([k, v]) => fetchUrl.searchParams.append(k, v));

      const response = await fetch(fetchUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        mode: 'cors'
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error(`Erro na ação ${cmd}:`, e);
      throw e;
    }
  },

  _getVal: (rowOrObj: any, key: string) => {
    if (!rowOrObj) return '';
    if (!Array.isArray(rowOrObj)) {
      const keys = Object.keys(rowOrObj);
      const match = keys.find(k =>
        k.toLowerCase() === key.toLowerCase() ||
        k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === key.toLowerCase()
      );
      return match ? String(rowOrObj[match] || '').toUpperCase() : '';
    }
    const mapping: Record<string, number> = {
      id: 0, nome: 1, nascimento: 2, datanasc: 2, sexo: 3, idade: 4,
      bairro: 7, zona: 8, localizacao: 9, gps: 9, loc: 9,
      diagnostico: 11, reincidente: 12, medicado: 13, apoiofam: 15, apoioraps: 17
    };
    const idx = mapping[key.toLowerCase()];
    return idx !== undefined ? String(rowOrObj[idx] || '').toUpperCase() : '';
  },

  // --- LÓGICA DE LOGIN (RESTAURADA - USA AUTH_API_URL COM 'SUCESSO') ---
  login: async (usuario: string, senha: string) => {
    try {
      const data = await api._safeFetch(AUTH_API_URL, 'login', { usuario, senha });
      if (data.sucesso) {
        return {
          result: 'success',
          nomeCompleto: data.nome,
          modulo: data.modulo,
          message: data.mensagem
        };
      }
      return { result: 'error', message: data.mensagem || 'Usuário ou senha inválidos' };
    } catch (e) {
      return { result: 'error', message: 'Erro de conexão com o servidor' };
    }
  },

  registrar: async (dados: any) => {
    try {
      const data = await api._safeFetch(AUTH_API_URL, 'registrar', dados);
      return data.sucesso ? { result: 'success', message: data.mensagem } : { result: 'error', message: data.mensagem };
    } catch (e) {
      return { result: 'error', message: 'Erro ao realizar cadastro' };
    }
  },

  // --- LÓGICA DE DADOS (LEGADA - USA DATA_API_URL COM 'RESULT') ---
  verificarPaciente: async (nome: string) => {
    try {
      const data = await api._safeFetch(DATA_API_URL, 'verificar_paciente', { nome });
      if (data.result === 'exists') {
        const p = data.p;
        return {
          result: 'exists',
          p: {
            id: p.id || api._getVal(p, 'id'),
            nascimento: p.nascimento || '',
            sexo: p.sexo || api._getVal(p, 'sexo'),
            endereco: p.end || p.endereco || api._getVal(p, 'endereco'),
            num: p.num || p.numero || api._getVal(p, 'numero'),
            bairro: p.bairro || api._getVal(p, 'bairro'),
            loc: p.loc || p.localizacao || api._getVal(p, 'localizacao'),
            ref: p.ref || p.ponto_ref || api._getVal(p, 'ponto_ref'),
            diag: p.diag || p.diagnostico || api._getVal(p, 'diagnostico'),
            reinc: p.reinc || p.reincidente || api._getVal(p, 'reincidente'),
            med: p.med || p.medicado || api._getVal(p, 'medicado'),
            pq_med: p.pq_med || p.motivo_nao_med || api._getVal(p, 'motivo_nao_med'),
            fam: p.fam || p.apoio_familiar || api._getVal(p, 'apoio_familiar'),
            pq_fam: p.pq_fam || p.motivo_nao_fam || api._getVal(p, 'motivo_nao_fam'),
            raps: p.raps || p.apoio_raps || api._getVal(p, 'apoio_raps'),
            info: p.info || p.observacoes || api._getVal(p, 'observacoes')
          }
        };
      }
      return { result: 'not_found' };
    } catch (e) {
      return { result: 'error' };
    }
  },

  carregarBairros: async () => {
    const hardcodedBairros = {
      "ZONA NORTE": ["AEROPORTO", "B. DOS ESTADOS", "CAUAME", "RIVER PARK", "PARAVIANA"],
      "ZONA OESTE": ["ALVORADA", "ASA BRANCA", "BURITIS", "CAIMBE", "CINTURAO VERDE", "DR. SILVIO BOTELHO", "GENIPAPO", "EQUATORIAL", "JARDIM FLORESTA", "JARDIM TROPICAL", "JOQUEI CLUBE", "LIBERDADE", "MARECHAL RONDON", "MECEJANA", "NOVA CIDADE", "OLIMPICO", "OPERARIO", "PINTOLANDIA", "PRICUMA", "PROFESSORA ARACELI SOUTO MAIOR", "RAIAR DO SOL", "SANTA TEREZA", "SAO BENTO", "SENADOR HELIO CAMPOS", "TANCREDO NEVES", "UNION", "LAURA MOREIRA"],
      "ZONA SUL": ["13 DE SETEMBRO", "CALUNGA", "CAMBATA", "CENTRO", "SAO FRANCISCO", "SAO PEDRO", "SAO VICENTE"],
      "ZONA LESTE": ["APARECIDA", "31 DE MARCO", "CANARINHO", "CIDADE SATELITE", "DOS ESTADOS", "JARDIM CARANA", "JARDIM PRIMAVERA", "MURILO TEIXEIRA", "PARQUE CAÇARI", "PARQUE DAS PEDRAS"],
      "RURAL": ["AREA RURAL"]
    };
    try {
      const res = await api._safeFetch(DATA_API_URL, 'carregar_lista_bairros');
      if (res.bairros) {
        return { bairros: res.bairros, nomes: res.nomes || [] };
      }
      return { bairros: hardcodedBairros, nomes: [] };
    } catch (e) {
      return { bairros: hardcodedBairros, nomes: [] };
    }
  },

  carregarEstatisticas: async () => {
    try {
      const d = await api._safeFetch(DATA_API_URL, 'carregar_estatisticas');

      const dadosBrutos = d.dadosBrutos ? d.dadosBrutos.map((r: any) => [
        r[0], r[1], r[2], r[3], r[4], '', '', r[7], r[8], r[9], '', r[11], r[12], r[13], r[14], r[15], r[16], r[17], r[18], r[19], 'USUÁRIO'
      ]) : [];

      return {
        total: d.total,
        reincidentes: d.reincidentes,
        clinico: d.clinico,
        masculino: d.masculino,
        feminino: d.feminino,
        idades: d.idades,
        zonas: d.zonas,
        bairros: d.bairros,
        topBairros: [],
        dias: d.dias,
        mensal: d.mensal,
        dadosBrutos
      };
    } catch (e) {
      console.error("Erro ao carregar estatísticas:", e);
      return null;
    }
  },

  salvarSamu: async (payload: any) => {
    try {
      const data = await api._safeFetch(DATA_API_URL, 'salvar_samu', {
        id_paciente: payload.id_paciente,
        nome: payload.nome,
        nascimento: payload.nascimento,
        sexo: payload.sexo,
        idade: payload.idade,
        endereco: payload.endereco,
        numero: payload.numero,
        bairro: payload.bairro,
        zona: payload.zona,
        localizacao: payload.localizacao,
        referencia: payload.referencia,
        diagnosticado: payload.diagnosticado,
        reincidente: payload.reincidente,
        medicacao: payload.medicacao,
        pq_med: payload.pq_med,
        apoio_fam: payload.apoio_fam,
        porque_fam: payload.porque_fam,
        apoio_raps: payload.apoio_raps,
        info_extra: payload.info_extra
      });
      return data.result === 'success' ? { result: 'success', id: data.id } : { result: 'error', message: data.message };
    } catch (e) {
      return { result: 'error', message: 'Erro de conexão' };
    }
  }
};
