# Relatório técnico — NEXTAGE v2

## Método

Linha de base: commit `13601d6`, anterior à implementação. A análise executada encontrou 14 erros/14 avisos em 32 arquivos, divergindo dos 12 erros/28 arquivos previstos no briefing; divergência apresentada e aceita. O dicionário observado tem 5.971 palavras, preservadas após confirmação.

`node scripts/measure-v2.mjs` reproduz [METRICAS_V2.json](METRICAS_V2.json), lendo código, Git e lockfile, sem inicializar Firebase. A medição final inclui novos scripts e testes. Complexidade usa a regra `complexity` do ESLint com limiar 1 apenas na medição das funções em `src`; inclui decisões em expressões JSX. Linhas físicas incluem comentários e JSX, até a última linha não vazia. As métricas não demonstram qualidade isoladamente.

## ESLint

| Regra | Erros antes | Avisos antes | Erros finais | Avisos finais |
|---|---:|---:|---:|---:|
| `no-unused-vars` | 9 | 0 | 0 | 0 |
| `react-hooks/set-state-in-effect` | 3 | 0 | 0 | 0 |
| `no-empty` | 1 | 0 | 0 | 0 |
| `react-refresh/only-export-components` | 1 | 0 | 0 | 0 |
| `react-hooks/exhaustive-deps` | 0 | 14 | 0 | 10 |
| **Total** | **14** | **14** | **0** | **10** |

Sem desabilitação genérica de regras. Provider, contexto e hook têm módulos próprios. Validação de campos do modal é derivada dos valores atuais; erros de envio são limpos na edição. A preparação do Runner agenda a transição de zero para início com `setTimeout(0)` no callback, acrescentando uma passagem pelo event loop nessa transição. Interação de navegador ainda não verificada.

Avisos remanescentes, todos react-hooks/exhaustive-deps:

| Local | Mensagem |
|---|---|
| src/components/GameBoard.jsx:94 | React Hook useEffect has a missing dependency: 'setExternalStreak'. Either include it or remove the dependency array. |
| src/pages/Runner.jsx:53 | React Hook useEffect has a missing dependency: 'stop'. Either include it or remove the dependency array. |
| src/pages/Runner.jsx:68 | React Hook useEffect has a missing dependency: 'start'. Either include it or remove the dependency array. |
| src/pages/Runner.jsx:104 | React Hook useEffect has missing dependencies: 'clearCurrentRow', 'incrementScore', 'resetBoard', and 'stop'. Either include them or remove the dependency array. |
| src/pages/Runner.jsx:114 | React Hook useEffect has a missing dependency: 'stop'. Either include it or remove the dependency array. |
| src/pages/Runner.jsx:123 | React Hook useEffect has a missing dependency: 'handleChangeTime'. Either include it or remove the dependency array. |
| src/pages/Runner.jsx:129 | React Hook useEffect has missing dependencies: 'finished', 'selectedTime', and 'start'. Either include them or remove the dependency array. |
| src/pages/Runner.jsx:140 | React Hook useEffect has a missing dependency: 'handleRestart'. Either include it or remove the dependency array. |
| src/pages/Runner.jsx:146 | React Hook useEffect has missing dependencies: 'score', 'selectedTime', and 'user'. Either include them or remove the dependency array. |
| src/pages/Runner.jsx:158 | React Hook useEffect has a missing dependency: 'handleRestart'. Either include it or remove the dependency array. |

Mantidos para preservar o ciclo dos jogos sem testes de interação. Callbacks recriados pelos hooks podem reinstalar efeitos continuamente. Adicionar seleção/estado final ao efeito do ranking pode iniciar Runner durante preparação; tornar salvamento reativo ao usuário pode salvar em login posterior. São dívida técnica, não evidência de ausência de defeitos. Mensagens completas constam no JSON.

## Acesso e rankings

Arquivos de componentes/páginas/contexto que importam diretamente Firestore: **7 antes, 0 finais**. Auth também foi movido aos serviços. `no-restricted-imports` impede SDK direto, variantes compat e módulo de conexão nessas camadas; a regra de arquitetura não substitui permissões do banco.

| Consulta | Documentos retornados | Agregações adicionais |
|---|---:|---|
| Ranking Clássico | Até 100 perfis com sequência positiva | Até uma contagem, para usuário com placar positivo fora da lista |
| Runner 10/30/60 | Até 100 perfis com recorde positivo na duração | Mesma condição |

Desempate por ID descendente; cursor inclui placar e ID. Perfil próprio vem da assinatura do contexto, com leituras independentes. Uma agregação não promete uma única leitura faturada: pode ler entradas de índice. Limites confirmados no código, sem medição de tráfego/custo real. Reabrir ou trocar duração faz nova consulta. Índices efetivos de produção não verificados.

