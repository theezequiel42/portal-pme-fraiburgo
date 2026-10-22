# Validação executada

## Limpeza autorizada para início oficial

O usuário solicitou remover os testes feitos pelo Hermes e por ele. Inspeção encontrou quatro registros de teste: os protocolos técnicos conhecidos, o teste anterior do usuário já migrado e uma nova proposta literalmente `teste`. Não houve exclusão por busca genérica de palavra em contribuições reais. Uma regra WAF temporária bloqueou POST durante a limpeza; foram excluídas quatro linhas inteiras da tabela, de baixo para cima, e duas abas antigas de teste. Backup privado pré-operação e recibo ficam em `institutional/`, ignorados pelo Git e fora do build; não foram alterados OAuth nem código do backend.

Releitura exata confirmou zero contribuições, cabeçalho com nove colunas preservado, filtro/congelamento/banding mantidos e ausência das duas abas removidas. Metadados contendo apenas protocolos foram preservados como bloqueio contra recriação dos testes por navegadores antigos; isso não bloqueia novos UUIDs. Orientações atualizadas e relidas. Manutenção desativada/publicada e relida como inativa; nenhuma nova contribuição de teste foi criada para essa limpeza. As evidências anteriores abaixo são históricas e não significam que os registros de teste continuam na planilha.

## Migração para tabela legível — publicada e conferida

A pedido do usuário, a planilha passou a ter aba principal `Contribuições`, com nove cabeçalhos legíveis, uma linha por registro, filtro, cabeçalho congelado/destacado, larguras de colunas, quebra automática, alinhamento superior e linhas alternadas. Locale pt_BR e fuso America/Sao_Paulo. Os dois registros existentes foram copiados e comparados campo a campo; protocolos preservados. Não havia data no formato antigo: foi indicado `Não registrada (formato anterior)`, sem inventar recebimento.

As duas abas individuais anteriores foram ocultadas, não apagadas; releitura confirmou que permanecem intactas. Backup e referências reais ficam em `institutional/`, ignorados e fora do build. Metadados únicos dos protocolos migrados foram criados e relidos. Durante a mudança, regra WAF temporária bloqueou POST para impedir gravações no formato antigo. Após promover o novo deployment, essa manutenção foi desativada e relida como inativa; o rate limit original de 10 tentativas/60 s/IP continua ativo. Coleta reaberta.

Build e suíte integrada: 40/40 testes aprovados, incluindo duas requisições concorrentes com mesmo UUID sem duplicidade, UUIDs diferentes na mesma aba, colisão de metadataId fechada, perda de resposta com releitura e schema/cabeçalhos. Catálogo legal/SHA-256 preservados. Deployment conferido READY, com ambas as Functions, e endereço canônico apontando para a versão de linhas.

O usuário autorizou explicitamente mais um teste técnico. POST real no endereço canônico retornou 200 e protocolo; releitura independente comparou todos os campos, acentos/quebras e texto iniciado por `=`, e confirmou timestamp de Brasília. A tabela passou de dois para três registros, sem criar nenhuma aba; todos os anteriores permaneceram exatamente iguais. Reenvio do mesmo UUID retornou o mesmo recibo e uma nova leitura confirmou apenas uma linha desse protocolo e nenhuma aba adicional. Testes técnicos continuam marcados para exclusão da sistematização, não foram apagados.

Formatação foi conferida pela API: cabeçalho destacado, congelamento, filtro, banding, larguras e WRAP. `autoResizeDimensions` em ROWS limpa altura fixa para ajuste dinâmico conforme documentação oficial. A primeira asserção operacional que esperava pixelSize maior que 21 na API falhou; foi corrigida porque o retorno pode continuar indicando o padrão 21px antes da renderização de um cliente. Não confundir essa metainformação com captura visual do Sheets autenticado, que não foi realizada. Nenhum conteúdo de participante foi impresso nos testes; snapshots privados permanecem fora do Git/dist.

## Histórico — ativação original OAuth Google e Sheets (abas individuais)

O usuário autorizou configurar backend/Sheets, publicar no projeto Vercel vinculado e abrir a coleta, escolhendo reutilizar a conta Google já autorizada no Hermes. Conta SME conferida ao vivo; autorização OAuth renovada e escopo Sheets verificado sem alterar os arquivos de credenciais locais. Criada planilha dedicada, relida e conferida como privada, sem permissão pública/de domínio. Referências reais de planilha, deploy, regra WAF e protocolo técnico ficam exclusivamente em `institutional/collection.json`, fora do Git e do dist.

