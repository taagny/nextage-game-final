# Publicação do NEXTAGE v2

Este roteiro será executado pelo responsável pelo projeto **após concluir as Etapas 0–7**.
O Codex não publica regras, não executa migração (nem dry-run de dados reais), não apaga coleções e não define claims em produção.

## Preparação e validação local

- Instância confirmada: `(default)`, edição Standard, modo nativo, São Paulo.
- Ambiente de desenvolvimento usado: Node 24.21.0. Instale um Java compatível com o Firebase CLI para executar o emulador do Firestore.
- Copie `.env.example` para `.env.local` e configure o contato e os UIDs de desenvolvedor/teste a excluir, sem versionar os valores reais. Configure as mesmas variáveis no ambiente de build da hospedagem. Variáveis `VITE_` são configuração pública incorporada ao frontend, não um local para credenciais administrativas.
- Execute `npm ci`, `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:auth` e `npm run test:rules`.
- Os comandos de emulador passam por `scripts/run-emulator-tests.mjs`, que chama `firebase emulators:exec` com o projeto fictício e um ambiente mínimo. O `DEBUG` herdado e credenciais de serviços não são repassados ao processo filho.
- `test:rules` usa somente o emulador local e o projeto fictício `demo-nextage-v2`. Não necessita credencial administrativa nem autenticação na CLI.
- `test:auth` executou com sucesso três testes de senha no Authentication local, sem Java. As etapas do Firestore nessa suíte são simuladas; popup Google, navegador e exclusão completa no banco permanecem pendentes.
- `npm run test:rules` foi tentado e interrompido com `spawn java ENOENT`: o emulador não iniciou, as regras não foram compiladas e nenhum caso da suíte foi executado. A compilação das regras e os resultados dos testes precisam ser confirmados antes da publicação. O primeiro uso do emulador também pode precisar de rede para baixar seus artefatos.
- As regras são um protótipo revisado estaticamente. Não comprovam que uma partida aconteceu: resultados são informados pelo cliente. As restrições limitam acesso, esquema e magnitude; cálculo confiável em Cloud Functions fica fora do escopo.
- O termo atual é a versão `2`. Ao mudar a versão, sincronize `TERMS_VERSION`, a versão aceita nas regras, os testes e o texto do termo.

### Índices

`firestore.indexes.json` inicia com listas vazias porque as consultas atuais usam os índices simples automáticos:

| Consulta | Ordenação e filtro |
|---|---|
| Clássico | `sequenciaAtual > 0`, sequência DESC, ID DESC, limite 100 |
| Runner | `FieldPath("runnerScores", duração) > 0`, placar DESC, ID DESC, limite 100 |
| Posição | Mesma ordenação, cursor `endBefore(placar, uid)`, agregação sem limite |
| Partidas | `createdAt DESC`, limite 10 |
| Palavras (Etapa 6) | `mediaTentativas DESC`, limite 10 |

O desempate por ID na mesma direção mantém a direção padrão do índice simples. Não foram consultados os índices efetivos de produção: isenções configuradas no console podem exigir ajustes. O emulador não substitui a verificação de índices no ambiente publicado. Se o servidor exigir um índice, registre a definição neste arquivo antes de publicá-la.

Cada chamada do serviço de ranking retorna no máximo 100 documentos e, para um usuário com placar positivo fora da lista, executa uma agregação. A assinatura de um único perfil no contexto tem suas próprias leituras, independentes da abertura do ranking. Uma agregação é uma consulta, não uma promessa de custo fixo de uma leitura faturada.

### Credencial administrativa

Os scripts usam `firebase-admin`, instalado apenas como dependência de desenvolvimento. Use uma credencial com as permissões mínimas necessárias, mantida fora deste repositório, e informe explicitamente o projeto. Os scripts recusam uma credencial dentro do repositório, inclusive por link simbólico.

