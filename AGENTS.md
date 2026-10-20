# Regras para agentes

- Projeto de Ezequiel; execute como usuário fraiburgo. Não altere configurações de Hermes nem credenciais.
- Leia docs/spec.md e README.md antes de trabalhar. Usuário aprovou React e opção 1: Google Forms nativo incorporado. Não trocar por API/Sheets, endpoint de envio não documentado ou redirecionamento.
- Catálogo legal data/pne-catalog.json imutável na implementação. Compare todos os 464 rótulos/textos com sources/numbered-rows.json. Estratégias pertencem a objetivo, não inferir relação com meta.
- Não publique nem abra coleta, não envie respostas nem altere recursos Google. Configuração real institucional fica em institutional/ ignorado pelo Git e fora de dist no build demonstrativo.
- Não alegue envio por iframe.onload. Resposta/recibo são responsabilidade do Google. Não acesse DOM cross-origin nem exponha OAuth.
- Nunca elimine/reclassifique silenciosamente um rascunho. A navegação do catálogo não pode remontar iframe já iniciado. Confirmação explícita antes de trocar seu contexto; cancelar preserva iframe. Não tentar ler campos internos do Google.
- Preview somente dist, loopback; não servir raiz do repositório. .git/config, institutional/, sources/ e credenciais precisam retornar 404.
- Use dependências compatíveis com Node 22.23.1; mantenha lockfile. Execute testes, build e verificação de catálogo. Registre limites reais, não simule resultado de integração fechada.
