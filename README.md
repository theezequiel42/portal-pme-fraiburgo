# PME Fraiburgo — catálogo oficial

## Escopo disponível

Este repositório contém o catálogo do Anexo I da Lei nº 15.388, de 14 de abril de 2026, extraído da versão atualizada publicada pela Câmara dos Deputados:
https://www2.camara.leg.br/legin/fed/lei/2026/lei-15388-14-abril-2026-798950-normaatualizada-pl.html

Foram extraídas e verificadas programaticamente 464 linhas numeradas: 19 objetivos, 73 metas e 372 estratégias. O Anexo II não faz parte deste catálogo. Foi normalizado apenas o espaço em branco do HTML; redação, rótulos e pontuação foram conservados. A referência de cada linha é sua posição na sequência de linhas de tabela do HTML arquivado (`sourceRow`), não uma página do PDF.

- `data/pne-catalog.json`: catálogo hierarquizado por objetivo, com origem e SHA-256 da fonte.
- `sources/lei-15388-camara.html`: HTML da fonte oficial, arquivado para reprodutibilidade; não deve ser servido como aplicação.
- `sources/numbered-rows.json`: todas as linhas numeradas extraídas.
- `scripts/extract-catalog.py`: extrator Python sem dependências externas.

Reproduzir a extração:

```sh
python3 scripts/extract-catalog.py
```

As estratégias se vinculam ao objetivo, sem associação inferida com a meta imediatamente anterior. Rótulos editoriais dos grupos não fazem parte da transcrição legal.

## Arquitetura atual aprovada

A evolução antes registrada como ideia foi explicitamente aprovada: formulário próprio React, backend Node em Vercel Functions e armazenamento pela API oficial do Google Sheets. Não há iframe nem envio ao Google Forms no fluxo atual. Problema e justificativa são opcionais; proposta é obrigatória. Credenciais ficam exclusivamente no servidor.

ReactDOMServer gera o catálogo integral e um estado inicial fechado; hydrateRoot usa a mesma árvore inicial. `App` não recebe configuração de coleta. Após hidratar, o cliente consulta `GET /api/collection`; apenas o status habilitado em tempo de execução permite preparar o formulário. `POST /api/contributions` passa pelo backend, que valida contexto e campos e grava no Sheets. A confirmação depende da resposta da API após gravação, não de carregamento de página. Falha de status mantém a coleta fechada; falha de envio não deve apagar o texto.

A navegação de leitura é separada do assunto da contribuição. Trocar grupo/objetivo/modalidade não descarta o rascunho em memória; substituir seu assunto exige confirmação. Não há persistência local, analytics nem credenciais no frontend. Estratégias pertencem ao objetivo, não a uma meta inferida.

## Executar e verificar

Node **22.23.1**, dependências fixadas em `package-lock.json`.

```sh
npm ci
npm run build
npm test
npm run verify:catalog
npm run preview
```

Executar como `fraiburgo`. Neste ambiente, usar `PATH=/home/fraiburgo/.local/bin:$PATH` e `TMPDIR=/home/fraiburgo/.cache/pme-tmp`, gravável pela conta. O runner Node usa `--experimental-test-isolation=none` por restrição anterior do ambiente; isso não amplia permissões.

O build verifica as 464 linhas e gera somente HTML, JS, CSS e logo em `dist/`. Produção, Preview e Development usam o mesmo build fechado: não leem `institutional/forms.json` nem `PME_FORMS_CONFIG`, não geram configuração temporária e não embutem variáveis de credenciais. A coleta de produção depende da API e de configuração operacional do servidor, não de um bundle especial.

`npm run preview` serve apenas a allowlist de `dist/` em `127.0.0.1:4173`. Não implementa as Functions: o status indisponível mantém a coleta fechada. `.git/config`, `institutional/`, `sources/`, credenciais e caminhos desconhecidos retornam 404. Nunca servir a raiz do repositório.

Compatibilidade local: `npm run build:institutional` gera os mesmos ativos estáticos fechados em `institutional/build/`, sem ler configuração privada; `npm run preview:institutional` serve somente essa raiz, com a mesma allowlist, CSP e porta. Não ativa coleta, não lê `forms.json` e não usa `dist` como fallback.

## Operação e limites

Ver [implantação](docs/deployment.md) e [contrato do backend](docs/sheets-backend.md). As variáveis comuns de servidor são `COLLECTION_ENABLED`, `VERCEL_ENV`, `COLLECTION_ORIGIN` e `GOOGLE_SHEETS_ID`. A autenticação aceita conta de serviço ou, com `GOOGLE_AUTH_MODE=oauth`, a autorização Google existente, usando `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` e `GOOGLE_OAUTH_REFRESH_TOKEN` exclusivamente no servidor. Não criar nova conta de serviço quando o usuário autorizar reutilizar OAuth. Testes locais usam dados sintéticos; não equivalem a recebimento institucional. Resultados operacionais posteriores são registrados separadamente em `docs/validation.md`.

