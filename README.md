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

## Portal implementado — opção 1 resolvida

React com prerender build-time via ReactDOMServer e hydrateRoot. O HTML inclui o catálogo integral em consulta por details, disponível sem JavaScript ou se o módulo falhar. O fluxo começa sem área e objetivo selecionados; as estratégias pertencem ao objetivo. A identidade usa o logo SME legítimo fornecido pelo usuário, integral e proporcional, com alt acessível, sem legenda textual redundante no cabeçalho responsivo e com rodapé institucional.

Google Forms nativo incorporado é a arquitetura aprovada. Problema opcional, proposta obrigatória e justificativa opcional pertencem exclusivamente ao formulário Google. O portal não duplica esses campos, não aciona envio, não lê o DOM entre origens e não interpreta iframe.onload como recibo. O botão de envio e a confirmação pertencem ao Google.

O demo usa configuração desabilitada, não carrega iframe nem faz requisições ao Google. Não há analytics, persistência de rascunhos ou credenciais no frontend. A navegação altera apenas o contexto de leitura. Um formulário iniciado conserva seu contexto e elemento iframe; uma ação explícita para substituir o contexto abre confirmação sobre possível perda de texto. Cancelar ou Escape preserva o formulário. Grupos diferentes são contextos diferentes, inclusive 3 A e 3 B para o mesmo objetivo.

## Executar

Node **22.23.1**, dependências fixadas e package-lock.json. React e Rolldown foram instalados offline usando o cache disponível.

```sh
npm ci
npm run build
npm test
npm run verify:catalog
npm run preview
```

O build verifica o catálogo e gera somente `dist/`. O preview permite apenas os arquivos públicos conhecidos de `dist`, em `127.0.0.1:4173`; não use servidor da raiz, túnel ou deploy. Caminhos privados e desconhecidos retornam 404. Nenhuma configuração de `institutional/` é lida pelo build demo.

O runner Node usa `--experimental-test-isolation=none` para executar os testes no mesmo processo, pois o subprocesso do runner foi bloqueado neste ambiente. Isso não altera permissões ou isolamento do sandbox.

## Adaptador institucional — ativação operacional autorizada

Por solicitação explícita do usuário, Hermes publicou o formulário e confirmou por leitura posterior que está aceitando respostas. O acesso público foi concedido somente à visualização de respondentes; edição e respostas não foram compartilhadas. O link nativo fornecido pelo usuário teve origem, parâmetros, opções e pré-preenchimento real conferidos no desktop e celular. Uma contribuição identificada como TESTE TÉCNICO — DESCONSIDERAR recebeu confirmação nativa e foi relida pela API, com os sete campos exatamente iguais, incluindo acentos e quebras de linha. Não há planilha vinculada: o registro está no Forms.

O build institucional foi gerado e ativado no preview local. A incorporação REAL foi verificada em1280/375px nas modalidades Geral e Estratégia, incluindo valores pré-preenchidos, rascunho preservado ao navegar/cancelar e substituição somente depois de confirmação. Esses testes de incorporação não enviaram uma segunda resposta. O DEMO continua fechado, sem iframe nem chamadas Google. O formulário está publicado, mas o site não foi implantado na internet.

A autorização do usuário cobriu ativação/publicação do formulário, verificação de pré-preenchimento e uma contribuição técnica. Não autoriza envios adicionais autônomos, divulgação, publicação do site ou deploy. Regras institucionais de privacidade/participação continuam sob responsabilidade operacional da instituição.

A configuração real fica exclusivamente em `institutional/forms.json`, ignorado pelo Git. O schema exige `enabled`, `approved` e `prefillVerified` iguais a true; `responderUri` HTTPS em `docs.google.com/forms/d/e/.../viewform`; `verifiedNativePrefillUri` com a mesma origem/caminho e os quatro parâmetros de contexto; e `entries` com chaves `group`, `objective`, `mode`, `strategy` e IDs distintos no formato entry numérico. Não há exemplo de IDs institucionais inventados. A validação estrutural não substitui a comprovação humana do prefill nativo.

`npm run build:institutional` valida a configuração e gera somente `institutional/build/`; foi executado com a configuração real verificada. `npm run preview:institutional` (equivalente a `node scripts/preview.mjs --institutional`) serve exclusivamente esse build em `127.0.0.1:4173`, com a mesma allowlist, CSP e 404 de caminhos privados do demo. Não lê `forms.json` nem aceita raiz arbitrária. Sem build, retorna 404; não usa dist como fallback.