## Modelo e regras

| Caminho | Campos principais | Leitura |
|---|---|---|
| `perfisPublicos/{uid}` | Apelido, sequência, perdas de sequência, recordes Runner, atualização | Pública |
| `jogadores/{uid}` | Versão do esquema, criação, consentimento/versionamento, `stats` | Dono/admin |
| `stats` (mapa privado) | Partidas, vitórias, derrotas, abandonos, tempos, tentativas de vitórias, médias, distribuição, `countersFixedAt` | Do documento privado |
| `jogadores/{uid}/partidas/{id}` | Modo, vitória, tentativas, tempo, abandono, data, palavra se concluída | Dono/admin |
| `jogadores/{uid}/palavras/{WORD}` | Aparições, vitórias, total/média de tentativas, primeira/melhor/última ocorrência, atualização | Dono |

Vitória/derrota regular grava quatro documentos na mesma transação; abandono não grava palavra. Médias globais de tempo/tentativas usam vitórias; média por palavra usa derrota = 7. Não se gravam nome ou e-mail na criação. Admin vem de custom claim `admin`, sem UID fixo no código. Termo versão 2 exige novo aceite quando muda a versão.

Regras validam esquema, tipos, tamanhos, timestamps, propriedade e alterações coordenadas via `getAfter`. Partidas não recebem update; primeira ocorrência da palavra é imutável. Exclusão permitida atende limpeza da conta. Coleções antigas não possuem acesso autorizado. Índices começam vazios por usar índices simples, sujeitos à verificação publicada. Auditoria estática em [AUDITORIA_REGRAS_V2.json](AUDITORIA_REGRAS_V2.json), provisória e sem garantia de segurança. Regras integrais no apêndice.

## Execuções e limites da evidência

| Comando | Resultado | Alcance |
|---|---|---|
| `npm run lint` | 0 erros, 10 avisos | Análise estática |
| `npm run build` | Aprovado, 651 módulos | Compilação sem navegador |
| `npm run test:unit` | 66 aprovados | Inclui restauração de partida, isolamento de contas/projetos e tempo preservado |
| `npm run test:browser` | 1 cenário extenso aprovado no Chrome headless | Visitante e conta fictícia, cadastro/aceite, teclas, recargas reais, vitória/derrota, reenvio de resultado e sequência 1 no ranking |
| `npm run test:auth` | 3 aprovados | Emulador Auth: senha válida/exclusão, senha incorreta, falha simulada na limpeza. Firestore simulado |
| `npm run test:rules` | 33 aprovados após instalar Java e corrigir o limite de expressões | Regras compiladas no Firestore Standard emulado; permissões, transações, histórico e ranking verificados |
| `npm run test:integration` | 1 cenário integrado aprovado | Serviços reais com Auth/Firestore locais: cadastro, aceite, senha errada/correta, vitória, idempotência, derrota, rankings Clássico/Runner |
| `npm run test:persistence` | Duas execuções aprovadas (gravar/exportar; reiniciar/importar) | Login, partida e ranking restaurados após encerrar ambos os emuladores; sem dados de produção |
| `npm run test:local` | 1 teste aprovado, dois ciclos reais | Início do app, resposta HTTP, encerramento pelo mesmo handler de Ctrl+C acionado por IPC, exportação e portas 8080/9099/5173 livres em cada ciclo |
| `node --check rules-tests/firestore.test.js` | Aprovado na Etapa 4 | Sintaxe JS, sem compilar regras |
| `node scripts/measure-v2.mjs` | Aprovado | Métricas reproduzíveis |

Build após continuidade do Clássico: JS 1.016,73 kB (gzip 310,72 kB), CSS 32,99 kB (gzip 7,31 kB). Aviso de chunk acima de 500 kB. Sem Lighthouse: tamanho comprimido não equivale a tempo medido de carregamento. O teste de navegador agora cobre teclado, cadastro/aceite e continuidade do Clássico; layout responsivo, popup Google, downloads e exclusão completa pela interface continuam sem validação automatizada. Scripts administrativos, migração e dry-run de dados reais não executados. Sem publicação, push ou mudança de produção pelo agente.

Dependências de execução mantidas. A instalação das ferramentas de desenvolvimento informou 32 vulnerabilidades (1 baixa, 19 moderadas, 11 altas, 1 crítica); registro daquela instalação, sem auditoria atual nem atribuição ao pacote servido ao navegador. Sem correção automática fora do escopo.

## Limitações conhecidas