Credenciais OAuth cadastradas como Secrets somente em Production; listagem posterior confirmou nomes, tipo e ambiente. O build não lê nem incorpora esses valores. Nenhum segredo foi impresso ou copiado para fontes públicas. OAuth reutilizado possui escopos mais amplos que Sheets: isso foi explicitado e não foi alegada redução de escopo. Expiração/revogação pode afetar o portal e a autorização compartilhada com Hermes.

Adaptação OAuth testada em vermelho/verde; suíte completa com 33/33 aprovados, build e comparação das 464 linhas/hash aprovados. Deployment Node 22 concluído READY com duas Functions. Antes da promoção, um POST técnico identificado como TESTE TÉCNICO — DESCONSIDERAR recebeu HTTP 200 e protocolo. Leitura independente pela API Sheets comparou literalmente os oito campos, incluindo acentos, quebras e texto iniciado por `=`. Preservar esse teste para auditoria e excluí-lo da sistematização, não apagá-lo automaticamente. Nenhuma contribuição adicional foi enviada na inspeção de interface.

Após promover, o endereço canônico retornou HTTP 200 no HTML/JS e `{ "enabled": true }` na API. `/.git/config`, `/institutional/forms.json`, `/sources/numbered-rows.json`, `/.env`, `/server/contributions.mjs` e `/data/pne-catalog.json` retornaram 404. CSP de mesma origem conferida. Navegador real em produção 1280/375/320px: formulário disponível sem iframe, rascunho e foco preservados ao navegar/cancelar com Escape, sem overflow nem erros JS. Capturas locais em cache privado `pme-tmp/production-form-{1280,375,320}.png`; nenhum POST nesse teste de interface.

WAF publicado e relido ativo/válido: POST `/api/contributions`, 10 tentativas/60 s por IP, janela fixa e ação 429. A configuração foi verificada; não foi feito teste de carga para esgotar a regra. Não autentica participantes, não garante disponibilidade sob ataque distribuído e pode limitar usuários de um IP escolar compartilhado. Capacidade operacional de 500 abas de contribuição; sem consolidação automática. O deploy foi feito pelo CLI a partir do estado de trabalho, sem commit/push. O preview local continua estático e fechado; abrir produção não altera o preview.

## Evolução atual — formulário React e backend Sheets

Verificação final como `fraiburgo`, Node 22.23.1: `npm test` com 28/28 aprovados, `npm run build`, `npm run test:browser`, catálogo e Prettier aprovados; `git diff --check` sem erros. HTTP real em loopback: `/` e `/app.js` 200; `/.git/config`, `/institutional/forms.json`, `/sources/numbered-rows.json` e `/.env` 404. Catálogo, fonte numerada e lockfile sem alterações. Preview atual serve exclusivamente `dist/` fechado.

O iframe foi substituído por campos React (problema opcional, proposta obrigatória e justificativa opcional). O navegador consulta a disponibilidade na API de mesma origem; o preview estático continua fechado. Testes de navegador em 1280/375/320px passaram com transporte interceptado: rascunho e assunto preservados ao navegar, cancelamento/Escape com retorno de foco, falha de envio sem recibo, repetição com UUID/conteúdo idênticos, confirmação e novo formulário. A suíte mantém busca/seleção acessíveis, teclado/toque, catálogo sem JS/falha de módulo e ausência de overflow.

TDD do formulário SSR: falhou pela entrada ausente antes da implementação e passou depois. A ação de nova contribuição no mesmo assunto também foi testada em vermelho (botão ausente) e verde. Build e verificação dos 464 rótulos/textos/posições e SHA-256 passaram. As evidências históricas abaixo de Forms não validam Sheets; nenhum envio real ao Google, abertura de coleta, criação de planilha ou deploy foi realizado nesta evolução. A configuração institucional antiga não foi lida nem modificada. Detalhes e limites do backend estão em `sheets-backend.md`.

## Histórico — preview institucional Forms — 20/10/2026

O usuário autorizou explicitamente ativação/publicação do formulário, verificação nativa e uma contribuição técnica. Hermes verificou a conta proprietária, removeu indicação de rascunho e publicou o formulário com isPublished=true e isAcceptingResponses=true, relendo o alvo exato após as alterações. Acesso público somente à view published de respondentes; editor e respostas não compartilhados. Não há planilha vinculada, somente Forms. O site não foi implantado na internet; o DEMO continua fechado.

O Google recusou o login no navegador automatizado antes da senha; não houve contorno de autenticação. O usuário forneceu o link gerado pelo editor em seu navegador. Origem, caminho, quatro parâmetros e valores de opções foram validados e cruzados com questionIds da API. Pré-preenchimento real conferido em1280/375px, preservando literalmente o valor de exemplo informado. A configuração real habilitada está ignorada em institutional/forms.json, sem OAuth ou dados de respostas.

