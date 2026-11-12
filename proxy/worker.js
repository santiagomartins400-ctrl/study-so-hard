// Proxy do Study So Hard para a OpenAI (Cloudflare Worker).
// A chave da OpenAI fica no servidor (segredo OPENAI_API_KEY) e nunca chega ao navegador.
// Variáveis: OPENAI_API_KEY (segredo), ORIGENS_PERMITIDAS (lista separada por vírgulas).

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODELOS_PERMITIDOS = new Set(['gpt-4o-mini', 'gpt-4o']);
const MAX_MENSAGENS = 40;
const MAX_CARACTERES = 60000;
const MAX_TOKENS = 1500;

function cabecalhosCors(origem, permitidas) {
  const permitida = permitidas.includes(origem) ? origem : permitidas[0];
  return {
    'Access-Control-Allow-Origin': permitida,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function resposta(corpo, estado, cabecalhos) {
  return new Response(JSON.stringify(corpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cabecalhos }
  });
}

export default {
  async fetch(request, env) {
    const permitidas = (env.ORIGENS_PERMITIDAS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const origem = request.headers.get('Origin') || '';
    const cors = cabecalhosCors(origem, permitidas);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return resposta({ erro: 'Método não permitido.' }, 405, cors);
    }
    // Pedidos sem origem (ferramentas) ou de origens não listadas são recusados.
    if (!permitidas.includes(origem) && !(origem === 'null' && permitidas.includes('null'))) {
      return resposta({ erro: 'Origem não autorizada.' }, 403, cors);
    }
    if (!env.OPENAI_API_KEY) {
      return resposta({ erro: 'O servidor ainda não tem a chave da OpenAI configurada.' }, 500, cors);
    }

    let dados;
    try {
      dados = await request.json();
    } catch (e) {
      return resposta({ erro: 'Pedido inválido.' }, 400, cors);
    }

    const { model, messages, temperature, response_format } = dados || {};
    if (!MODELOS_PERMITIDOS.has(model)) {
      return resposta({ erro: 'Modelo não permitido.' }, 400, cors);
    }
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MENSAGENS) {
      return resposta({ erro: 'Número de mensagens inválido.' }, 400, cors);
    }
    const tamanho = JSON.stringify(messages).length;
    if (tamanho > MAX_CARACTERES) {
      return resposta({ erro: 'Texto demasiado longo.' }, 413, cors);
    }

    const corpo = {
      model,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: typeof temperature === 'number' ? Math.min(Math.max(temperature, 0), 1) : 0.3
    };
    if (response_format && response_format.type === 'json_object') {
      corpo.response_format = { type: 'json_object' };
    }

    const pedido = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + env.OPENAI_API_KEY
      },
      body: JSON.stringify(corpo)
    });

    return new Response(pedido.body, {
      status: pedido.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors }
    });
  }
};
