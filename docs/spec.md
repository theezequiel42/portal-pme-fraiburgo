# Portal PME Fraiburgo — especificação aprovada de fluxo

## Produto e limites

Portal React de leitura do PNE e preparação de contribuições por grupo de trabalho. Usuário aprovou Google Forms nativo incorporado (opção 1): envio e recibo dentro do iframe, sem nova guia e sem sair do portal. O botão nativo pertence ao Google e pode dizer “Enviar”; o portal não promete rebatizá-lo. Não duplicar problema/proposta/justificativa em campos React: pertencem ao formulário nativo. Proposta é obrigatória; os outros dois são opcionais. Não implementar API de coleta, banco próprio ou armazenamento de rascunho.

O DEMO permanece desabilitado por padrão, fechado e sem chamadas Google. O usuário autorizou a publicação/ativação do formulário, a verificação de prefill nativo e uma contribuição técnica. Hermes verificou publicação e acesso de respondentes via API, o prefill real no navegador e o recebimento do teste comparando os sete campos. A incorporação REAL no build institucional local foi conferida em desktop/celular nas duas modalidades, com rascunho estável durante navegação/cancelamento e substituição somente após confirmação. Não há planilha vinculada, somente Forms. Não houve implantação do site na internet, divulgação ou envio autônomo adicional. Regras de privacidade/participação permanecem responsabilidade institucional. Configuração institucional real jamais vai para Git/demo. Uma configuração habilitada requer responderUri HTTPS do Google Forms e entry IDs comprovados por URL nativa, além de sinal explícito de aprovação. Campos de contexto no Forms são editáveis; não há autenticação nem garantia de integridade dada por prefill.

## Fluxo

1. Nenhum grupo inicial. Mostrar seletor com nomes de área. Etapas 2 e 3 não aparecem antes das escolhas válidas.
2. Depois do grupo, mostrar somente seus objetivos. Nenhum objetivo escolhido automaticamente. Depois do objetivo, Geral é modalidade padrão. Rádio Estratégia exige estratégia explicitamente escolhida. Rádios não roubam foco nem avançam etapas por si. Leitura interativa: Geral mostra objetivo e todas as metas; Estratégia mostra texto integral da estratégia escolhida. Não mostrar catálogo inteiro expandido no fluxo interativo.
3. Com contexto válido, permitir preparar a contribuição (ação explícita). Em modo desabilitado, informar “Coleta ainda não aberta” e manter ação indisponível; não carregar Google e não mostrar campos falsos. Em modo habilitado/verificado, criar iframe acessível com título e altura confortável, contexto pré-preenchido e embedded=true. Nome da seção “Enviar contribuição”. Sem navegação de janela, target=_blank ou redirects.
4. Separar contexto de leitura e contexto vinculado ao iframe. Navegar grupos/objetivos/modalidades/estratégias nunca remonta iframe existente. Ao propor mudar contexto de contribuição, avisar que texto no Google pode ser perdido, pedir confirmação explícita antes de remontar, preservar cancelamento e indicar contexto original. Mesmo objetivo em grupos diferentes é contexto diferente. Não prometer apagar ou salvar dados internos do Google. Não usar DOM cross-origin.

## Grupos (atribuição fornecida diretamente pelo usuário)

1 | Educação Infantil | 1,2,17
2 | Alfabetização | 3,17
3 A | Fundamental — Anos Iniciais | 4,17
3 B | Fundamental — Anos Finais | 4,17
4 | Ensino Médio | 5,17
5 | Educação Integral | 6,17
6 | Educação Digital | 7,17
7 | Sustentabilidade | 8
8 | Educação Indígena, do Campo e Quilombola | 9,17
9 | Educação Especial e Inclusiva | 10,17
10 | Educação de Jovens e Adultos | 11,17
11 | Educação Profissional e Tecnológica | 12,13,17
12 | Ensino Superior | 14,15,16
13 | Gestão Democrática | 18
14 | Financiamento da Educação | 19

3 A e 3 B recebem todas estratégias dos objetivos 4 e 17. Grupo é navegação, não validação de vínculo. Os rótulos oficiais completos estão no catálogo; não substituí-los por resumos. Rótulos de navegação editoriais devem estar separados.

## Visual

Interface clara e enxuta em pt-BR, sem dashboard, hero gigante, gradients, excesso de cartões ou indicadores. Cabeçalho institucional discreto; título PME Fraiburgo, descrição breve, etapas curtas, formulário de seletores e área de leitura confortável. Fontes do sistema sem dependência externa.

A identidade visual usa exclusivamente o PNG legítimo SME fornecido pelo usuário em `public/brand/sme-fraiburgo.png` (7342 × 1000, transparente). Origem exata: https://drive.google.com/file/d/1OOa2Rpf88djjHRnS_2MJi--6faQ4OSFp/view?usp=sharing . A arte contém brasão, separador, FRAIBURGO e SECRETARIA DE EDUCAÇÃO com lettering magenta. Preservar integralmente cores e proporção, sem crop, recoloração ou distorção. Cabeçalho com imagem fluida de altura automática, até 660px no desktop, sem legenda textual redundante. Manter o alt acessível “Fraiburgo — Secretaria de Educação” e o rodapé institucional “Município de Fraiburgo · Secretaria Municipal de Educação”.

