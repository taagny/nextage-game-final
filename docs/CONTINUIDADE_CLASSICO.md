# Retomada do Clássico após recarregar

O Clássico guarda a partida atual no armazenamento local do navegador. Recarregar mantém a palavra, ID, linhas enviadas, letras ainda digitadas, cursor e horário de início. O cálculo das cores é refeito ao restaurar. O resultado encerrado também permanece: recarga não transforma derrota em partida nova.

## Escopo e ciclo

- Chave separada por projeto Firebase e UID; visitantes usam outra chave. O estado não é enviado ao banco a cada tecla.
- A última partida de cada conta nesse navegador é substituída apenas ao iniciar um novo jogo. Logout com abandono registrado limpa a partida local; exclusão de conta tenta remover sua cópia local.
- Fechar e reabrir a página no mesmo endereço também permite continuar. O tempo inclui o intervalo fora da página, limitado a 24 horas por partida como exigem as regras. Mudanças no relógio não geram tempo negativo.
- Vitória/derrota usa o mesmo `matchId` nos reenvios. Se a resposta da gravação for perdida e a página recarregar, a transação idempotente evita contar outra partida.
- Para usuários conectados, novo jogo fica indisponível até confirmar a gravação do resultado. Uma falha mostra “Tentar salvar novamente”, preservando o ID e o tempo de conclusão.
- Uma nova partida remonta o estado mesmo quando o sorteio repete a mesma palavra. As seis tentativas e o cálculo dos acertos permanecem iguais. O Runner continua usando o comportamento anterior do hook, sem persistência nova.

## Limites

É continuidade local, não um mecanismo de antitrapaça confiável. O jogador ainda pode limpar/editar o armazenamento, usar outro navegador/endereço ou manipular o cliente. Abas/dispositivos não possuem coordenação de uma partida autoritativa. Uma URL de deployment diferente da URL anterior tem outro armazenamento. Garantia contra essas ações exige estado de partida e validação no servidor, fora desta correção.

Se o navegador bloquear ou esgotar o armazenamento, a interface informa que não poderá garantir a retomada. Um snapshot inválido é recusado; não é tratado como estado confiável. Não é registrado abandono ao fechar a aba: o comportamento é retomar a partida.

Dados locais incluem palavra, tabuleiro, datas, ID da partida e sequência exibida. A chave identifica o projeto e a conta localmente; não inclui nome ou e-mail. Exportações existentes copiam os dados do Firestore e não incluem o rascunho local. Dados concluídos já enviados continuam sujeitos às regras do banco.

## Verificação executada

- 66 testes unitários aprovados, incluindo retomada parcial, vitória/derrota, ID estável, separação de contas/projetos, snapshot inválido e limites de tempo.
- `test:browser` passou com Chrome headless, perfil temporário separado e Auth/Firestore emulados: digitação parcial, tentativa enviada, recarga real, continuidade, vitória, nova partida, seis erros e derrota preservada após recarregar.
- O teste de navegador também cria uma conta fictícia, aceita o termo pela interface, restaura uma partida autenticada e simula confirmação local perdida após a vitória. O reenvio preserva a sequência em 1 no ranking; a conta criada pelo teste é removida ao final. O cenário integrado de serviços também cobre autenticação e idempotência no banco.
- O primeiro teste de navegador encontrou `EBUSY` no observador do Vite ao acessar o perfil temporário. `.firebase` passou a ser excluído do watcher e do lint; o teste completo foi repetido e aprovado. O CLI também passa a limpar os emuladores se perder a conexão com o executor.
- Sem nova dependência de execução ou de desenvolvimento. Usa Chrome/Edge já instalado; `npm run test:browser` requer as portas locais livres e Java disponível.
- Nenhuma regra, coleção de produção, migração ou publicação remota é alterada por esta implementação.