A implementação inicial não realizou chamadas Google nem deploy. Posteriormente, o usuário autorizou configuração, publicação no projeto Vercel vinculado e abertura da coleta reutilizando a autorização OAuth Google existente. A operação confirmou planilha privada da SME, um teste técnico gravado e relido nos oito campos e produção habilitada. Nenhuma credencial do Hermes foi alterada; valores de OAuth foram cadastrados como Secrets apenas em Production. Referências reais da planilha, deploy e teste ficam em `institutional/collection.json`, ignorado e fora do build. Ver evidências atuais e histórico em [docs/validation.md](docs/validation.md).

Foi ativada regra WAF de 10 tentativas POST por minuto por IP para `/api/contributions`; não autentica participantes e pode limitar uma rede escolar compartilhada. Capacidade operacional padrão de 500 contribuições, agora em uma única aba `Contribuições`, com uma linha por envio. Cabeçalhos legíveis, recebimento em horário de Brasília, filtro, primeira linha congelada, larguras adequadas, quebra de texto e linhas alternadas facilitam a sistematização. Protocolos são preservados. As abas individuais foram inicialmente ocultadas na migração; posteriormente, o usuário autorizou a limpeza dos testes e essas abas foram excluídas, junto com as linhas de teste. A tabela foi conferida vazia para início oficial, mantendo cabeçalho e formatação. O formato antigo não registrava data: a migração não inventa esse valor. Metadados técnicos invisíveis vinculados à planilha controlam duplicidade sem criar abas por pedido. Revogação/expiração da autorização OAuth pode interromper gravações; uma autorização ampla reutilizada não se torna restrita ao Sheets. Políticas de privacidade, retenção e participação continuam responsabilidade institucional.

`npm run test:browser` cobre a interface com API interceptada; instalações novas podem precisar de `npx playwright install chromium`. Relatar separadamente esses testes locais e a gravação real verificada.

## Histórico — integração Google Forms descontinuada no portal

Na arquitetura anterior, o usuário autorizou publicação do Forms, verificação de prefill e uma resposta identificada como TESTE TÉCNICO — DESCONSIDERAR. Os registros anteriores descrevem confirmação nativa e releitura dos sete campos via API, incorporação desktop/celular e preservação do iframe. Naquela etapa não havia planilha vinculada; a resposta estava no Forms. Esses fatos não comprovam integração com Sheets nem definem o estado atual de publicação de qualquer recurso externo.

A configuração histórica permanece privada em `institutional/`, ignorada pelo Git, sem leitura ou migração automática. `PME_FORMS_CONFIG` não é mais usado. Não é necessário apagar ou inspecionar credenciais/configurações anteriores para construir o portal. A autorização histórica não autoriza novos envios autônomos. Documentos antigos sobre prefill/iframe devem ser lidos como histórico, não como instrução de ativação atual.

## Identidade e navegação

A identidade visual usa exclusivamente o PNG legítimo SME fornecido pelo usuário em `public/brand/sme-fraiburgo.png` (7342 × 1000, transparente). Origem exata: https://drive.google.com/file/d/1OOa2Rpf88djjHRnS_2MJi--6faQ4OSFp/view?usp=sharing . A arte contém brasão, separador, FRAIBURGO e SECRETARIA DE EDUCAÇÃO com lettering magenta. Preservar integralmente cores e proporção, sem crop, recoloração ou distorção. Cabeçalho com imagem fluida de altura automática, até 660px no desktop, sem legenda textual redundante. Manter o alt acessível “Fraiburgo — Secretaria de Educação” e o rodapé institucional “Município de Fraiburgo · Secretaria Municipal de Educação”.

Tokens: magenta principal #A8518A, variante escura #87396D para hover/links/foco e confirmação de troca, charcoal #373435, branco e fundos rosados muito claros. Bordas, avisos, rádios, botões e leitura usam essa identidade. Contrastes fornecidos para branco: magenta 4,989:1 e charcoal 12,316:1. Não atribuir significado semântico de erro à marca; cores semânticas podem ser definidas quando necessárias. O ativo municipal antigo e seu CSS de recorte não integram o build nem a allowlist do preview.

Grupo e objetivo mantêm selects nativos; estratégia usa `StrategyCombobox.jsx` com busca por texto/ID sem distinguir acentos/case. Texto legal integral, navegação por teclado, toque, foco e estados vazios devem permanecer acessíveis. Consulta e destaque não mudam seleção confirmada nem assunto da contribuição. Sem JavaScript ou com falha do módulo, o catálogo integral continua disponível em consulta estática por details, sem coleta.