O padrão `npm run preview` continua servindo apenas `dist/` fechado. Os dois modos usam a mesma porta fixa; o processo local atual serve o build institucional, depois de encerrado o preview demo. Os testes demo/fixture foram executados antes da troca; para repeti-los, utilize o modo demo, não a coleta real. Não servir a raiz do repositório. Nenhum desses comandos publica o site; `institutional/` permanece ignorado e a configuração real não deve ser copiada para código, docs ou testes públicos.

## Validação executada e limites

Ver [docs/validation.md](docs/validation.md). A suíte Node cobre comparação das 464 linhas, SHA-256 da fonte, grupos, contexto inválido, codificação e bloqueios do adaptador, prerender inicial e política 404. A fixture fictícia fica apenas em testes, fora do bundle demo.

`npm run test:browser` executa testes Playwright para desktop, 375/320px, teclado, sem JS, falha de módulo e preservação/troca de iframe. A fixture fictícia substitui o módulo por interceptação e intercepta todo acesso ao Forms, sem submissão. Playwright e Chromium já estão disponíveis na conta de desenvolvimento. A suíte anterior ao combobox incluiu as cinco recomendações UX e passou como conta de desenvolvimento, após bloqueios iniciais no sandbox. Capturas desktop/mobile e verificações HTTP também foram executadas; busca, leitura, foco e preservação do iframe foram conferidos com fixture interceptada. O preview foi reiniciado e verificado por HTTP. Ver o resultado do combobox e o histórico separados em `docs/validation.md`. Instalações novas precisam de `npx playwright install chromium`. Ao executar a partir de outro usuário de serviço, use um `TMPDIR` gravável pela conta de desenvolvimento, sem expor o home root. A incorporação real, o prefill e a preservação de rascunho foram verificados no build institucional; a resposta técnica recebida foi confirmada por leitura exata via API. Ver a seção institucional acima e docs/validation.md. Não há planilha vinculada nem publicação do site na internet.

A identidade visual usa exclusivamente o PNG legítimo SME fornecido pelo usuário em `public/brand/sme-fraiburgo.png` (7342 × 1000, transparente). Origem exata: https://drive.google.com/file/d/1OOa2Rpf88djjHRnS_2MJi--6faQ4OSFp/view?usp=sharing . A arte contém brasão, separador, FRAIBURGO e SECRETARIA DE EDUCAÇÃO com lettering magenta. Preservar integralmente cores e proporção, sem crop, recoloração ou distorção. Cabeçalho com imagem fluida de altura automática, até 660px no desktop, sem legenda textual redundante. Manter o alt acessível “Fraiburgo — Secretaria de Educação” e o rodapé institucional “Município de Fraiburgo · Secretaria Municipal de Educação”.

Tokens: magenta principal #A8518A, variante escura #87396D para hover/links/foco e confirmação de troca, charcoal #373435, branco e fundos rosados muito claros. Bordas, avisos, rádios, botões e leitura usam essa identidade. Contrastes fornecidos para branco: magenta 4,989:1 e charcoal 12,316:1. Não atribuir significado semântico de erro à marca; cores semânticas podem ser definidas quando necessárias. O ativo municipal antigo e seu CSS de recorte não integram o build nem a allowlist do preview.

## UX implementada

Modalidades explicadas junto aos rádios, orientação quando nenhuma estratégia foi escolhida e linguagem de “assunto da contribuição”. Grupo/objetivo continuam selects nativos; estratégia unifica busca e seleção em `StrategyCombobox.jsx`, sem novas dependências. Texto/ID ignoram acentos e maiúsculas; lista com texto legal integral, quebra de linha, scroll, contagem acessível e vazio orientado. Setas destacam, Enter/clique/toque confirmam; Escape/Tab/blur/clique fora restauram a exibição escolhida. Seta integrada abre lista completa e limpeza interna altera somente pesquisa. Texto livre nunca seleciona; leitura anterior continua visível, sem resultados artificiais. Grupo/objetivo limpam estado dependente, com Geral padrão, preservando iframe iniciado. A troca do assunto continua explícita e confirmada.

Validação desta alteração: teste novo SSR registrado vermelho antes e verde depois; 10 testes Node, build, catálogo e formatação executados. A suíte browser foi ampliada para o combobox, incluindo teclado/foco/ARIA, consulta não confirmada, filtro, mobile 320/375px com toque e iframe/cancelamento. Sua execução atual passou como conta de desenvolvimento após bloqueio inicial do sandbox. Hermes conferiu capturas1280/375/320, seleção por teclado/clique/toque, rolagem interna por gesto e lista visível ao abrir perto do fim da tela, sem erros JS ou overflow. Não houve teste com leitor de tela real ou participantes. Nenhuma dependência instalada, recurso Google alterado ou coleta aberta.
