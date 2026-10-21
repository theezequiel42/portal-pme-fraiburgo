# Implantação estática na Vercel

A autorização atual permite substituir a produção Vercel e publicar o repositório. Ela substitui os limites históricos de não implantação em README/spec apenas para essa operação aprovada; não autoriza novas respostas ao Forms ou exposição de credenciais.

- Projeto existente: conectar o repositório e usar `main` como branch de produção. Configurar Node **22.x** (compatível com 22.23.1); framework **Other/null**. `vercel.json` define `npm ci`, `node scripts/vercel-build.mjs` e saída exclusivamente `dist`.
- Cadastrar `PME_FORMS_CONFIG` como JSON **somente no ambiente Production**. Usar a configuração institucional aprovada e com prefill nativo verificado, conforme schema de `src/forms.js`. Nunca copiar seus valores para Git, docs ou testes. Vinculação do projeto e cadastro do ambiente são operações separadas do código.
- Somente `VERCEL_ENV=production` ativa o build institucional. Configuração ausente/inválida interrompe o build sem imprimir valores. O wrapper cria `institutional/forms.json` temporário com criação exclusiva e remove ao terminar (inclusive em falha). Se já existir qualquer configuração local, recusa sem ler ou sobrescrever: usar checkout limpo.
- Preview, Development e execução sem `VERCEL_ENV` sempre executam `npm run build`: demo fechado, sem iframe ou chamadas Google, ignorando configuração institucional e variável de ambiente.
- Produção executa o build institucional existente e copia apenas HTML, JS, CSS e logo gerados para `dist`. Não publica o diretório institucional. `.vercelignore` exclui configurações privadas e artefatos; `sources/` permanece disponível no build remoto para verificação do catálogo, mas não integra a saída servida.

A configuração de Forms (URL de respondente e IDs de contexto) será **visível no navegador** no bundle de produção; não é segredo administrativo. Não incluir tokens, OAuth, senhas ou acesso de edição/respostas nesse JSON. Aprovação estrutural não substitui verificação humana do prefill; campos de contexto são editáveis no Google.

Validação local sem configuração real: `npm test`, `npm run build`, `npm run verify:catalog`. Os testes do wrapper usam checkout temporário e fixture explicitamente sintética, sem acessar configuração institucional local e sem rede Google. Este conjunto de alterações não realiza deploy.
