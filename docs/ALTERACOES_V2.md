# Alterações do NEXTAGE v2

Implementação local em sete etapas, após análise do commit `13601d6`, na branch `feature/v2-privacidade`. Sem push, publicação ou migração de dados reais.

1. Removidos premium, métrica online e configuração de Functions ausentes. Constantes centralizadas; nível avançado a partir de 500 vitórias.
2. Separados perfil público e documento privado. Inicialização durante login; transações de desfecho; derrotas e abandonos explícitos; apelido no lugar de nome público.
3. Rankings limitados a 100 documentos, desempate determinístico e agregação para posição fora da lista. Edição validada do apelido.
4. Preparados regras, índices, testes, migração idempotente e script de custom claim. Credenciais externas; roteiro de publicação coordenada.
5. Termo versionado, exportação pessoal e exclusão com reautenticação/lotes. Pesquisa exclui contas configuradas e seleciona campos permitidos, com códigos SHA-256. Executor de emuladores filtra ambiente herdado.
6. Histórico por palavra na transação do Clássico; comparação com primeira ocorrência; aba de palavras difíceis. Derrota pesa sete tentativas na média por palavra.
7. Corrigidos os erros restantes de lint; separados provider/contexto/hook; centralizado Authentication nos serviços. ESLint impede SDK de Auth/Firestore na interface. Documentação e métricas reproduzíveis entregues.

## Decisões e preservações

- Admin por custom claim; Firestore Standard nativo; painel do usuário confirmou ausência de Functions publicadas.
- Dependências de execução mantidas. Três dependências de desenvolvimento autorizadas para testes e scripts administrativos.
- Usuário decidiu manter as duplicatas de `answers.js` e as probabilidades: 1.501 entradas e 1.465 palavras distintas. Dicionário com 5.971 palavras mantido.
- Hooks `useWordle`/`useRunner` e arquivos `*.original.css` preservados. Mantidas seis tentativas e durações 10/30/60 do Runner.
- Contato e exclusões reais somente na configuração local ignorada. `.env.example` sem valores reais.

## Evidência

Lint: de 14 erros/14 avisos para zero erros/11 avisos. Build aprovado com aviso de chunk acima de 500 kB. Passaram 55 testes unitários e três de Authentication local. Suíte e compilação das regras não executaram por falta de Java; testes de navegador e índices de produção pendentes.

Veja [relatório técnico](RELATORIO_TECNICO.md), [métricas](METRICAS_V2.json), [publicação](PUBLICACAO_V2.md) e [dados da conta](DADOS_E_CONTA_V2.md).
