# Login e ranking no preview da Vercel

## O que a publicação de uma branch faz

Um preview compila e hospeda o frontend. Ele não publica `firestore.rules`, não cria perfis públicos nem executa a migração. O build não usa os emuladores, mesmo com um nome de modo personalizado: o código exige `import.meta.env.DEV` para conectá-los.

Sem as variáveis Firebase opcionais abaixo, o frontend continua usando o projeto original. Assim, o preview e o site atual acessam os mesmos usuários e banco. Contas criadas nos emuladores locais não existem automaticamente no Firebase real. Testes locais aprovados não confirmam configuração, índices, restrições da chave ou regras publicadas.

## Diagnóstico sem alterar produção

Evidências recebidas: ranking com `Missing or insufficient permissions` e login com HTTP 403 em `accounts:signInWithPassword`. Uma consulta somente à configuração pública do Authentication (`GET /v1/projects`, a mesma rota usada pelo SDK), com o Referer do preview, confirmou HTTP 403 e **`API_KEY_HTTP_REFERRER_BLOCKED`**. A chave Web recusa o endereço do preview; não foi necessário tentar login, consultar contas ou ler documentos reais. A lista de domínios do Authentication não pôde ser consultada porque essa chamada já é bloqueada pela restrição da chave.

O erro do ranking confirma recusa da consulta, não lista vazia. Regras e índices efetivamente publicados não foram acessados; o ranking precisa ser testado novamente após corrigir a restrição da chave para distinguir eventual bloqueio adicional de regras. Não se atribui o HTTP 403 do Authentication às regras do Firestore.

### Correção da chave para o endereço do preview

No Google Cloud Console do projeto selecionado, abra **APIs e serviços → Credenciais → chave Web usada pelo Firebase → Restrições do aplicativo → Sites (referenciadores HTTP)**. Adicione somente o domínio exato do preview, tanto `https://DOMINIO_EXATO_DO_PREVIEW` quanto `https://DOMINIO_EXATO_DO_PREVIEW/*`, mantendo os endereços já permitidos. Não libere todos os sites nem remova as restrições das APIs para contornar o bloqueio. Revise a mudança no projeto de teste se o objetivo for manter produção intacta. Consulte os [padrões de referenciadores aceitos pelo Google Cloud](https://cloud.google.com/api-keys/docs/add-restrictions-api-keys#adding_browser_restrictions).

Essa alteração é externa ao código e ainda não foi executada. Depois de salvar e aguardar a propagação, repita login e ranking. Se o ranking continuar com `permission-denied`, confira as regras v2 e a migração **no projeto usado pelo preview**, seguindo a publicação coordenada. Para Google, a lista de domínios autorizados do Authentication é uma configuração separada e também precisa estar adequada quando esse provedor for testado.

No preview, abra F12 → Console/Network, tente entrar e abrir o ranking. Registre o código do erro e o serviço que falhou. Não compartilhe senha, token, cabeçalho Authorization ou payload de login. No código revisado, o Console registra somente o código em mensagens de autenticação e ranking; detalhes de respostas devem ser inspecionados com cuidado no navegador.

| Evidência | Interpretação e ação |
|---|---|
| `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found` | Confira a conta no projeto real selecionado. Uma conta criada somente no emulador não pode entrar no preview real. Não indica falha das regras do Firestore. |
| `auth/unauthorized-domain` | Confira o domínio exato do preview nas configurações de Authentication do projeto de teste, sobretudo para login Google. |
| `auth/network-request-failed` | Inspecione a requisição de Auth: conexão, bloqueio pelo navegador/extensão ou resposta do serviço. Não há diagnóstico suficiente apenas pelo texto da interface. |
| `auth/operation-not-allowed` | Confira se o provedor usado está habilitado no projeto selecionado. |
| `auth/invalid-api-key`, `auth/app-not-authorized`, HTTP 403 ou `auth/internal-error` com resposta de bloqueio da chave | Confira configuração atual do app, restrições da chave, APIs permitidas e restrições de aplicação. Não remova todas as restrições para contornar o erro. |
| Ranking `permission-denied` | O Firestore recusou a consulta. Confira regras realmente publicadas e eventual App Check; criar a coleção, sozinho, não libera a consulta. Não se pode concluir a causa apenas pela captura da interface. |
| Ranking `failed-precondition` | Inspecione o erro completo para confirmar se falta índice e registrar sua definição. O código resumido sozinho não comprova que é um índice. |
| Ranking vazio sem erro | A consulta foi concluída sem participantes com pontuação positiva no projeto selecionado. Se a migração pública não ocorreu, jogadores legados não aparecem automaticamente. |

## Configuração de um Firebase de teste no preview

Para testar v2 hospedado sem alterar o backend atual, use um projeto Firebase de teste separado já preparado pelo responsável. Nesse projeto, configure Authentication, Firestore e as regras v2 seguindo o roteiro de publicação e os testes. Não copie documentos privados reais para um projeto de demonstração público.

Na Vercel, configure estas variáveis **no ambiente Preview**. Use os valores do SDK Web desse mesmo projeto de teste:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```

Opcionais, do mesmo projeto: `VITE_FIREBASE_STORAGE_BUCKET` e `VITE_FIREBASE_MESSAGING_SENDER_ID`. Configure também `VITE_CONTACT_EMAIL` e `VITE_EXCLUDED_FROM_RESEARCH_UIDS` para o teste de consentimento/pesquisa, sem gravar valores reais no Git. Não use credencial administrativa em nenhuma variável `VITE_`.

As quatro primeiras variáveis devem ser definidas juntas: configuração parcial é recusada e não mistura valores com o projeto original. Sem qualquer variável Firebase preenchida, o comportamento original é preservado. `.env.local` é ignorado pelo Git e não fornece automaticamente essas configurações ao build remoto. Após alterar variáveis de build, o responsável precisa gerar outro deployment do preview para incorporá-las.

O ajuste deste repositório apenas prepara essa configuração; não cria projetos, não modifica o painel da Vercel e não publica nada. Não publique regras v2 isoladamente no banco do site atual para destravar o preview: esse banco exige backup, migração e publicação coordenada em [PUBLICACAO_V2.md](PUBLICACAO_V2.md).

## Evidência da revisão

Passaram 60 testes unitários, lint com 0 erros/11 avisos, build e o cenário integrado com os serviços reais em Auth/Firestore locais. Há testes específicos para configuração completa/parcial, isolamento dos projetos e classificação de erros sem vazamento da resposta bruta. A causa do HTTP 403 do login foi confirmada por consulta pública; corrigir a lista externa e retestar o preview continua pendente. Não se declara o ambiente hospedado corrigido apenas por testes locais.

Referências oficiais: [autenticação por senha](https://firebase.google.com/docs/auth/web/password-auth), [configuração e restrições de API keys](https://firebase.google.com/docs/projects/api-keys), [login Google e domínios](https://firebase.google.com/docs/auth/web/google-signin). Restrições de API podem causar 403; as permissões dos dados continuam sendo controladas pelas regras e demais mecanismos do Firebase.