Uma contribuição marcada TESTE TÉCNICO — DESCONSIDERAR foi enviada pela interface pública nativa. Recibo Google confirmou resposta registrada; leitura posterior pela API localizou exatamente o marcador e releu seu responseId, comparando os sete valores integralmente, com acentos e quebras de linha. A resposta técnica foi preservada para auditoria e deve ser excluída da sistematização, não apagada automaticamente. Recibos/IDs reais permanecem fora do projeto público.

TDD: teste institucional novo falhou antes por ausência da fábrica createHandler e passou após implementação. Fixture temporária copia apenas o script, sem forms.json/build real; verifica build ausente retornando 404, raízes demo/institucional distintas relativas ao módulo, allowlist, caminhos privados/traversal, métodos, HEAD, mesmos headers/CSP e rejeição de modos/argumentos arbitrários. Testes demo existentes preservados.

Preview padrão serve somente dist; --institutional serve somente institutional/build, ambos em loopback127.0.0.1:4173. Hermes executou build institucional com configuração real verificada, encerrou preview demo e iniciou preview institucional na mesma porta. Nenhuma credencial copiada para frontend/codificação; sem mudança de UI/catálogo/dependências, commit, push ou deploy do site.

Verificações: npm test (11 testes), build demo e institucional, verificação das464 linhas e SHA-256, Prettier. A suíte browser demo/fixture foi reexecutada e aprovada antes da troca de modo. O embed REAL foi verificado em1280/375px nas modalidades Geral e Estratégia: valores nativos pré-preenchidos corretos; rascunho permaneceu no mesmo iframe ao navegar e cancelar; confirmação explícita substituiu iframe e assunto. Esses testes não enviaram segunda resposta. Capturas em cache privado pme-live-embed-1280.png e pme-live-embed-375.png. O teste aguardou o carregamento e trouxe o iframe à área visível antes de conferir widgets nativos; inspeção antecipada fora da área renderizada não foi tratada como falha de preenchimento.

Os registros abaixo são históricos e não descrevem o status institucional atual. Regras formais de privacidade, participação, retenção e divulgação continuam responsabilidade institucional. Não houve teste com participantes nem leitor de tela real.

## Combobox de estratégia — 20/10/2026

Teste novo SSR falhou antes da implementação (entrada StrategyCombobox.jsx inexistente) e passou após. Suíte Node: 10/10; build demo e verificação de 464 rótulos/textos/posições e SHA-256 passam. Sem alteração no catálogo ou dependências. Formatação verificada.

Suíte browser atual executada pelo Hermes como `fraiburgo`, com TMPDIR privado, após bloqueio inicial de Chromium no sandbox: passou. Conferidos confirmação explícita, texto livre inválido, setas/Enter/Escape/Tab, foco/ARIA, clique fora, filtros acento/case/ID, zero resultado, toque 320/375px, reset e iframe preservado/cancelamento com fixture interceptada. Corrigido o helper que aguardava um iframe inexistente no demo; a fixture continua exigindo preservação do iframe real de teste.

Revisão visual detectou lista aberta abaixo da área visível ao acionar campo perto do fim da tela. Teste de visibilidade falhou antes da correção; rolagem nearest do componente ao abrir/filtrar mantém campo e resultados visíveis sem alterar foco ou seleção. Build, 10 testes Node e suíte browser repetidos e aprovados depois.

Inspeção independente em grupo12/objetivo14 e telas1280/375/320 confirmou um único controle de estratégia, filtro14.2. com resultado literal, texto não confirmado sem mudar seleção/leitura, sem erros JS ou overflow. Rolagem por gesto touch dentro da lista funcionou nos dois tamanhos móveis. Capturas em `/home/fraiburgo/.cache/codex-scratch/pme-combobox-open-375.png`, `pme-combobox-selected-375.png` e versões1280/320. Não foi realizado teste com leitor de tela real ou participantes. Nenhuma resposta enviada, recurso Google alterado ou publicação realizada.

## Histórico — cinco recomendações UX (20/10/2026)

