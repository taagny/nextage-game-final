# NEXTAGE v2

Jogo de palavras em React: Clássico, Runner, rankings, histórico por palavra e controles da conta. JavaScript/ESM, Vite, Firebase Authentication e Firestore.

## Desenvolvimento

Ambiente utilizado: Node 24.21.0. Execute `npm ci`, copie `.env.example` para `.env.local` e configure contato e contas excluídas da pesquisa. Não versione valores reais nem credenciais administrativas. Variáveis `VITE_` são públicas no aplicativo compilado.

```sh
npm run dev
npm run dev:local
npm run lint
npm run build
npm run preview
npm run test:unit
npm run test:auth
npm run test:rules
npm run test:integration
npm run test:persistence
npm run test:local
npm run test:browser
npm run audit:responsive
node scripts/measure-v2.mjs
```

Emuladores usam projeto fictício `demo-nextage-v2`. O executor filtra variáveis herdadas. Firestore requer Java 21+ e pode baixar artefatos no primeiro uso. Nesta máquina, Microsoft OpenJDK 21 foi instalado e os 33 testes de regras passaram após corrigir a validação da distribuição de tentativas que excedia o limite de expressões.

### Testar a branch antes de publicar

`npm run dev` conecta ao Firebase real. Se as regras v2 ainda não estiverem publicadas, criar/carregar o novo perfil pode falhar com `permission-denied` ao acessar `perfisPublicos`. Isso não é resolvido pelo build nem por reenviar o formulário; a conta no Authentication pode já ter sido criada.

Para desenvolvimento isolado, instale Java compatível com o Firebase CLI (Java 21 ou superior) e pare o servidor anterior com Ctrl+C. Execute **`npm run dev:local`**: ele inicia Authentication em `127.0.0.1:9099`, Firestore em `127.0.0.1:8080` com as regras deste repositório e Vite em **http://127.0.0.1:5173**. Se uma porta estiver ocupada, encerre o processo anterior antes de repetir.

Esse comando usa o modo Vite `emulators`, com projeto fictício `demo-nextage-v2`, sem reutilizar a sessão de produção. Na primeira execução, cadastre uma conta fictícia. Agora o executor importa e exporta contas e dados em `.firebase/emulators-data`, ignorado pelo Git. Para encerrar, pressione Ctrl+C uma vez e aguarde **Export complete** antes de fechar o terminal. Matar processos ou desligar abruptamente pode perder alterações não exportadas. Contas perdidas em reinícios anteriores precisam ser recriadas; não há restauração retroativa.

Se os emuladores não iniciarem, o Vite não é iniciado por esse comando. Não há fallback para o banco real. As variáveis de `.env.local` continuam disponíveis ao Vite. O ranking local contém somente participantes locais com sequência positiva, e não importa os jogadores do site publicado.

`test:integration` usa os serviços reais do aplicativo com Auth e Firestore emulados: cadastro, aceite, erro de senha, novo login, vitória, prevenção de duplicação, derrota e rankings Clássico/Runner. `test:persistence` cria dados fictícios, exporta, encerra os emuladores, inicia nova execução e verifica login, partida e posição restaurados. Usa `.firebase/persistence-test`, sem tocar nos dados do app. Ambos passaram; não substituem testes visuais de navegador.

`dev:local` mantém o Vite no processo do executor e inicia os emuladores com `emulators:start`. Ctrl+C envia um pedido de encerramento por IPC ao CLI, que executa exportação e limpeza, evitando depender da propagação de sinais do Windows. `test:local` verificou dois ciclos reais de início/encerramento/reinício, resposta HTTP e liberação de 8080/9099/5173, acionando o mesmo handler por IPC. Esse teste exige que o app esteja parado; importa/exporta os dados locais existentes, sem apagá-los. O pressionamento físico de Ctrl+C continua sujeito à confirmação manual no terminal.

No Windows, se o terminal ainda tiver o PATH anterior à instalação, o executor procura Java 21+ em `JAVA_HOME` e nas instalações Microsoft OpenJDK em `Program Files`. O ajuste vale somente para o processo filho; não modifica o ambiente global.

O modo de emulação é exclusivo de desenvolvimento. `npm run build` continua usando a configuração real. Não publique regras isoladamente para destravar o teste: siga a ordem de migração/publicação documentada. Os testes usam `firebase.tests.json`, com Firestore em 8085 e Auth em 9098, sem limpar os dados do app em 8080/9099. Reinicie o servidor local após mudanças na configuração. Testes de navegador permanecem necessários.

