# Plano

## Ideia registrada para próxima evolução — ainda não implementar

O usuário deseja retomar em breve a alternativa de formulário próprio em React com backend e armazenamento no Google Sheets, priorizando um fluxo mais simples. Os campos da contribuição passariam a integrar a interface do portal; o backend validaria os dados e gravaria na planilha pela API do Sheets, mantendo credenciais exclusivamente no servidor. Essa gravação não constitui resposta no Google Forms.

Este registro não autoriza implementação, substituição do iframe, criação de planilha, alteração de recursos Google ou publicação. A arquitetura atual com Forms nativo incorporado permanece vigente até aprovação explícita da mudança. Na retomada, definir backend, acesso institucional, validação do contexto, confirmação de gravação, proteção contra abuso/duplicidade e tratamento de rascunhos antes de implementar.

## Implementação atual

Implementar React com prerender integral do catálogo e hidratação consistente. Separar leitura progressiva e contexto estável do Forms. Demo fechado; integração institucional depende de aprovação e prefill nativo verificado.

Validar transcrição das 464 linhas, grupos, adaptador, fluxo e HTML produzido. Executar build e navegador desktop/mobile, sem JS e falha de módulo quando disponível. Preview exclusivamente dist em loopback; registrar limites reais.

Identidade SME: usar somente o PNG legítimo integral `sme-fraiburgo.png`, sem recorte, recoloração ou distorção. Substituir a paleta municipal por magenta #A8518A, escuro #87396D, charcoal #373435, branco e rosados claros. Cabeçalho fluido somente com o logo e alt acessível, sem legenda visual duplicada; identificação institucional mantida no rodapé. Validar em TDD asset/cabeçalho/paleta; atualizar cópia no build e allowlist do preview, mantendo os bloqueios privados. Não alterar catálogo ou fluxo Forms.

Cinco recomendações UX aprovadas implementadas: explicações acessíveis das modalidades, estado vazio orientado, linguagem de assunto, busca local preservando seleção/leitura/iframe e introdução/aviso compactos. Teste de busca registrado vermelho antes da implementação e verde depois; suíte browser ampliada para fluxo completo. Não houve alteração da arquitetura. Suíte browser anterior ao combobox aprovada pelo Hermes como conta de desenvolvimento após bloqueios iniciais no sandbox; HTTP e capturas desktop/mobile conferidos, sem ampliar isolamento.

Combobox aprovado: substituir somente busca + limpar externo + select de estratégia por StrategyCombobox.jsx sem dependências. Grupo/objetivo seguem nativos. Consulta e destaque locais são independentes da seleção confirmada, leitura e contexto Forms; componente remonta por grupo/objetivo e iframe permanece estável. ARIA/teclado/toque, texto legal integral e filtros sem resultados artificiais cobertos pela suíte ampliada. TDD SSR vermelho/verde registrado; Node/build/catálogo/formatação passam. Browser atual executado e aprovado pelo Hermes como conta de desenvolvimento após bloqueio inicial no sandbox; capturas, toque e rolagem interna conferidos sem alterar isolamento.