- Lógica e tempos no cliente: placar forjável dentro dos limites. Sem servidor atestando partidas; regras não impõem bijeção completa entre todo incremento e histórico. IDs/transações evitam duplicação acidental, não fraude deliberada.
- Fechamento de aba não detectado. Abandono implementado no logout durante Clássico. Envio inválido/incompleto na sexta linha do Runner também pode encerrar a rodada, comportamento existente preservado.
- Apelidos validados em formato/tamanho, sem moderação.
- Contadores legados preservam semântica antiga; `countersFixedAt` marca correção dos incrementos, sem reconstruir o passado.
- Runner mantém recordes, sem histórico. Limites de placar são escolhas de projeto.
- Exclusão pode ser parcial, sem transação entre Firestore e Auth; bloqueio de gravações é local, sem coordenação entre abas/dispositivos. Não remove backups nem arquivos já baixados.
- SHA-256 truncado é pseudonimização, não anonimização. Colisões interrompem exportação. JSON pessoal inclui próprio apelido e possíveis campos legados.
- Repetições raras: 1.501 entradas/1.465 respostas distintas; duplicatas mantidas por decisão do usuário. Dicionário de 5.971 palavras, useRunner e CSS original preservados. A solicitação posterior de continuidade ampliou useWordle com inicialização opcional, sem alterar as seis tentativas/cálculo de cores.
- Complexidade/tamanho do perfil cresceram com as novas funções; separar seções e testar efeitos são trabalhos futuros. Onze avisos não foram ocultados.
- Regras passaram nos 33 testes do emulador; índices efetivos e integração no navegador continuam pendentes. Protótipo revisado e testado nesses cenários, sem alegação de segurança comprovada.

## Ações restantes do responsável

Continuidade solicitada após os testes do preview: Clássico passa a salvar palavra/tabuleiro/cursor/ID/início no navegador por conta e projeto, inclusive resultado pendente. Recarregar retoma em vez de sortear outra palavra. O tempo inclui o intervalo fora da página, limitado a 24 horas; reenvios usam o mesmo ID. O teste real no Chrome também simulou confirmação local perdida após uma vitória já gravada: o reenvio manteve sequência 1. A nova partida preserva a sequência e reinicia o tabuleiro. Isso não impede limpeza/edição do armazenamento nem coordena abas/dispositivos; placares ainda são informados pelo cliente. Veja [CONTINUIDADE_CLASSICO.md](CONTINUIDADE_CLASSICO.md). Nenhuma mudança de regras ou migração é necessária para esse armazenamento local.

Revisão do preview Vercel: o usuário forneceu erro de permissões do ranking e HTTP 403 no Authentication. Consulta somente à configuração pública de Auth, com o Referer do preview, confirmou `API_KEY_HTTP_REFERRER_BLOCKED`. Não houve tentativa de login nem leitura de documentos reais. A chave Web recusa esse endereço; a lista de sites permitidos precisa ser corrigida externamente. Após isso, retestar o ranking para distinguir eventual bloqueio adicional das regras efetivamente publicadas. Configurações remotas, regras e índices de produção não foram alterados. Foram preparados erros mais específicos e configuração Firebase opcional por ambiente, sem misturar projetos em configuração parcial. Passaram 60 testes unitários e o cenário integrado de login/rankings; build e lint permaneceram aprovados. Veja [PREVIEW_VERCEL.md](PREVIEW_VERCEL.md).

O ambiente local também foi corrigido para preservar contas e partidas em `.firebase/emulators-data`, com importação e exportação ao encerrar. O wrapper aguarda o CLI durante Ctrl+C; encerramento forçado pode perder alterações. Teste de persistência confirmou exportação e importação entre duas execuções distintas. Dados já perdidos não são recuperados, e o ranking local não contém os jogadores de produção. O modal agora permite tentar novamente após erro de login e bloqueia envios durante a operação. A interação visual não foi automatizada; o teste integrado valida os serviços reais, e não os cliques no navegador.

O retorno da falha de porta mostrou que apenas esperar o filho encerrar não resolvia a propagação de Ctrl+C no Windows. O pedido agora é enviado por IPC a um preload do CLI; Vite pertence ao executor, que o fecha antes de solicitar exportação e limpeza dos emuladores. Dois ciclos reais de inicialização e encerramento passaram com `test:local`. O teste cobre o handler de encerramento por IPC; não envia eventos de teclado globais do Windows. Quedas abruptas, encerramento forçado e desligamento do sistema continuam fora dessa garantia. Não se encerram processos desconhecidos automaticamente.

Após a entrega inicial, o teste manual encontrou recusa `permission-denied` na leitura do perfil público real, antes da publicação das regras v2. Foi preparado `dev:local`, com projeto fictício e emuladores. Microsoft OpenJDK 21 foi instalado e o executor passou a localizar o JDK mesmo com PATH antigo. A primeira execução dinâmica apresentou 24 testes aprovados e sete falhas: a validação da distribuição excedia 1.000 expressões e rejeitava transações válidas. Foi substituída por comparação das chaves alteradas e incremento somente da faixa correspondente. Os 31 testes originais e dois de regressão passaram: incluem salvar os quatro documentos de uma vitória, consultar a sequência no ranking, todas as seis faixas e rejeitar redistribuição indevida. Os três testes de Auth também passaram nas novas portas isoladas. Lint permanece com 0 erros/11 avisos. As métricas estáticas foram regeneradas após a correção do modal: 74 arquivos analisados, 0 erros e 11 avisos.