Exemplo de configuração no PowerShell, substituindo o caminho por um arquivo externo real:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\credenciais\firebase-admin.json'
```

Nos comandos abaixo, substitua `ID_DO_PROJETO` e `UID_DO_ADMIN` pelos valores reais, sem gravá-los nos arquivos versionados. Não compartilhe a credencial nem a inclua no Git. O Admin SDK ignora as regras do Firestore, portanto confira o projeto e os resultados do dry-run.

## Ordem de publicação

### 1. Fazer backup

Faça uma exportação/backup oficial completo do Firestore, incluindo `jogadores`, `partidas`, `palavras` e os perfis públicos existentes. Confira que há um procedimento de restauração. Guarde esse backup em local privado fora do repositório: documentos legados podem conter nome e e-mail.

### 2. Copiar os perfis públicos

Primeiro, somente leitura:

```powershell
node scripts/migrate-v2.mjs --copy --project ID_DO_PROJETO
```

Revise o resumo. Só depois aplique manualmente:

```powershell
node scripts/migrate-v2.mjs --copy --apply --project ID_DO_PROJETO
```

O apelido vem do primeiro nome saneado ou de `Jogador`. A cópia preserva sequência, perdas legadas (`tentativas`) e recordes. Perfis públicos existentes nunca são sobrescritos, inclusive em caso de concorrência. Placares fora dos limites são reportados como erro para revisão, sem truncamento silencioso.

### 3. Publicar regras e aplicativo na mesma janela

Com os testes aprovados e uma janela curta de manutenção combinada, publique as regras/índices e o aplicativo v2 como uma única mudança operacional.

Comando de regras e índices, reservado ao responsável:

```powershell
npx firebase deploy --only firestore:rules,firestore:indexes --project ID_DO_PROJETO
```

Publique o frontend pelo fluxo de hospedagem já usado no projeto. `firebase.json` não configura Firebase Hosting; o comando acima **não publica o aplicativo**.

Há uma janela curta de indisponibilidade entre os passos **3 e 4**: as regras v2 rejeitam gravações em documentos privados ainda legados. Não flexibilize a leitura privada nem as validações para encobrir essa janela.

### 4. Limpar os documentos privados

Comece pelo dry-run:

```powershell
node scripts/migrate-v2.mjs --cleanup --project ID_DO_PROJETO
```

Revise o resumo e aplique manualmente:

```powershell
node scripts/migrate-v2.mjs --cleanup --apply --project ID_DO_PROJETO
```

O cleanup exige perfil público prévio, remove os campos legados e `stats.profile`, define `schemaVersion: 2` e os padrões de `totalLosses`, `totalPlayTimeMs`, `abandonedGames` e distribuição. A data de criação ausente é obtida do Authentication, sem inventar uma data histórica. Campos desconhecidos ou dados inconsistentes interrompem o script para revisão.

Os contadores históricos não são recalculados: `totalGames` legado tinha a semântica anterior. `stats.countersFixedAt` registra o início da adequação dos incrementos, não transforma os totais antigos em uma série histórica completa. Os relatórios incluem `counters_valid_since`.

Contas legadas precisam aceitar novamente o termo. Em uma repetição do cleanup, documentos já adequados, a marca temporal e os novos aceites são preservados. As releituras transacionais preservam partidas/aceites concorrentes; o script pode ser retomado após uma interrupção.

Confira a retomada de login, aceite do termo, partida Clássica, derrota, abandono por logout, Runner, rankings e perfil. Não teste exclusão usando uma conta com dados importantes.

### 5. Definir o claim de administrador e entrar novamente

Verifique a conta, sem gravar:

```powershell
node scripts/set-admin-claim.mjs --uid UID_DO_ADMIN --project ID_DO_PROJETO
```

Depois aplique manualmente:

```powershell
node scripts/set-admin-claim.mjs --uid UID_DO_ADMIN --project ID_DO_PROJETO --apply
```

O script preserva os outros claims e define `admin: true`. Saia e entre novamente para renovar o token. O botão do painel usa o claim; sua segurança depende das regras, que autorizam leitura administrativa, mas não concedem gravação arbitrária sobre documentos alheios. Nenhum campo gravado pelo cliente concede privilégios.

### 6. Remover coleções antigas

Apague `doacoes` manualmente, após o backup e a revisão. Só remova `dicionario` e `config` **depois de confirmar com o usuário que nenhuma integração externa as utiliza**. A ausência de uso no frontend, sozinha, não é confirmação suficiente. As regras v2 não dão acesso a essas coleções.

### 7. Conferir Functions antigas

O usuário confirmou pelo painel “Aguardando sua primeira implantação” que não há Functions publicadas neste projeto; nesse caso, nenhuma remoção é necessária. Se surgirem funções antigas em uma conferência posterior, revise seu uso antes da remoção manual. Esta versão não implementa Cloud Functions.

## Permissões e limites conhecidos

- Público lê apenas `perfisPublicos`. Dono/admin leem o documento privado e partidas; palavras têm leitura do dono. Dono/admin podem excluir os documentos para permitir a limpeza de conta.
- Criação tem valores zerados. Atualizações validam todos os campos, protegem timestamps e restringem os incrementos. Os desfechos exigem coerência entre estatísticas privadas e sequência pública na mesma escrita atômica.
- Cada partida e cada atualização de palavra verifica o incremento privado correspondente. Isso não identifica de forma exclusiva uma ação real nem impede forjar resultados coerentes dentro dos limites. As regras não impõem uma correspondência bijetiva entre todo incremento e todo documento de histórico; o cliente regular usa transações e IDs de partida para evitar duplicações acidentais.
- Tempo por partida: no máximo 24 horas; contadores: no máximo um bilhão; totais inteiros: no máximo `Number.MAX_SAFE_INTEGER`. Runner: máximo de 10, 30 ou 60 pontos por duração, sem diminuir recordes. São limites de projeto, não comprovação de desempenho.
- Partidas não aceitam update. A primeira ocorrência de cada palavra é imutável; média usa derrota = 7. Fechar a aba continua sem detecção; não há moderação de apelidos nem histórico do Runner.
- As exportações de pesquisa exigem a lista `VITE_EXCLUDED_FROM_RESEARCH_UIDS`, com UIDs separados por vírgula, e usam códigos SHA-256 com prefixo `P_` e oito dígitos hexadecimais. Se houver colisão de códigos, a operação é interrompida para revisão. O backup administrativo completo com identificadores foi removido.
- A exportação pessoal completa inclui o próprio perfil público e seu apelido. A rotina e as limitações da exclusão estão em `docs/DADOS_E_CONTA_V2.md`.