Verificação atual: lint com zero erros/10 avisos, build aprovado e 66 testes unitários. Passou também o teste do Clássico no Chrome com cadastro, aceite, recargas reais e resultado reenviado sem duplicar a sequência. Há suítes de Authentication e integração; popup Google continua pendente de verificação no navegador.

## Organização e dados

A [revisão de responsividade](docs/RESPONSIVIDADE.md) cobriu oito tamanhos entre 320 × 568 e 1440 × 900, com 136 verificações finais de páginas e modais. O cabeçalho, teclado e modais foram ajustados; o Clássico usa duas colunas em telas horizontais baixas. Capturas e medições podem ser reproduzidas com `npm run audit:responsive`.

O Clássico agora retoma a mesma palavra e tentativas após recarregar, usando armazenamento local separado por projeto/conta. Resultados pendentes preservam o ID e podem ser reenviados sem duplicar a partida. Veja [continuidade do Clássico](docs/CONTINUIDADE_CLASSICO.md) para ciclo, testes e limites: isso não impede manipulação deliberada do navegador nem sincroniza abas/dispositivos.

Interface e contexto chamam `src/services`; ESLint impede imports diretos de Auth/Firestore nessas camadas. Hooks ficam em `src/hooks`; cálculos em `src/utils`.

| Caminho | Conteúdo | Leitura |
|---|---|---|
| `perfisPublicos/{uid}` | Apelido, sequência, perdas, recordes Runner | Pública |
| `jogadores/{uid}` | Consentimento e estatísticas privadas | Dono/admin |
| `jogadores/{uid}/partidas/{id}` | Desfecho Clássico, tentativas, tempo, palavra, abandono | Dono/admin |
| `jogadores/{uid}/palavras/{WORD}` | Primeira/melhor/última ocorrência, médias | Dono |

Vitória/derrota atualiza quatro documentos em transação. Abandono por logout não registra palavra. Visitantes jogam sem persistência. Nível intermediário a partir de 100 vitórias; avançado a partir de 500.

Ranking retorna até 100 documentos e, quando necessário para posição fora da lista, uma contagem adicional. Perfil acompanhado no contexto tem leituras próprias; agregação não implica uma única leitura faturada.

## Consentimento e conta

Termo versão 2 exige novo aceite quando muda a versão; contato em `VITE_CONTACT_EMAIL`. Configurações permitem editar apelido, exportar JSON/CSV e excluir conta com confirmação/reautenticação. Exclusão remove subcoleções em lotes, perfis e por último Authentication; pode falhar parcialmente.

Pesquisa exige claim `admin: true` e lista de exclusão configurada. Exportações usam campos permitidos e códigos pseudonimizados, sem nome, e-mail, apelido ou UID bruto. JSON pessoal inclui os próprios dados e apelido. Veja [dados da conta](docs/DADOS_E_CONTA_V2.md).

## Regras e publicação

Para falhas no preview hospedado da branch, veja [login e ranking na Vercel](docs/PREVIEW_VERCEL.md). O preview usa o Firebase real por padrão e não publica regras/migrações. É possível configurar outro projeto com as variáveis `VITE_FIREBASE_*` do `.env.example`, restritas ao ambiente Preview da Vercel. Configuração parcial é recusada para não misturar projetos.

`firestore.rules`, `firestore.indexes.json` e `firebase.json` versionam configuração. Regras são protótipo sujeito à suíte e revisão: resultados do cliente podem ser forjados dentro dos limites.

O [roteiro](docs/PUBLICACAO_V2.md) descreve backup, cópia de perfis, publicação coordenada de regras/app, limpeza e claim. **Nenhuma publicação, migração ou mudança de produção foi executada.**

Scripts: `scripts/migrate-v2.mjs` (`--copy`/`--cleanup`, dry-run padrão) e `scripts/set-admin-claim.mjs` (consulta padrão). Exigem projeto explícito e credencial externa. Só o responsável deve executá-los seguindo o roteiro.

Veja [alterações](docs/ALTERACOES_V2.md), [relatório técnico](docs/RELATORIO_TECNICO.md), [métricas](docs/METRICAS_V2.json). Limitações: fechamento de aba não detectado; sem moderação de apelidos ou histórico Runner; contadores antigos preservam semântica legada.