1. Reexecutar as suítes antes da publicação e testar a integração completa no navegador. Java e os 33 testes de regras já foram verificados nesta máquina.
2. Seguir [PUBLICACAO_V2.md](PUBLICACAO_V2.md): backup, cópia, publicação coordenada de regras/app, limpeza e claim; verificar índices e configuração do build.
3. Medir Lighthouse no endereço publicado, registrar condições e tirar capturas para o artigo.
4. Revisar avisos e tamanho do pacote em trabalho posterior, com testes de interação.

## Métricas detalhadas

Regeneradas após continuidade do Clássico: 82 arquivos analisados, 0 erros e 10 avisos.

### Complexidade por função (dez maiores)

#### Linha de base

| Arquivo/linha | Valor | Função |
|---|---:|---|
| src/components/AuthModal.jsx:13 | 22 | Function 'AuthModal' |
| src/components/UserSettingsModal.jsx:33 | 21 | Function 'UserSettingsModal' |
| src/pages/Auth.jsx:6 | 16 | Function 'Auth' |
| src/components/Header.jsx:17 | 15 | Function 'Header' |
| src/components/AuthModal.jsx:43 | 12 | Async function 'handleSubmit' |
| src/pages/Runner.jsx:72 | 12 | Function 'handleKey' |
| src/services/playerService.js:97 | 12 | Async function 'updatePlayerStats' |
| src/pages/Runner.jsx:14 | 11 | Function 'Runner' |
| src/services/adminService.js:26 | 11 | Arrow function |
| src/pages/Runner.jsx:200 | 9 | Function 'handleVirtualKey' |
#### Entrega atual

| Arquivo/linha | Valor | Função |
|---|---:|---|
| src/components/UserSettingsModal.jsx:37 | 41 | Function 'UserSettingsModal' |
| src/utils/classicSession.js:14 | 33 | Function 'restoreClassicRound' |
| src/utils/wordHistory.js:3 | 30 | Function 'nextWordDoc' |
| src/components/AuthModal.jsx:7 | 23 | Function 'AuthModal' |
| src/components/GameBoard.jsx:35 | 17 | Function 'ClassicRound' |
| src/components/AccountDataSection.jsx:21 | 16 | Function 'AccountDataSection' |
| src/components/RunnerRankingModal.jsx:7 | 16 | Function 'RunnerRankingModal' |
| src/pages/Auth.jsx:6 | 16 | Function 'Auth' |
| src/hooks/useWordle.js:4 | 12 | Function 'useWordle' |
| src/pages/Runner.jsx:71 | 12 | Function 'handleKey' |

Os validadores de restauração adicionam decisões; a complexidade mede funções separadamente, sem demonstrar qualidade isoladamente.

### Maiores componentes/páginas (linhas físicas)

| Arquivo | Antes | Final |
|---|---:|---:|
| src/components/UserSettingsModal.jsx | 311 | 428 |
| src/pages/Runner.jsx | 349 | 349 |
| src/components/GameBoard.jsx | 316 | 340 |
| src/components/AuthModal.jsx | 237 | 217 |
| src/components/Header.jsx | 190 | 163 |
| src/components/DevModal.jsx | 117 | 148 |
| src/pages/Auth.jsx | 128 | 129 |
| src/components/AccountDataSection.jsx | novo/fora do top 10 | 116 |
| src/components/RankingModal.jsx | 101 | 107 |
| src/components/RunnerRankingModal.jsx | novo/fora do top 10 | 107 |

### Versões resolvidas

| Biblioteca | Versão |
|---|---|
| @eslint/js | 10.0.1 |
| @firebase/rules-unit-testing | 5.0.2 |
| @types/react | 19.2.14 |
| @types/react-dom | 19.2.3 |
| @vitejs/plugin-react | 6.0.1 |
| eslint | 10.2.1 |
| eslint-plugin-react-hooks | 7.1.1 |
| eslint-plugin-react-refresh | 0.5.2 |
| firebase | 12.12.1 |
| firebase-admin | 14.5.0 |
| firebase-tools | 15.35.0 |
| globals | 17.5.0 |
| react | 19.2.5 |
| react-dom | 19.2.5 |
| react-router-dom | 7.14.2 |
| recharts | 3.8.1 |
| vite | 8.0.10 |

### Arquivos por camada

Entradas: src/main.jsx e src/App.jsx.

