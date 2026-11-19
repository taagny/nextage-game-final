# NEXTAGE v2

Jogo de palavras em React: Clássico, Runner, rankings, histórico por palavra e controles da conta. JavaScript/ESM, Vite, Firebase Authentication e Firestore.

## Desenvolvimento

Ambiente utilizado: Node 24.21.0. Execute `npm ci`, copie `.env.example` para `.env.local` e configure contato e contas excluídas da pesquisa. Não versione valores reais nem credenciais administrativas. Variáveis `VITE_` são públicas no aplicativo compilado.

```sh
npm run dev
npm run dev:local
npm run lint
npm run format:check
npm run build
npm run preview
npm run test:unit
npm run test:auth
npm run test:rules
npm run test:integration
npm run test:backup
npm run test:cutover
npm run test:persistence
npm run test:local
npm run test:browser
npm run audit:responsive
node scripts/measure-v2.mjs
```

Emuladores usam projeto fictício `demo-nextage-v2`. O executor filtra variáveis herdadas. Firestore requer Java 21+ e pode baixar artefatos no primeiro uso.

### Testar a branch antes de publicar

`npm run dev` conecta ao Firebase real. Se as regras v2 ainda não estiverem publicadas, criar/carregar o novo perfil pode falhar com `permission-denied` ao acessar `perfisPublicos`. Isso não é resolvido pelo build nem por reenviar o formulário; a conta no Authentication pode já ter sido criada.

Para desenvolvimento isolado, instale Java compatível com o Firebase CLI (Java 21 ou superior) e pare o servidor anterior com Ctrl+C. Execute **`npm run dev:local`**: ele inicia Authentication em `127.0.0.1:9099`, Firestore em `127.0.0.1:8080` com as regras deste repositório e Vite em **http://127.0.0.1:5173**. Se uma porta estiver ocupada, encerre o processo anterior antes de repetir.

Esse comando usa o modo Vite `emulators`, com projeto fictício `demo-nextage-v2`, sem reutilizar a sessão de produção. Na primeira execução, cadastre uma conta fictícia. Agora o executor importa e exporta contas e dados em `.firebase/emulators-data`, ignorado pelo Git. Para encerrar, pressione Ctrl+C uma vez e aguarde **Export complete** antes de fechar o terminal. Matar processos ou desligar abruptamente pode perder alterações não exportadas. Contas perdidas em reinícios anteriores precisam ser recriadas; não há restauração retroativa.

Se os emuladores não iniciarem, o Vite não é iniciado por esse comando. Não há fallback para o banco real. As variáveis de `.env.local` continuam disponíveis ao Vite. O ranking local contém somente participantes locais com sequência positiva, e não importa os jogadores do site publicado.

`test:integration` usa os serviços reais do aplicativo com Auth e Firestore emulados: cadastro, aceite, erro de senha, novo login, vitória, prevenção de duplicação, derrota e rankings Clássico/Runner. `test:persistence` cria dados fictícios, exporta, encerra os emuladores, inicia nova execução e verifica login, partida e posição restaurados. Usa `.firebase/persistence-test`, sem tocar nos dados do app. Ambos passaram; não substituem testes visuais de navegador.

`dev:local` mantém o Vite no processo do executor e inicia os emuladores com `emulators:start`. Ctrl+C envia um pedido de encerramento por IPC ao CLI, que executa exportação e limpeza, evitando depender da propagação de sinais do Windows. `test:local` verificou dois ciclos reais de início/encerramento/reinício, resposta HTTP e liberação de 8080/9099/5173, acionando o mesmo handler por IPC. Esse teste exige que o app esteja parado; importa/exporta os dados locais existentes, sem apagá-los. O pressionamento físico de Ctrl+C continua sujeito à confirmação manual no terminal.

No Windows, se o terminal ainda tiver o PATH anterior à instalação, o executor procura Java 21+ em `JAVA_HOME` e nas instalações Microsoft OpenJDK em `Program Files`. O ajuste vale somente para o processo filho; não modifica o ambiente global.

O modo de emulação é exclusivo de desenvolvimento. `npm run build` continua usando a configuração real. Não publique regras isoladamente para destravar o teste: siga a ordem de migração/publicação documentada. Os testes usam `firebase.tests.json`, com Firestore em 8085 e Auth em 9098, sem limpar os dados do app em 8080/9099. Reinicie o servidor local após mudanças na configuração. Testes de navegador permanecem necessários.

Verificação da publicação em 18/11/2026: formatação aprovada, lint com zero erros e zero avisos, build aprovado, 76 testes unitários, 36 testes de regras e ensaio de migração/recuperação em emuladores aprovados. O teste local no Chrome cobriu recargas sem duplicação, downloads pessoais, exclusão de conta e a regressão do Runner. No site publicado, nove verificações com conta fictícia cobriram visitante, ranking, cadastro, aceite sem pesquisa, salvamento, recarga, configurações e novo login; a conta e seus dados foram removidos ao final. O login Google real depende de conferência manual; foi confirmado anteriormente no preview de testes. Esses ensaios operacionais não são resultados de pesquisa com participantes.

