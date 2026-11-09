# Alterações do NEXTAGE v2

## Continuidade do Clássico solicitada após os testes do preview

Recarregar não sorteia outra palavra nem apaga tentativas. O rascunho local preserva tabuleiro, cursor, início e ID da partida, separado por conta/projeto. Vitórias e derrotas concluídas também são restauradas; a gravação usa ID estável e permite tentar novamente após falha, antes de novo jogo. Logout com abandono registrado e exclusão de conta limpam o rascunho.

Esta solicitação posterior amplia a restrição inicial de não tocar no hook: `useWordle` recebeu inicialização opcional e callback de conclusão, sem mudar a lógica de seis tentativas/cálculo de cores. Chamadas do Runner mantêm os padrões existentes; `useRunner`, respostas, dicionário e CSS original não mudaram. Detalhes e limitações em [CONTINUIDADE_CLASSICO.md](CONTINUIDADE_CLASSICO.md).

## Revisão posterior: login e ranking no preview Vercel

O preview utiliza o projeto Firebase original quando não há configuração própria; a publicação da branch não atualiza regras ou migrações. Preparadas variáveis opcionais `VITE_FIREBASE_*` para um projeto de teste, com validação de configuração completa e sem herdar bucket/remetente de outro projeto. Nenhuma configuração externa foi alterada.

Centralizadas mensagens de erro e diagnóstico por código, sem imprimir credenciais/respostas brutas. Modal e página de Auth usam o mesmo tratamento; rankings Clássico/Runner distinguem conexão e indisponibilidade. Login Google também bloqueia envios concorrentes. Passaram 60 testes unitários, build, cenário integrado e lint (0 erros/11 avisos).

A recusa do login foi confirmada: consulta pública da configuração do Authentication com o Referer do preview retornou HTTP 403, `API_KEY_HTTP_REFERRER_BLOCKED`. Nenhum login ou acesso a dados reais foi realizado. A lista de sites permitidos da chave precisa ser corrigida externamente; depois, retestar o ranking para verificar eventual bloqueio adicional pelas regras. Nenhuma configuração remota foi alterada e o ambiente publicado não é declarado corrigido. Detalhes em [PREVIEW_VERCEL.md](PREVIEW_VERCEL.md).

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

## Ajuste posterior: desenvolvimento isolado

O teste manual do usuário encontrou `permission-denied` na leitura de `perfisPublicos` do projeto real, antes da publicação das regras v2. Foi adicionado `npm run dev:local`: inicia Auth/Firestore emulados e Vite no modo `emulators`, usando o projeto fictício `demo-nextage-v2`. O comando normal e o build de produção continuam usando a configuração real. Nenhuma regra de produção foi modificada.

Lint (0 erros/11 avisos), build, 55 testes unitários e três de Auth foram revalidados nessa preparação. O Java ausente impediu inicialmente o teste completo; a execução posterior e a correção estão descritas abaixo.

## Correção posterior: gravação de partidas e ranking vazio

Instalado Microsoft OpenJDK 21 e adicionada localização do JDK no executor para terminais com PATH antigo. A primeira execução da suíte retornou 24 aprovações e sete falhas: distribuição de tentativas excedia o limite de 1.000 expressões. Regras agora validam somente a faixa alterada, com o incremento exato e os mesmos controles de propriedade/esquema. Os 33 testes passaram, incluindo salvar vitória/palavra e consultar sequência no ranking público, validar seis faixas e bloquear alterações indevidas. Três testes de Auth passaram novamente; lint com 0 erros/11 avisos.

Testes usam `firebase.tests.json` e portas próprias para não apagar dados do jogo local. Nenhuma configuração de produção foi alterada. O ranking filtra sequências positivas: com gravações rejeitadas, a mensagem de lista vazia era esperada. Validação de navegador pelo usuário continua necessária.

## Correção posterior: contas perdidas ao reiniciar e repetição de login

O modo local inicialmente descartava contas/partidas ao encerrar, causando login recusado e ranking vazio após reiniciar. `dev:local` agora importa/exporta `.firebase/emulators-data` (ignorado pelo Git); Ctrl+C aguarda o CLI filho terminar a exportação. Encerramento forçado ainda pode perder alterações. Dados perdidos anteriormente não são recuperados.

O modal permite repetir envio após erro de autenticação e bloqueia envios concorrentes durante a operação. O erro anterior não torna campos válidos inválidos permanentemente.

Adicionados `test:integration` e `test:persistence`, sem dependências novas. O primeiro passou com os serviços reais em ambos os emuladores, cobrindo cadastro/aceite, senha errada/correta, vitória, idempotência, derrota e rankings. O segundo confirmou a restauração de conta, partida e ranking após exportar, encerrar e iniciar nova execução. A primeira tentativa deste teste usou `--force`, não suportado pelo CLI instalado; a opção foi removida e a execução completa passou. Lint com 0 erros/11 avisos e build aprovados. Navegador ainda depende de confirmação manual.

## Correção posterior: processo órfão ocupando 8080

A espera passiva por Ctrl+C não bastava no Windows. O executor agora envia o pedido de encerramento por IPC a um preload do CLI, que aciona os handlers de exportação/limpeza sem `kill` abrupto. Vite roda dentro do executor, evitando outro processo de servidor órfão. O app usa `emulators:start`; as suítes continuam usando `emulators:exec`.

Adicionado `test:local`: dois ciclos reais passaram, com resposta HTTP, exportação concluída e portas 8080/9099/5173 livres após cada encerramento. O teste aciona o mesmo handler de Ctrl+C por IPC, sem simular teclado global do Windows. A primeira tentativa detectou um caminho de preload inválido no Windows; corrigido para URL `file:` antes da execução aprovada. O processo órfão já existente foi identificado pelo executável, projeto fictício e caminho das regras, e encerrado individualmente. Não há encerramento automático de processos desconhecidos.