- Node 22.23.1, conta fraiburgo; sem dependências ou configuração institucional alteradas.
- TDD de busca: falhou antes da exportação/implementação; passou após a implementação. Na revisão visual, o botão Limpar busca encostava no indicador de foco; teste de espaçamento falhou antes da correção e passou após margem de 12px. Build e suítes repetidos após o ajuste.
- `npm run build`, `npm test` (9 testes) e `npm run verify:catalog` passaram, preservando todos os 464 rótulos/textos/posições e SHA-256 da fonte.
- Prettier dos arquivos de aplicação, scripts, testes e documentação verificado.
- Preview somente dist em loopback verificado por HTTP pelo Hermes: `/`, `/app.js` e logo SME 200; `/.git/config`, `/institutional/forms.json` e fonte HTML 404. O bloqueio inicial de bind no sandbox não exigiu ampliar isolamento.
- `npm run test:browser` passou como conta de desenvolvimento, com TMPDIR privado. Desktop1280 e mobile375/320: explicações, estado vazio, busca texto/ID/case/acentos, zero resultados, limpeza/foco, seleção preservada fora do filtro, reset por grupo/objetivo, fallback e iframe preservado ao filtrar/cancelar/Escape. Fixture interceptada, sem resposta real.
- Capturas desktop/mobile e inspeção independente em grupo12/objetivo14 confirmaram leitura integral e busca 14.2. com 1 resultado. Sem erros JS ou overflow em 1280/375/320px. Primeiro seletor mobile375 em y=367.3125 e mobile320 em y=359.8125. Evidências locais em `/home/fraiburgo/.cache/codex-scratch/pme-ux-start-375.png` e `pme-ux-search-375.png`. Não representam teste com participantes ou coleta real.
- Sem consulta/alteração ao Google, envio, abertura de coleta, publish, commit, push ou deploy. Integração real continua fechada e não verificada.

## Histórico — remoção da legenda do cabeçalho (20/10/2026)

Executado como `fraiburgo`, Node 22.23.1, sem alterar dependências ou isolamento.

- TDD: o teste de identidade falhou com a legenda no cabeçalho e passou após sua remoção; verifica também alt acessível e rodapé institucional preservados.
- Removida somente a legenda visível do cabeçalho e sua regra CSS órfã `header span`. Logo e fluxo preservados. Testes browser e requisitos canônicos atualizados.
- `npm run build`, `npm test` (8 testes) e `npm run verify:catalog` passaram: 464 rótulos/textos/posições equivalentes à fonte e SHA-256 confirmado.
- Prettier check de aplicação, scripts, testes, configuração e documentação passou; fontes legais arquivadas não foram reformatadas.
- `npm run test:browser` passou quando executado pelo Hermes como `fraiburgo`, com TMPDIR privado e preview de dist em loopback, após bloqueio inicial de Chromium no sandbox. Foi corrigida uma asserção nova de rodapé que desconsiderava a linha de status já existente; a asserção agora confere ambas as linhas completas, sem modificar o rodapé. Cabeçalho sem legenda, logo íntegro, desktop/mobile, teclado, fallback e fixture interceptada passaram. A suíte Node foi repetida: 8 testes passaram.
- Em mobile 375px, o primeiro seletor passou a iniciar em y=449.703125. Inspeção por DOM e captura Playwright confirmaram ausência de texto duplicado, alt preservado e ausência de overflow horizontal. A captura do browser harness expirou; foi obtida e inspecionada captura alternativa em `/home/fraiburgo/.cache/codex-scratch/pme-header-ux.png`. Propostas heurísticas ainda não implementadas naquela execução; preenchimento real não avaliado com coleta fechada.

Nenhum recurso Google, catálogo, dependência, configuração institucional, commit ou publicação foi alterado.

## Histórico da identidade SME antes da remoção da legenda (20/10/2026)

Executado como `fraiburgo`, Node 22.23.1, sem instalar dependências ou alterar permissões.