Tokens: magenta principal #A8518A, variante escura #87396D para hover/links/foco e confirmação de troca, charcoal #373435, branco e fundos rosados muito claros. Bordas, avisos, rádios, botões e leitura usam essa identidade. Contrastes fornecidos para branco: magenta 4,989:1 e charcoal 12,316:1. Não atribuir significado semântico de erro à marca; cores semânticas podem ser definidas quando necessárias. O ativo municipal antigo e seu CSS de recorte não integram o build nem a allowlist do preview.

## Leitura estática e segurança

Prerender build-time ReactDOMServer e hydrateRoot com árvore inicial consistente. Sem JS ou com falha parcial de módulos, catálogo legal completo em seção de consulta acessível por details, claramente separada do fluxo interativo, edição desabilitada. Não ocultar fallback em head por marcador dependente de módulo. Após inicialização bem-sucedida pode ocultar consulta estática do fluxo normal ou deixá-la num details fechado com acesso discreto. Não reconstruir textos legais manualmente.

Sem credenciais frontend, analytics, localStorage/sessionStorage/IndexedDB/cookies de app ou captura de campos internos Forms. Notificar que iframe é serviço Google, não afirmar anonimato só por não pedir email. Não transmitir nada ao Google enquanto coleta desabilitada. Servidor estático rejeita caminhos privados. Não abrir rede externa/túnel nem fazer deploy.

## Aceitação e validação

- Todos os objetivos/metas/estratégias renderizados integralmente no HTML estático e equivalentes ao JSON; contagens e labels sem duplicatas.
- Todos os grupos e relacionamentos exatos; 3 A/3 B completos; seleção inválida não habilita contribuição; objetivo 17 somente grupos autorizados na tabela.
- Testes domínio e componentes do fluxo progressivo; mudança de grupo limpa seleção de leitura dependente, não contexto de iframe.
- Adaptador Forms: valida URL e configuração; bloqueia default; codifica valores literais; prefill editável explicitado; iframe permanece estável em navegação, confirmação ao trocar, cancelar preserva; nunca recibo baseado em load. Testes com fixture explicitamente fictícia e navegação/rede interceptada, não alegar recebimento real.
- Navegador: desktop e mobile 320/375px, texto não espremido, teclado/foco, sem JS e falha de módulo; sem overflow nem cabeçalho cobrindo foco.
- Preview padrão somente produção dist demo; modo explícito --institutional somente institutional/build. Mesma allowlist pública, CSP, loopback 127.0.0.1:4173 e 404 para /institutional/, /.git/config, /sources/ e credenciais. Não aceitar raiz arbitrária; resolver raiz pelo módulo, independente do diretório de execução. A operação do preview institucional é feita explicitamente pelo Hermes, separada dos testes demo/fixture. Testar sem configuração/build real e verificar nenhum destino real/segredo no dist demo.
- Relatório distingue DEMO fechado, prefill nativo verificado, resposta técnica recebida e relida no Forms, ausência de planilha vinculada e incorporação real verificada no preview institucional local. Não confundir coleta nativa publicada com implantação do site na internet.

## UX aprovada e implementada — cinco recomendações

As modalidades têm explicações acessíveis junto aos rádios: Geral — sugestões sobre o conjunto de estratégias do objetivo; Estratégia — sugestão sobre uma estratégia específica. Sem estratégia escolhida, orientar a selecionar uma estratégia para ler o texto integral; nunca exibir article vazio.

Etapa 2: “Escolha o objetivo e consulte o conteúdo”. Troca: “Alterar o assunto da contribuição”; referência: “Assunto da contribuição”. Resumos concisos identificam grupo, objetivo, modalidade e estratégia quando aplicável, sem repetir texto legal ou empilhar banners. Modal informa possível perda de texto antes de substituir o formulário; cancelar/Escape preserva iframe e retorna foco ao acionador.

Grupo e objetivo permanecem selects nativos. Estratégia usa um único `StrategyCombobox.jsx` React acessível, sem dependências novas, somente com objetivo válido e modalidade Estratégia. Label “Estratégia”, placeholder “Digite uma palavra ou escolha na lista” e seta integrada abrem a lista completa do objetivo. A consulta usa filterStrategies por texto/ID, sem distinção de acentos/case. Resultados mostram rótulos e textos oficiais literais, com quebra de linha e scroll limitado em desktop e 320/375px; leitura integral escolhida permanece abaixo.

Combobox com useId estável no SSR, aria-expanded/controls/autocomplete=list/activedescendant e listbox/option com aria-selected da seleção real. Setas mudam destaque, Enter confirma explicitamente; clique/toque confirma mantendo foco no campo. Escape, Tab, blur e clique fora fecham e restauram a exibição escolhida ou vazia, sem apagar a seleção. Reabrir pela seta ou pelo campo permite lista toda sem apagar texto longo; foco seleciona o texto exibido. Limpar pesquisa é affordance interna, sem alterar seleção. Contagem acessível, vazio orientado e indicação discreta de seleção preservada durante pesquisa; nunca inserir selecionado fora do filtro como resultado falso.

Texto livre, limpeza da consulta, destaque e blur nunca alteram estratégia, leitura escolhida ou assunto Forms. Grupo/objetivo limpam consulta/abertura/destaque/seleção dependentes, com Geral padrão, sem remontar iframe. Componente remonta por grupo/objetivo; iframe continua dependente exclusivamente do contexto vinculado e sua confirmação explícita. Não persistir query em URL, storage ou analytics.

Introdução curta e aviso compacto com “Coleta ainda não aberta” explícito, aproximando seletor em 320/375px sem ocultar aviso nem mudar logo, paleta ou cabeçalho sem legenda.
