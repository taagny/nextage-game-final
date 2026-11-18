# Segurança

Nunca publique credenciais administrativas, tokens de acesso, arquivos `.env` locais, chaves de pesquisa ou cópias do banco. As variáveis `VITE_` e a configuração web do Firebase ficam visíveis no navegador; elas não substituem Authentication nem regras de acesso.

Os dados privados ficam separados dos perfis públicos. As regras verificam identidade, campos, tipos e limites, mas os resultados das partidas são informados pelo cliente. Isso permite manipulação deliberada dentro dos limites aceitos; o aplicativo não oferece validação autoritativa dos resultados em servidor.

## Dependências

Execute `npm audit` e `npm audit --omit=dev` ao atualizar o projeto. Uma instalação sem alertas não garante ausência de vulnerabilidades. Avalie cada aviso e repita os testes antes de mudar versões; não use `npm audit fix --force` sem revisar as incompatibilidades propostas.

Na revisão de 18/11/2026, foram aplicadas as correções compatíveis disponíveis. A consulta com `--omit=dev` ainda apontou quatro pacotes com classificação alta, decorrentes de `@grpc/grpc-js` e propagados pelo SDK Firestore/Firebase. Os avisos diretos são [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j) e [GHSA-f596-whhp-79r4](https://github.com/advisories/GHSA-f596-whhp-79r4). O aplicativo publicado é estático e usa o SDK web; os fluxos Node e administrativos precisam de avaliação própria. As ferramentas de desenvolvimento também têm avisos pendentes, incluindo `tar`. Não foi forçado o downgrade do Firebase ou das ferramentas sugerido pelo auditor.

## Relatar um problema

Comunique falhas ao mantenedor em um canal privado. Inclua passos para reprodução e versões afetadas, sem senhas, tokens ou dados de jogadores. Evite publicar dados sensíveis em issues públicas.