## Organização e dados

O seletor de sol/lua no cabeçalho alterna entre os temas escuro e claro, inclusive sem conta. O tema escuro é o padrão; a preferência fica em `nextage:theme` no navegador e acompanha recargas e abas da mesma origem. Com armazenamento bloqueado, a escolha vale para a sessão atual. As cores de acerto, presença e ausência continuam distintas nos dois temas.

Para auditar os dois temas em emuladores, execute separadamente `npm run audit:responsive -- theme-dark dark` e `npm run audit:responsive -- theme-light light`. A auditoria também verifica persistência do tema, alternância com armazenamento bloqueado e ativação por Enter sem enviar uma tentativa.

A revisão de responsividade (documento local: `docs/RESPONSIVIDADE.md`) cobriu oito tamanhos entre 320 × 568 e 1440 × 900, com 136 verificações finais de páginas e modais. O cabeçalho, teclado e modais foram ajustados; o Clássico usa duas colunas em telas horizontais baixas. Capturas e medições podem ser reproduzidas com `npm run audit:responsive`.

O Clássico agora retoma a mesma palavra e tentativas após recarregar, usando armazenamento local separado por projeto/conta. Resultados pendentes preservam o ID e podem ser reenviados sem duplicar a partida. Veja continuidade do Clássico (documento local: `docs/CONTINUIDADE_CLASSICO.md`) para ciclo, testes e limites: isso não impede manipulação deliberada do navegador nem sincroniza abas/dispositivos.

Interface e contexto chamam `src/services`; ESLint impede imports diretos de Auth/Firestore nessas camadas. Hooks ficam em `src/hooks`; cálculos em `src/utils`.

| Caminho                           | Conteúdo                                                | Leitura    |
| --------------------------------- | ------------------------------------------------------- | ---------- |
| `perfisPublicos/{uid}`            | Apelido, sequência, perdas, recordes Runner             | Pública    |
| `jogadores/{uid}`                 | Consentimento e estatísticas privadas                   | Dono/admin |
| `jogadores/{uid}/partidas/{id}`   | Desfecho Clássico, tentativas, tempo, palavra, abandono | Dono/admin |
| `jogadores/{uid}/palavras/{WORD}` | Primeira/melhor/última ocorrência, médias               | Dono       |

Vitória/derrota atualiza quatro documentos em transação. Abandono por logout não registra palavra. Visitantes jogam sem persistência. Nível intermediário a partir de 100 vitórias; avançado a partir de 500.

Ranking retorna até 100 documentos e, quando necessário para posição fora da lista, uma contagem adicional. Perfil acompanhado no contexto tem leituras próprias; agregação não implica uma única leitura faturada.

## Consentimento e conta

Termo de uso versão 3 e autorização de pesquisa versão 1 são separados; participar da pesquisa é opcional e desmarcado por padrão. Configurações permitem revogar a pesquisa mantendo conta, progresso e ranking. As exportações verificam autorização vigente e a revalidam antes do arquivo. Contato em `VITE_CONTACT_EMAIL`. A exclusão da conta é independente e remove subcoleções em lotes, perfis e por último Authentication; pode falhar parcialmente.

Pesquisa exige claim `admin: true`, lista de exclusão configurada e abertura de uma chave de pesquisa. O administrador gera um arquivo de chave aleatória de 256 bits, guarda-o separado e o abre a cada uso do painel. Reutilizar a mesma chave mantém os códigos; trocar a chave muda os códigos e seu identificador. A chave não é enviada ao banco, não fica no bundle/env/localStorage e não acompanha os dados exportados. Não há recuperação pelo aplicativo.

Exportações usam HMAC-SHA-256 com domínio específico, 64 caracteres hexadecimais e campos permitidos, sem nome, e-mail, apelido ou UID bruto. O identificador não secreto da chave acompanha os arquivos para distinguir conjuntos. Os arquivos novos são incompatíveis com os antigos pseudônimos SHA-256 truncados; não misturar versões sem conferir o esquema. HMAC é pseudonimização, não garantia de anonimato. JSON pessoal inclui os próprios dados e apelido.

A base bruta de palavras foi identificada por comparação integral com FrequencyWords. Créditos, licença dos dados e escopo da investigação estão em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) e na ajuda do jogo. O autor identificou o código público do Charada como fonte imediata das respostas, apoiado pela comparação das listas; a fonte anterior e a licença específica dessa seleção continuam em investigação. A lista de respostas e suas probabilidades foram preservadas.

## Regras e publicação

Para falhas no preview hospedado da branch, veja login e ranking na Vercel (documento local: `docs/PREVIEW_VERCEL.md`). O preview usa o Firebase real por padrão e não publica regras/migrações. É possível configurar outro projeto com as variáveis `VITE_FIREBASE_*` do `.env.example`, restritas ao ambiente Preview da Vercel. Configuração parcial é recusada para não misturar projetos.

`firestore.rules`, `firestore.indexes.json` e `firebase.json` versionam configuração. Regras são protótipo sujeito à suíte e revisão: resultados do cliente podem ser forjados dentro dos limites.

