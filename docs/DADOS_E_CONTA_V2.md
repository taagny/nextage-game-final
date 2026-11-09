# Consentimento, exportações e exclusão de conta v2

## Configuração e consentimento

`VITE_CONTACT_EMAIL` e `VITE_EXCLUDED_FROM_RESEARCH_UIDS` são configurados em `.env.local`, ignorado pelo Git. `.env.example` contém somente as chaves vazias. A lista de exclusões aceita UIDs separados por vírgula e é aplicada antes de montar as métricas e ler o histórico dos participantes elegíveis.

Essas variáveis são incorporadas ao build do frontend; não são segredos de servidor. Credenciais administrativas continuam externas ao repositório e não usam o prefixo `VITE_`.

O termo versão `2` informa a finalidade de avaliar uso e desempenho da plataforma, dados coletados, pseudonimização, ranking público, exportação, exclusão e contato. Recusar encerra a sessão. Partidas de visitantes não são registradas. O aceite permanece pendente em caso de falha de gravação; a interface mostra o erro. Sem contato configurado, o botão de aceite fica indisponível.

## Tipos de exportação

| Exportação | Conteúdo e identidade |
|---|---|
| JSON pessoal | Perfil público, documento privado, todas as partidas e palavras da própria conta; timestamps ISO. Inclui o próprio apelido e preserva campos legados eventualmente existentes, por ser uma cópia completa dos dados do Firestore. Não consulta nem copia o perfil do Authentication. |
| CSV pessoal | Histórico da própria conta com ID da partida, modo, desfecho, tentativas, tempo, abandono, palavra, data e `counters_valid_since`. |
| CSV de pesquisa: resumo | Código estável, contadores, médias, nível e `counters_valid_since`; campos explicitamente permitidos. |
| CSV de pesquisa: partidas | Código estável, modo reconhecido, desfecho, tentativas, tempo, abandono, palavra e datas; sem ID do documento. |
| JSON de pesquisa | Resumos, distribuição de acertos, recordes Runner e partidas permitidas; sem dados brutos do documento privado ou do perfil público. |

O requisito de não exportar nome, e-mail, apelido ou UID bruto é aplicado aos arquivos **de pesquisa**. O requisito específico de JSON pessoal completo inclui o apelido da própria conta. O acesso à exportação pessoal verifica a conta conectada antes e depois das leituras; as regras também restringem o acesso. Não se oferece exportação pessoal de outra conta pelo painel administrativo.

O painel e os arquivos de pesquisa exigem `admin: true` no token. Campos desconhecidos, identificadores legados e propriedades aninhadas extras não entram na saída: todos os campos exportados são selecionados explicitamente. Dados de contas excluídas também ficam fora dos totais e do top de eficiência do painel. Uma lista de exclusões vazia interrompe a operação para configuração.

O código é `P_` + os oito primeiros caracteres hexadecimais do SHA-256 do UID. Há detecção de colisão no conjunto exportado, sem alterar silenciosamente a regra do código. Isso é pseudonimização, não garantia de anonimato. Contadores legados continuam com sua semântica anterior; uma data de correção ausente aparece vazia.

CSV usa ponto e vírgula, aspas escapadas, CRLF e BOM no download. Strings que possam ser interpretadas como fórmula por planilhas recebem proteção. Downloads usam nomes fixos, sem identificadores, e liberam a URL temporária após o clique.

## Ordem da exclusão

1. A interface exige digitar exatamente `EXCLUIR` e informa que exclusões já feitas não podem ser desfeitas.
2. A conta é reautenticada: popup Google ou credencial de senha. Contas vinculadas a ambos usam Google. A senha permanece somente no estado temporário da interface e é limpa ao terminar ou cancelar.
3. O cliente bloqueia novas gravações do jogador e aguarda as operações já iniciadas. O bloqueio inclui criação de perfil, aceite, apelido, partidas e recordes.
4. Apaga `partidas` em lotes de até 400; busca o próximo lote até esvaziar a coleção.
5. Repete a operação em `palavras`.
6. Apaga `jogadores/{uid}` e `perfisPublicos/{uid}` em um lote de dois documentos.
7. Somente após as etapas anteriores chama `deleteUser` no Authentication.

Falhar na reautenticação não inicia a limpeza. Falhar no banco interrompe as etapas seguintes, preservando o Authentication para nova tentativa. Uma falha depois de alguma exclusão é apresentada como parcial; os dados apagados não são recriados nem restaurados automaticamente. As rotinas permitem repetir a limpeza de documentos ausentes ou subcoleções órfãs, conforme as regras v2.

O bloqueio de gravações é local a esta instância do cliente. Não há coordenação distribuída com outras abas/dispositivos nem transação única entre Firestore e Authentication. A rotina remove as duas subcoleções usadas pelo app; não administra backups nem arquivos de pesquisa já baixados. Essas limitações precisam ser consideradas na revisão operacional.

As operações seguem a exigência de [autenticação recente para exclusão no Firebase Authentication](https://firebase.google.com/docs/auth/web/manage-users). As subcoleções são apagadas explicitamente porque a exclusão do documento pai pelo SDK não as remove automaticamente, conforme o [modelo de dados do Firestore](https://firebase.google.com/docs/firestore/data-model#subcollections).

## Verificações e limites da evidência

- 38 testes unitários passaram: incluem proteção das exportações, seleção de contas, timestamps, CSV, lotes de 400, ordem da exclusão, falhas parciais e espera de gravações pendentes. Os dados desses testes são fictícios.
- Três testes passaram no Authentication Emulator usando `demo-nextage-v2`: senha válida/exclusão, senha incorreta sem limpeza e falha simulada nos dados preservando a conta. Nenhum serviço de produção foi usado. As operações do Firestore nessa suíte são simuladas.
- O executor dos emuladores foi ajustado após um `DEBUG` herdado fazer o CLI exibir variáveis de ambiente. Ele agora repassa somente variáveis básicas do sistema; o ambiente global do usuário fica intacto. Logs gerados são ignorados pelo Git, e o log local dessa execução foi higienizado.
- Não foram testados no navegador: popup Google, bloqueio de popup, confirmação digitada, layout responsivo, download efetivo e continuidade da interface após falhas parciais.
- Após instalar Java 21 e corrigir a validação da distribuição de tentativas, os 33 testes de regras passaram, incluindo exclusão permitida ao dono, limpeza de subcoleções órfãs e negação de acesso indevido. Isso valida permissões no Firestore; a exclusão completa pelo navegador, integrada ao Authentication, continua pendente.
- Nenhuma conta real foi excluída. Nenhum script de migração, definição de claim, publicação ou acesso a documentos de produção foi executado nesta etapa.