- TDD: `node --experimental-test-isolation=none --test tests/brand.test.mjs` falhou antes da correção por referência ao asset municipal antigo; passou após substituição. A execução sem a opção de isolamento também falhou por restrição do runner, por isso a evidência de regressão usa a opção adotada pelo projeto.
- `npm run build`: passou, coleta demonstrativa desabilitada.
- `npm test`: 8 testes passaram. Mantidas as aceitações de fluxo, catálogo e segurança; allowlist atualizada para SME e teste explícito de 404 do ativo antigo.
- `npm run verify:catalog`: 464 rótulos/textos/posições conferidos e SHA-256 da fonte confirmado.
- PNG SME copiado integralmente para dist, sem transformação; comparação SHA-256 entre origem e destino. Dist contém somente index.html, app.js, style.css e brand/sme-fraiburgo.png.
- Prettier check dos arquivos de aplicação, scripts, testes, configuração e documentação passou. A tentativa de `prettier --check .` apontou somente o HTML legal arquivado `sources/lei-15388-camara.html`; essa fonte foi preservada, sem reformatar evidência legal.
- Preview reiniciado pelo Hermes como `fraiburgo` em 127.0.0.1:4173, após a tentativa de bind bloqueada no sandbox. HTTP real: `/` e `/brand/sme-fraiburgo.png` retornam 200; logo antigo, `/.git/config` e `/institutional/forms.json` retornam 404. O PNG servido tem bytes idênticos ao arquivo fornecido, SHA-256 `1f4268db065155c8697444b39d6986cb34a14fcf37998d5d29a38c952662e82f`.
- `npm run test:browser`: passou na conta `fraiburgo`, com TMPDIR privado, após o bloqueio inicial de Chromium no sandbox. Novas asserções de logo integral/proporcional e paleta em 1280/375/320px executadas. Mantidos testes de fluxo, teclado, fallback sem JS/falha de módulo e fixture Forms interceptada, sem envio real.
- Inspeção visual direta em desktop 1280px e celular 375px: logo completo, legível com identificação complementar, sem recorte, distorção ou rolagem horizontal. Avisos, links e bordas seguem o magenta SME. Catálogo e fluxo preservados.

Mudanças restritas à identidade visual, build/preview do ativo, testes e documentação. Catálogo e fluxo Forms preservados; nenhum recurso Google acessado, coleta aberta, resposta enviada, publicação, commit ou push.

## Histórico anterior à substituição visual SME

Os resultados desta seção registram a implementação anterior, com identidade municipal. Não comprovam a validação browser da identidade SME atual.

Executado como usuário de desenvolvimento `fraiburgo`, com Node 22.23.1. O sandbox Codex foi mantido. A implementação inicial encontrou restrições de DNS e bind; o Hermes executou instalação e validação do preview como a mesma conta de desenvolvimento, sem alterar as permissões do sandbox ou abrir acesso ao home root.

- `npm run build`: passou; gera React com prerender de todo catálogo e bundle demonstrativo, coleta desabilitada.
- `npm test`: 7 testes passaram, nenhum falhou. Inclui comparação de todos os 464 rótulos/textos/posições, SHA-256 da fonte, grupos completos, contexto inválido, adaptador Forms, árvore inicial e política de arquivos do preview.
- Regressão de rótulos Forms: um teste novo falhou antes da correção porque o grupo usava separador diferente e o objetivo incluía texto que não era opção do dropdown do formulário criado. Corrigido para os valores exatos das opções: grupo com travessão e objetivo somente com o rótulo oficial. A suíte completa passou depois.
- `npm run test:browser`: passou com Playwright 1.64.1/Chromium. Executa desktop, 375px, 320px, fluxo progressivo, teclado, sem JavaScript, falha de módulo e preservação/confirmação/troca do iframe. Testes da integração usam exclusivamente fixture fictícia interceptada; nenhuma resposta ou requisição à coleta real foi enviada.
- Preview HTTP em `http://127.0.0.1:4173`: `/` e `/app.js` retornaram 200; `/.git/config`, `/institutional/forms.json`, `/sources/lei-15388-camara.html` e `/README.md` retornaram 404.
- Inspeção visual direta no navegador: desktop e 375px, cabeçalho municipal, etapas progressivas, área de leitura e sem rolagem horizontal. Grupo 3 A apresenta somente objetivos 4 e 17. Capturas locais de validação não são publicadas.
- `dist/` contém somente index.html, app.js, style.css e brand/fraiburgo.png. Verificado que não contém o identificador/destino do formulário institucional nem tokens OAuth.
- Código JS/JSX/CSS e testes formatados com Prettier; lockfile presente.

## Histórico — gates antes da ativação autorizada

O formulário institucional foi criado e conferido por leitura posterior na etapa anterior: é privado, não publicado, fechado para respostas, com proposta obrigatória e problema/justificativa opcionais. Não há planilha vinculada. O rascunho antigo foi preservado.

O acesso pelo navegador ao responderUri do rascunho redirecionou para login Google. Não havia credencial no cofre do navegador; não houve tentativa de contornar autenticação. OAuth administrativo não autentica o navegador.

Permanecem pendentes obtenção/verificação de URL nativa pré-preenchida e entry IDs, publicação autorizada, regras institucionais de privacidade/participação, incorporação do formulário real e confirmação de recebimento/recibo com teste explicitamente autorizado. A fixture não comprova nenhum desses resultados. O demo conserva a coleta desabilitada; não mostra campos falsos nem usa endpoint de submissão não documentado.

Nenhum commit, push ou deploy foi feito. Naquela etapa, o servidor local servia somente dist em loopback, não a raiz do repositório.