Em 18/11/2026, com autorização do responsável, a branch foi integrada à main e publicada em produção. A janela bloqueou o acesso dos clientes, atualizou e verificou uma cópia limitada dos documentos da migração, criou 388 perfis públicos e adequou 388 documentos privados. Os scripts não escreveram nas subcoleções de histórico. O deployment foi comparado ao build local com os mesmos metadados públicos da Vercel, antes de reabrir o acesso com as regras normais. O Firebase de testes permanece separado da produção.

Scripts: `scripts/migrate-v2.mjs` (`--copy`/`--cleanup`, dry-run padrão) e `scripts/set-admin-claim.mjs` (consulta padrão). Exigem projeto explícito e credencial externa. Só o responsável deve executá-los seguindo o roteiro.

A preparação do merge é separada da publicação de produção. Antes de integrar à `main`, revisar as variáveis **Production** da hospedagem, guardar backup restaurável e preparar uma janela que impeça gravações do aplicativo antigo desde a cópia dos perfis até o fim da migração. Só fechar o site para novas visitas não bloqueia abas já abertas. A migração usa Admin SDK; suas gravações não dependem das regras do cliente. Voltar apenas o frontend antigo depois da limpeza do esquema não desfaz a migração: a recuperação precisa coordenar aplicativo, regras e dados. Não execute `--cleanup` como tentativa de corrigir um erro sem antes revisar o dry-run e o backup.

### Cópia lógica local do Firestore

`npm run test:cutover` ensaia a janela de migração com dados fictícios e os scripts reais em emuladores: bloqueio de acesso do cliente, cópia, limpeza e recuperação. Verifica alterações concorrentes, preservação de perfis públicos existentes e histórico, além de repetição segura da recuperação. Não acessa produção.

`firebase.maintenance.json` aponta para `firestore.maintenance.rules`, que bloqueia temporariamente todas as leituras e gravações dos clientes, inclusive de administradores autenticados. O Admin SDK continua operando por IAM. Essa configuração é exclusiva da janela coordenada; sua publicação interrompe o acesso aos dados do jogo e exige autorização do responsável.

`node scripts/rollback-v2.mjs --project ID --backup ARQUIVO --auth-dates METADADOS` apenas apresenta o plano de recuperação. Aplicar exige `--apply --confirm-project ID` e, em produção, as regras de manutenção ativas. A recuperação aceita somente a cópia limitada e os metadados de criação do Authentication vinculados ao mesmo hash. Restaura documentos principais de jogadores e remove apenas perfis públicos comprovadamente criados pela migração; não escreve no histórico. Dados inesperados ou alterações concorrentes interrompem a operação. O retorno ao aplicativo anterior também exige restaurar as regras e o deployment anteriores, antes de reabrir o acesso.

`scripts/backup-firestore.mjs --project ID --out .firebase/private-backups/ARQUIVO.json` usa credencial externa via `GOOGLE_APPLICATION_CREDENTIALS` e somente lê documentos remotos. Percorre todas as coleções/subcoleções, inclusive pais ausentes, preserva os tipos suportados e interrompe em tipos desconhecidos. Guarda campos e caminhos privados: manter o arquivo restrito e fora do Git. Não substitui um backup gerenciado: não é snapshot atômico e não inclui Authentication, regras, índices ou Storage. As leituras consomem a quota do banco; uma migração exige nova cópia com gravações suspensas.

`--verify ARQUIVO.json --project ID` confere integridade e formato localmente, sem credencial ou conexão remota. `--rehearse-local ARQUIVO.json --project demo-ID` só restaura em emulador `127.0.0.1` e recusa documentos existentes. Não há opção de restauração em produção nesse comando. A conferência com dados fictícios está em `npm run test:backup`; cada cópia real exige sua própria verificação. O hash detecta alterações acidentais, não autentica quem produziu o arquivo.

Quando o objetivo autorizado for preservar somente os documentos alterados por `migrate-v2.mjs`, acrescentar **`--migration-documents-only`** na exportação. Esse modo copia apenas `jogadores/{uid}` e `perfisPublicos/{uid}`, sem consultar subcoleções, e registra `scope: "migration-documents-only"` no arquivo e na conferência. **Não é backup integral nem proteção do histórico**: escolher esse escopo explicitamente e manter a migração restrita aos mesmos caminhos. A restauração local identifica projeto de origem e projeto demo de destino separadamente.

Veja alterações (documento local: `docs/ALTERACOES_V2.md`), relatório técnico (documento local: `docs/RELATORIO_TECNICO.md`), métricas (documento local: `docs/METRICAS_V2.json`). Limitações: fechamento de aba não detectado; sem moderação de apelidos ou histórico Runner; contadores antigos preservam semântica legada.

## Manutenção do repositório

`npm run format` aplica a formatação padronizada; `npm run format:check` a verifica. As listas mantêm sua ordem e duplicatas. Artigos, documentos locais, arquivos de ambiente e cópias do banco ficam fora do Git. Referências a `docs/` acima descrevem documentos disponíveis somente no ambiente local. Consulte [SECURITY.md](SECURITY.md) para limitações e alertas de dependências pendentes.
