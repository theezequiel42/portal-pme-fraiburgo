# Implantação — React estático + Node Functions + Sheets

Este documento descreve configuração operacional; não constitui autorização permanente para novas operações externas. A implementação inicial usou apenas fixtures. Em operação posterior explicitamente autorizada, o usuário aprovou reutilizar OAuth Google, criar a planilha, publicar no projeto Vercel vinculado e abrir a coleta. Um teste técnico foi gravado e relido. Ver evidências em `validation.md` e referências reais privadas em `institutional/collection.json`.

## Build e saída pública

- Node **22.x**, compatível com **22.23.1**; framework **Other/null**. Manter lockfile e `npm ci`.
- `vercel.json`: build `node scripts/vercel-build.mjs`, saída `dist`; handlers Node de API são implantados como Functions, separadamente dos ativos estáticos.
- Production, Preview e Development usam o mesmo build fechado. O wrapper chama scripts/build.mjs sem selecionar integração por ambiente. SSR não abre coleta nem incorpora credenciais; o cliente consulta `GET /api/collection` após hidratar e envia `POST /api/contributions` em tempo de execução.
- Nenhum build lê `institutional/forms.json` ou `PME_FORMS_CONFIG`; nenhum arquivo temporário de configuração é criado. A variável antiga não tem efeito e não deve ser usada na nova configuração. Não é necessário inspecionar arquivos privados históricos.
- `dist/` contém somente `index.html`, `app.js`, `style.css` e `brand/sme-fraiburgo.png`. Nunca publicar institutional/, sources/, .git/, arquivos .env ou credenciais. Sources permanece disponível apenas para verificação durante o build.
- `build:institutional` mantém compatibilidade de comandos, gerando os mesmos ativos fechados em `institutional/build/`. Não é o caminho de produção Vercel e não ativa coleta.

## Configuração runtime — servidor somente

Ver contrato e instruções exatas em [sheets-backend.md](sheets-backend.md). A autenticação pode usar conta de serviço ou autorização OAuth de usuário já existente. O usuário autorizou explicitamente reutilizar a autorização da conta Google do Hermes, sem modificar suas credenciais locais. No modo OAuth, a planilha fica na própria conta e não exige compartilhamento com conta de serviço. Reutilizar um refresh token amplo não reduz seus escopos: armazená-lo apenas como Secret no ambiente Production e considerar migração futura para autorização exclusiva do portal.

| Variável                       | Finalidade                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `COLLECTION_ENABLED`           | Chave explícita de abertura da coleta, conforme contrato do backend.                                    |
| `VERCEL_ENV`                   | Ambiente fornecido pela Vercel; a abertura exige `production`. Preview/Development permanecem fechados. |
| `COLLECTION_ORIGIN`            | Origem canônica autorizada do portal para validação de requisições.                                     |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Identidade da conta de serviço com acesso à planilha.                                                   |
| `GOOGLE_PRIVATE_KEY`           | Chave privada exclusivamente no ambiente servidor, nunca prefixada para exposição ao cliente.           |
| `GOOGLE_SHEETS_ID`             | Planilha de destino institucional, exclusivamente no servidor.                                          |
| `GOOGLE_AUTH_MODE`             | `oauth` para autorização de usuário; conta de serviço permanece alternativa.                            |
| `GOOGLE_OAUTH_CLIENT_ID`       | Identificador OAuth, somente no servidor.                                                               |
| `GOOGLE_OAUTH_CLIENT_SECRET`   | Segredo OAuth do cliente, somente no servidor.                                                          |
| `GOOGLE_OAUTH_REFRESH_TOKEN`   | Autorização renovável existente, somente no servidor; não copiar para frontend, Git ou logs.            |

Cadastrar valores reais pelo mecanismo seguro da plataforma, nunca em Git, docs, fixtures, bundle ou logs. Não imprimir valores para validar configuração. Não cadastrar credenciais de produção em Preview/Development. A ausência de configuração operacional deve manter coleta fechada, não interromper a geração dos ativos estáticos. Seguir detalhes de formato da chave, estrutura da planilha, limites e erros documentados no contrato do backend; não inventar schema operacional neste documento.

## Verificação antes da abertura

1. Executar como fraiburgo: `npm test`, `npm run build`, `npm run verify:catalog`; usar TMPDIR gravável. Testes devem usar fixtures sintéticas, sem acesso à configuração local real ou rede Google.
2. `npm run preview` serve apenas dist em `127.0.0.1:4173`, com allowlist, CSP e bloqueio 404 de caminhos privados. É servidor estático: não executa a API, logo não abre coleta. `preview:institutional` serve apenas institutional/build com a mesma política, sem fallback.
3. Na operação de implantação autorizada, confirmar Functions, status fechado por padrão, origem correta e falhas sem exposição de segredos. Nunca servir a raiz do repositório nem criar túnel para o preview.
4. Somente com autorização específica e configuração operacional concluída, verificar gravação real e leitura correspondente na planilha antes de declarar integração end-to-end. Testes locais/interceptados não comprovam recebimento.
5. Revisar avisos de privacidade, retenção e procedimentos de falha/reenvio/abuso. Não presumir idempotência distribuída ou garantia de ausência de duplicatas além do contrato implementado. Abrir coleta só após aprovação institucional.

## Configuração operacional ativada

Autenticação OAuth de usuário, segredos somente em Production, origem canônica HTTPS do portal e planilha privada da conta SME. Functions `api/collection` e `api/contributions` verificadas em produção; status de coleta habilitada relido após promoção. O WAF publicado limita POST `/api/contributions` a 10 tentativas/60 s por IP, janela fixa, com bloqueio 429 quando excedido. Limites são regionais e IP pode representar vários participantes em uma mesma escola; não equivalem a autenticação ou limite por pessoa.

Não há novas credenciais gravadas no repositório. O deploy via CLI inclui o estado de trabalho validado, sem commit/push; ele não comprova que a branch remota contém essa versão. Uma implantação posterior da branch remota pode substituir a versão operacional se o código não tiver sido sincronizado pelo responsável. Desativar coleta exige mudar a variável Production `COLLECTION_ENABLED` e gerar novo deploy; apenas editar variável não altera Functions de um deployment existente. Não revogar a autorização OAuth compartilhada como mecanismo de fechamento, pois isso afeta também o Hermes.

## Histórico Forms

A publicação do Forms, prefill e contribuição técnica registrados anteriormente pertencem à arquitetura substituída. A resposta histórica está no Forms e não equivale a linha no Sheets. O portal novo não usa iframe nem parâmetros entry. A configuração privada anterior pode permanecer ignorada sem ser lida; não reativar Forms via PME_FORMS_CONFIG nem usar testes antigos como evidência operacional atual.
