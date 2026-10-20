# Tarefas

- [x] Interface React responsiva, identidade SME integral e catálogo estático integral.
- [x] Grupos exatos e adaptador Forms fechado por padrão.
- [x] Contexto de leitura independente, iframe estável por contexto e confirmação de troca.
- [x] Build, testes Node e verificação de catálogo/SHA-256, incluindo rótulos exatos das opções Forms.
- [x] Política de arquivos públicos/404 testada diretamente.
- [x] README e relatório com gates institucionais restantes.
- [x] Executar suíte de navegador desktop/mobile/teclado/fallback/fixture interceptada: passou com Playwright/Chromium na conta de desenvolvimento.
- [x] Validar preview por HTTP: loopback 200 nos arquivos públicos e 404 nos caminhos privados.
- [x] Forms publicado com autorização explícita; estado e acesso de respondentes relidos; prefill nativo e recebimento do teste conferidos comparando sete campos.
- [x] Embed REAL verificado no preview institucional em1280/375px; site não implantado na internet; sem planilha vinculada.

- [x] Regressão TDD de asset/cabeçalho/paleta: falhou com o asset antigo e passou com SME.
- [x] Remover recorte e ativo municipal antigo; build/preview usam somente SME.
- [x] Tokens SME e cabeçalho responsivo somente com logo e alt acessível, sem legenda duplicada.
- [x] Acrescentar asserções browser de proporção, dimensões, visibilidade e cor em 1280/375/320px.
- [x] Executar novamente a suíte browser da identidade SME: passou como conta de desenvolvimento; preview HTTP e inspeção visual desktop/mobile conferidos.

- [x] Implementar as cinco recomendações UX aprovadas e atualizar especificação/revisão/README.
- [x] Testar busca em vermelho/verde e executar testes Node, build, catálogo e formatação.
- [x] Ampliar browser-test para explicações, vazio, busca/seleção/reset, foco, 320/375px e estabilidade do iframe ao filtrar/cancelar/Escape.
- [x] Executar suíte browser anterior ao combobox e capturas como conta de desenvolvimento: passou; HTTP, desktop/mobile, busca/foco/seleção e fixture de iframe conferidos.

- [x] Unificar busca/seleção em StrategyCombobox.jsx sem dependências; remover UI/CSS antigos.
- [x] Consulta/destaque independentes, seleção explícita, ARIA/useId, lista integral, teclado, fechamento e limpeza interna.
- [x] Manter grupo/objetivo nativos, Geral padrão, reset local e vínculo/iframe preservados.
- [x] TDD SSR vermelho/verde; ampliar browser para teclado/ARIA/filtro/mobile/toque/iframe/cancelamento.
- [x] Testes Node, build, catálogo e formatação do combobox.
- [x] Browser atual passou como conta de desenvolvimento; capturas desktop/mobile, rolagem por toque e resultados visíveis perto do limite da tela conferidos, sem ampliar isolamento.

## Preview institucional — ativação autorizada

- [x] Modo explícito --institutional com raiz fixa institutional/build; padrão dist demo fechado.
- [x] Preservar allowlist/CSP/loopback/404 privados, rejeitar argumentos e modos arbitrários.
- [x] TDD isolado sem config/build real; manter testes demo e validar HEAD/métodos privados/ausência de fallback.
- [x] Scripts build:institutional e preview:institutional sem publicação; documentação operacional atualizada.
- [x] Testes Node, build demo, catálogo e Prettier.
- [x] Processo institucional ativo na porta fixa após encerrar demo; prefill Geral/Estratégia, rascunho preservado e troca confirmada verificados no iframe real.

Operação Google e configuração real executadas pelo Hermes sob autorização explícita; agentes de código não receberam OAuth nem realizaram chamadas Google. Sem alteração de UI, dependências ou catálogo; sem commit, push ou deploy do site.
