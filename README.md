# NEXTAGE v2

Jogo de palavras em React: Clássico, Runner, rankings, histórico por palavra e controles da conta. JavaScript/ESM, Vite, Firebase Authentication e Firestore.

## Desenvolvimento

Ambiente utilizado: Node 24.21.0. Execute `npm ci`, copie `.env.example` para `.env.local` e configure contato e contas excluídas da pesquisa. Não versione valores reais nem credenciais administrativas. Variáveis `VITE_` são públicas no aplicativo compilado.

```sh
npm run dev
npm run lint
npm run build
npm run preview
npm run test:unit
npm run test:auth
npm run test:rules
node scripts/measure-v2.mjs
```

Emuladores usam projeto fictício `demo-nextage-v2`. O executor filtra variáveis herdadas. Firestore requer Java compatível com o Firebase CLI e pode baixar artefatos no primeiro uso. Nesta máquina, `test:rules` ficou pendente por falta de Java; compile e teste as regras antes da publicação.

Entrega: lint com zero erros/11 avisos, build aprovado, 55 testes unitários e três de Authentication aprovados. Os testes de Auth simulam dados; não substituem integração Firestore nem popup Google no navegador.

## Organização e dados

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

`firestore.rules`, `firestore.indexes.json` e `firebase.json` versionam configuração. Regras são protótipo sujeito à suíte e revisão: resultados do cliente podem ser forjados dentro dos limites.

O [roteiro](docs/PUBLICACAO_V2.md) descreve backup, cópia de perfis, publicação coordenada de regras/app, limpeza e claim. **Nenhuma publicação, migração ou mudança de produção foi executada.**

Scripts: `scripts/migrate-v2.mjs` (`--copy`/`--cleanup`, dry-run padrão) e `scripts/set-admin-claim.mjs` (consulta padrão). Exigem projeto explícito e credencial externa. Só o responsável deve executá-los seguindo o roteiro.

Veja [alterações](docs/ALTERACOES_V2.md), [relatório técnico](docs/RELATORIO_TECNICO.md), [métricas](docs/METRICAS_V2.json). Limitações: fechamento de aba não detectado; sem moderação de apelidos ou histórico Runner; contadores antigos preservam semântica legada.
