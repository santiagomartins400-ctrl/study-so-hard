# Proxy da IA (Cloudflare Worker)

Este proxy deixa a app usar a OpenAI sem que cada pessoa tenha de colar uma chave. A chave fica guardada no Cloudflare, nunca no código nem no navegador.

## Publicar (uma vez)

Precisas de uma conta gratuita na Cloudflare e de Node.js instalado.

```bash
cd proxy
npx wrangler login
npx wrangler secret put OPENAI_API_KEY   # cola a tua chave da OpenAI quando pedir
npx wrangler deploy
```

No fim, o `wrangler deploy` mostra um endereço do tipo `https://study-so-hard-ia.<conta>.workers.dev`.

## Ligar à app

Em `app.html`, na constante `PROXY_URL`, coloca esse endereço seguido de `/` (por exemplo `https://study-so-hard-ia.<conta>.workers.dev/`). Depois disso a app deixa de pedir chave às pessoas.

## Limites

- Só aceita os modelos `gpt-4o-mini` e `gpt-4o`, até 40 mensagens e 60 000 caracteres por pedido.
- Só aceita pedidos das origens em `ORIGENS_PERMITIDAS`. Isto evita uso noutros sites, mas não impede abuso por ferramentas fora do navegador.
- Não há limite de pedidos por pessoa. Convém definir um limite de gastos na conta da OpenAI.