#### components (13)

- src/components/AccountDataSection.jsx
- src/components/AuthModal.jsx
- src/components/DevModal.jsx
- src/components/GameBoard.jsx
- src/components/Header.jsx
- src/components/InfoModal.jsx
- src/components/Keyboard.jsx
- src/components/Layout.jsx
- src/components/Modal.jsx
- src/components/RankingModal.jsx
- src/components/RunnerRankingModal.jsx
- src/components/TermsModal.jsx
- src/components/UserSettingsModal.jsx

#### pages (3)

- src/pages/Auth.jsx
- src/pages/Home.jsx
- src/pages/Runner.jsx

#### context (3)

- src/context/AuthContext.jsx
- src/context/authContextValue.js
- src/context/useAuth.js

#### hooks (2)

- src/hooks/useRunner.js
- src/hooks/useWordle.js

#### services (9)

- src/services/accountLifecycle.js
- src/services/accountService.js
- src/services/adminService.js
- src/services/authService.js
- src/services/classicSessionService.js
- src/services/firebase.js
- src/services/playerService.js
- src/services/rankingService.js
- src/services/wordService.js

#### utils (16)

- src/utils/accountDeletion.js
- src/utils/answers.js
- src/utils/classicSession.js
- src/utils/constants.js
- src/utils/dataExport.js
- src/utils/download.js
- src/utils/firebaseConfig.js
- src/utils/firebaseErrors.js
- src/utils/gameLogic.js
- src/utils/nickname.js
- src/utils/playerStats.js
- src/utils/profileLevel.js
- src/utils/pseudonym.js
- src/utils/researchExport.js
- src/utils/wordFeedback.js
- src/utils/wordHistory.js

#### styles (11)

- src/styles/auth.css
- src/styles/base.css
- src/styles/components.css
- src/styles/game.css
- src/styles/info-modal.css
- src/styles/layout.css
- src/styles/profile-modal.css
- src/styles/profile-modal.original.css
- src/styles/ranking.css
- src/styles/ranking.original.css
- src/styles/runner.css

Scripts em scripts/. Testes em tests/unit, tests/auth, tests/integration, tests/local, tests/browser e rules-tests. Configurações em firebase.json, firebase.tests.json, firestore.indexes.json, firestore.rules, vite.config.js e eslint.config.js.

## Apêndice: firestore.rules integral

Cópia final sincronizada. Regras compiladas no emulador Standard e 33 testes aprovados; isso não garante segurança fora dos cenários cobertos.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Protótipo v2. Limita formato/magnitude; não prova que uma partida ocorreu.
    // Calcular resultados em Cloud Functions seria o trabalho futuro definitivo.
    // Modelo: perfisPublicos = apelido, sequenciaAtual, sequenciasPerdidas,
    // runnerScores {10,30,60}, updatedAt. Nenhum nome/e-mail no documento público.
    // jogadores = schemaVersion, termsAccepted/At, termsVersion, createdAt, stats.
    // stats = contadores, totais de tempo/tentativas, médias, distribuição 1..6,
    // countersFixedAt. createdAt e countersFixedAt são imutáveis.
    // partidas = mode, won, attempts, timeMs, abandoned, createdAt e word opcional
    // (obrigatória fora de abandonos). Histórico imutável, mas pode ser excluído.
    // palavras = contadores, média, primeira/melhor/última ocorrência e timestamp;
    // id A-Z{5}, primeira ocorrência imutável. Derrota equivale a 7 tentativas.

    function owner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }
    function admin() {
      return request.auth != null && request.auth.token.get('admin', false) == true;
    }
    function closed(data, fields) {
      return data is map && data.keys().hasAll(fields) && data.keys().hasOnly(fields);
    }
    function counter(value) {
      return value is int && value >= 0 && value <= 1000000000;
    }
    function total(value) {
      return value is int && value >= 0 && value <= 9007199254740991;
    }
    function time(value) {
      return value is int && value >= 0 && value <= 86400000;
    }
    function delta(before, after) {
      let difference = after - before;
      return difference >= 0 && difference <= 1;
    }
    function playerBefore(uid) {
      return get(/databases/$(database)/documents/jogadores/$(uid)).data;
    }
    function playerAfter(uid) {
      return getAfter(/databases/$(database)/documents/jogadores/$(uid)).data;
    }
    function accepted(uid) {
      let player = playerAfter(uid);
      return player.termsAccepted == true && player.termsVersion == '2';
    }
    function runner(scores) {
      return closed(scores, ['10', '30', '60'])
        && scores['10'] is int && scores['10'] >= 0 && scores['10'] <= 10
        && scores['30'] is int && scores['30'] >= 0 && scores['30'] <= 30
        && scores['60'] is int && scores['60'] >= 0 && scores['60'] <= 60;
    }
    function validPublic(data) {
      return closed(data, ['apelido', 'sequenciaAtual', 'sequenciasPerdidas', 'runnerScores', 'updatedAt'])
        && data.apelido is string && data.apelido.size() >= 3 && data.apelido.size() <= 20
        && data.apelido.matches('[A-Za-z0-9_-]{3,20}')
        && counter(data.sequenciaAtual) && counter(data.sequenciasPerdidas)
        && runner(data.runnerScores) && data.updatedAt == request.time;
    }
    function publicCounters(uid, before, after) {
      let oldStats = playerBefore(uid).stats;
      let newStats = playerAfter(uid).stats;
      return (after.sequenciaAtual == before.sequenciaAtual
          && after.sequenciasPerdidas == before.sequenciasPerdidas)
        || (accepted(uid) && newStats.totalGames == oldStats.totalGames + 1
          && ((newStats.totalWins == oldStats.totalWins + 1
              && after.sequenciaAtual == before.sequenciaAtual + 1
              && after.sequenciasPerdidas == before.sequenciasPerdidas)
            || (newStats.totalLosses + newStats.abandonedGames
                  == oldStats.totalLosses + oldStats.abandonedGames + 1
              && after.sequenciaAtual == 0
              && after.sequenciasPerdidas == before.sequenciasPerdidas + 1)));
    }
    function publicUpdate(uid, before, after) {
      return after.runnerScores['10'] >= before.runnerScores['10']
        && after.runnerScores['30'] >= before.runnerScores['30']
        && after.runnerScores['60'] >= before.runnerScores['60']
        && (after.runnerScores == before.runnerScores || accepted(uid))
        && publicCounters(uid, before, after);
    }
    function distribution(data) {
      return closed(data, ['1', '2', '3', '4', '5', '6'])
        && counter(data['1']) && counter(data['2']) && counter(data['3'])
        && counter(data['4']) && counter(data['5']) && counter(data['6']);
    }
    function distributionSum(data) {
      return data['1'] + data['2'] + data['3'] + data['4'] + data['5'] + data['6'];
    }
    function validStats(data) {
      return closed(data, ['totalGames', 'totalWins', 'totalLosses', 'abandonedGames',
          'totalTimeMs', 'totalPlayTimeMs', 'totalAttempts', 'avgTimePerWord',
          'avgAttemptsPerWord', 'guessDistribution', 'countersFixedAt'])
        && counter(data.totalGames) && counter(data.totalWins)
        && counter(data.totalLosses) && counter(data.abandonedGames)
        && data.totalWins <= data.totalGames
        && total(data.totalTimeMs) && total(data.totalPlayTimeMs)
        && data.totalPlayTimeMs >= data.totalTimeMs && total(data.totalAttempts)
        && data.avgTimePerWord is number && data.avgTimePerWord >= 0
        && data.avgTimePerWord <= 86400000
        && data.avgAttemptsPerWord is number && data.avgAttemptsPerWord >= 0
        && data.avgAttemptsPerWord <= 6
        && distribution(data.guessDistribution)
        && data.countersFixedAt is timestamp && data.countersFixedAt <= request.time;
    }
    function zeroStats(data) {
      return data.totalGames == 0 && data.totalWins == 0 && data.totalLosses == 0
        && data.abandonedGames == 0 && data.totalTimeMs == 0
        && data.totalPlayTimeMs == 0 && data.totalAttempts == 0
        && data.avgTimePerWord == 0 && data.avgAttemptsPerWord == 0
        && distributionSum(data.guessDistribution) == 0
        && data.countersFixedAt == request.time;
    }
    function validPlayer(data) {
      return closed(data, ['schemaVersion', 'termsAccepted', 'termsAcceptedAt',
          'termsVersion', 'createdAt', 'stats'])
        && data.schemaVersion is int && data.schemaVersion == 2 && data.termsAccepted is bool
        && data.termsVersion == '2'
        && ((data.termsAccepted && data.termsAcceptedAt is timestamp
            && data.termsAcceptedAt <= request.time)
          || (!data.termsAccepted && data.termsAcceptedAt == null))
        && data.createdAt is timestamp && data.createdAt <= request.time
        && validStats(data.stats);
    }
    function validConsent(before, after) {
      return (after.termsAccepted == before.termsAccepted
          && after.termsAcceptedAt == before.termsAcceptedAt
          && after.termsVersion == before.termsVersion)
        || (after.termsAccepted && after.termsAcceptedAt == request.time);
    }
    function distributionUpdate(before, after, wins, attempts) {
      // Uma vitória incrementa somente a faixa de tentativas correspondente.
      // Evita recalcular somas e pesos das seis faixas e exceder 1000 expressões.
      let bucket = string(attempts);
      return (wins == 0 && after == before)
        || (wins == 1 && attempts >= 1 && attempts <= 6
          && after.diff(before).affectedKeys().hasOnly([bucket])
          && after[bucket] == before[bucket] + 1);
    }
    function statsUpdate(before, after) {
      let games = after.totalGames - before.totalGames;
      let wins = after.totalWins - before.totalWins;
      let losses = after.totalLosses - before.totalLosses;
      let abandoned = after.abandonedGames - before.abandonedGames;
      let playTime = after.totalPlayTimeMs - before.totalPlayTimeMs;
      let attempts = after.totalAttempts - before.totalAttempts;
      return after.countersFixedAt == before.countersFixedAt
        && delta(before.totalGames, after.totalGames)
        && delta(before.totalWins, after.totalWins)
        && delta(before.totalLosses, after.totalLosses)
        && delta(before.abandonedGames, after.abandonedGames)
        && games == wins + losses + abandoned
        && ((games == 0 && after == before)
          || (games == 1 && time(playTime)
            && after.totalTimeMs - before.totalTimeMs == (wins == 1 ? playTime : 0)
            && ((wins == 1 && attempts >= 1 && attempts <= 6) || (wins == 0 && attempts == 0))
            && distributionUpdate(before.guessDistribution, after.guessDistribution, wins, attempts)
            && ((after.totalWins == 0 && after.avgTimePerWord == 0 && after.avgAttemptsPerWord == 0)
              || (after.totalWins > 0
                && math.abs(after.avgTimePerWord - after.totalTimeMs * 1.0 / after.totalWins) < 0.000001
                && math.abs(after.avgAttemptsPerWord - after.totalAttempts * 1.0 / after.totalWins) < 0.000001))));
    }
    function profileAfterMatch(uid, before, after) {
      let oldProfile = get(/databases/$(database)/documents/perfisPublicos/$(uid)).data;
      let newProfile = getAfter(/databases/$(database)/documents/perfisPublicos/$(uid)).data;
      return (after.totalGames == before.totalGames)
        || (accepted(uid) && newProfile.updatedAt == request.time
          && ((after.totalWins == before.totalWins + 1
              && newProfile.sequenciaAtual == oldProfile.sequenciaAtual + 1
              && newProfile.sequenciasPerdidas == oldProfile.sequenciasPerdidas)
            || (after.totalWins == before.totalWins && newProfile.sequenciaAtual == 0
              && newProfile.sequenciasPerdidas == oldProfile.sequenciasPerdidas + 1)));
    }
    function validMatch(data) {
      return data.keys().hasAll(['mode', 'won', 'attempts', 'timeMs', 'abandoned', 'createdAt'])
        && data.keys().hasOnly(['mode', 'won', 'attempts', 'timeMs', 'abandoned', 'word', 'createdAt'])
        && data.mode == 'classico' && data.won is bool && data.abandoned is bool
        && data.attempts is int && time(data.timeMs) && data.createdAt == request.time
        && ((data.abandoned && !data.won && data.attempts == 0 && !('word' in data))
          || (!data.abandoned && data.word is string && data.word.matches('[A-Z]{5}')
            && ((data.won && data.attempts >= 1 && data.attempts <= 6)
              || (!data.won && data.attempts == 6))));
    }
    function matchStats(uid, data) {
      let before = playerBefore(uid).stats;
      let after = playerAfter(uid).stats;
      return accepted(uid) && after.totalGames == before.totalGames + 1
        && after.totalPlayTimeMs == before.totalPlayTimeMs + data.timeMs
        && after.totalWins - before.totalWins == (data.won ? 1 : 0)
        && after.totalLosses - before.totalLosses == (!data.won && !data.abandoned ? 1 : 0)
        && after.abandonedGames - before.abandonedGames == (data.abandoned ? 1 : 0)
        && after.totalAttempts - before.totalAttempts == (data.won ? data.attempts : 0);
    }
    function wordAttempts(won, attempts) {
      return won is bool && attempts is int
        && ((won && attempts >= 1 && attempts <= 6) || (!won && attempts == 7));
    }
    function validWord(word, data) {
      return word.matches('[A-Z]{5}')
        && closed(data, ['vezesVista', 'vitorias', 'totalTentativas', 'mediaTentativas',
          'primeiraVenceu', 'primeiraTentativas', 'primeiraTempoMs', 'melhorTentativas',
          'melhorTempoMs', 'ultimaVenceu', 'ultimaTentativas', 'ultimaTempoMs', 'atualizadoEm'])
        && counter(data.vezesVista) && data.vezesVista >= 1
        && counter(data.vitorias) && data.vitorias <= data.vezesVista
        && total(data.totalTentativas) && data.totalTentativas >= data.vezesVista
        && data.totalTentativas <= 7 * data.vezesVista
        && data.mediaTentativas is number && data.mediaTentativas >= 1 && data.mediaTentativas <= 7
        && math.abs(data.mediaTentativas - data.totalTentativas * 1.0 / data.vezesVista) < 0.000001
        && wordAttempts(data.primeiraVenceu, data.primeiraTentativas) && time(data.primeiraTempoMs)
        && wordAttempts(data.ultimaVenceu, data.ultimaTentativas) && time(data.ultimaTempoMs)
        && data.melhorTentativas is int && data.melhorTentativas >= 1 && data.melhorTentativas <= 7
        && data.melhorTentativas <= data.primeiraTentativas && data.melhorTentativas <= data.ultimaTentativas
        && time(data.melhorTempoMs) && data.atualizadoEm == request.time;
    }
    function firstWord(data) {
      return data.vezesVista == 1 && data.vitorias == (data.ultimaVenceu ? 1 : 0)
        && data.totalTentativas == data.ultimaTentativas
        && data.primeiraVenceu == data.ultimaVenceu
        && data.primeiraTentativas == data.ultimaTentativas
        && data.primeiraTempoMs == data.ultimaTempoMs
        && data.melhorTentativas == data.ultimaTentativas
        && data.melhorTempoMs == data.ultimaTempoMs;
    }
    function wordUpdate(before, after) {
      let better = after.ultimaTentativas < before.melhorTentativas;
      let faster = after.ultimaTentativas == before.melhorTentativas
        && after.ultimaVenceu && after.ultimaTempoMs < before.melhorTempoMs;
      return after.vezesVista == before.vezesVista + 1
        && after.vitorias == before.vitorias + (after.ultimaVenceu ? 1 : 0)
        && after.totalTentativas == before.totalTentativas + after.ultimaTentativas
        && after.primeiraVenceu == before.primeiraVenceu
        && after.primeiraTentativas == before.primeiraTentativas
        && after.primeiraTempoMs == before.primeiraTempoMs
        && after.melhorTentativas == (better ? after.ultimaTentativas : before.melhorTentativas)
        && after.melhorTempoMs == (better || faster ? after.ultimaTempoMs : before.melhorTempoMs);
    }
    function wordStats(uid, data) {
      let before = playerBefore(uid).stats;
      let after = playerAfter(uid).stats;
      return accepted(uid) && after.totalGames == before.totalGames + 1
        && after.totalWins - before.totalWins == (data.ultimaVenceu ? 1 : 0)
        && after.totalLosses - before.totalLosses == (data.ultimaVenceu ? 0 : 1)
        && after.totalPlayTimeMs - before.totalPlayTimeMs == data.ultimaTempoMs
        && after.totalAttempts - before.totalAttempts == (data.ultimaVenceu ? data.ultimaTentativas : 0);
    }

    match /perfisPublicos/{uid} {
      // Leitura pública solicitada explicitamente, inclusive a consulta de contagem.
      allow read: if true;
      allow create: if owner(uid) && validPublic(request.resource.data)
        && request.resource.data.sequenciaAtual == 0 && request.resource.data.sequenciasPerdidas == 0
        && request.resource.data.runnerScores == {'10': 0, '30': 0, '60': 0};
      allow update: if owner(uid) && validPublic(request.resource.data)
        && publicUpdate(uid, resource.data, request.resource.data);
      allow delete: if owner(uid) || admin();
    }
    match /jogadores/{uid} {
      allow read: if owner(uid) || admin();
      allow create: if owner(uid) && validPlayer(request.resource.data)
        && request.resource.data.createdAt == request.time
        && request.resource.data.termsAccepted == false && zeroStats(request.resource.data.stats);
      allow update: if owner(uid) && validPlayer(request.resource.data)
        && request.resource.data.createdAt == resource.data.createdAt
        && validConsent(resource.data, request.resource.data)
        && statsUpdate(resource.data.stats, request.resource.data.stats)
        && profileAfterMatch(uid, resource.data.stats, request.resource.data.stats);
      allow delete: if owner(uid) || admin();

      match /partidas/{matchId} {
        allow read: if owner(uid) || admin();
        allow create: if owner(uid) && validMatch(request.resource.data)
          && matchStats(uid, request.resource.data);
        allow update: if false;
        allow delete: if owner(uid) || admin();
      }
      match /palavras/{word} {
        allow read: if owner(uid);
        allow create: if owner(uid) && validWord(word, request.resource.data)
          && firstWord(request.resource.data) && wordStats(uid, request.resource.data);
        allow update: if owner(uid) && validWord(word, request.resource.data)
          && wordUpdate(resource.data, request.resource.data) && wordStats(uid, request.resource.data);
        allow delete: if owner(uid) || admin();
      }
    }
    // Sem permissões para dicionario, config, doacoes ou qualquer coleção não usada.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
