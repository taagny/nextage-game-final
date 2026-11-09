# Revisão de responsividade

Revisão em Chrome headless instalado no Windows, com perfil temporário separado, Auth/Firestore locais e uma conta fictícia. Nenhum dado de produção foi usado. O navegador foi redimensionado em pixels CSS; isso não substitui testes em aparelhos físicos.

## Resultado

A primeira rodada avaliou 120 combinações de tela/cenário e encontrou problemas em 37. Após os ajustes, a rodada final avaliou 136 combinações, sem cortes horizontais, sobreposição de logo/navegação, modais fora da altura disponível ou X encoberto nos critérios instrumentados. Os 16 casos adicionais incluem menu do usuário e ranking preenchido. A rodada final também usou histórico, gráfico e palavras preenchidos com dados fictícios.

| Tela em pixels CSS | Casos iniciais com problema | Casos finais avaliados | Casos finais com problema detectado |
|---|---:|---:|---:|
| 320 × 568 | 8 | 17 | 0 |
| 360 × 640 | 7 | 17 | 0 |
| 390 × 844 | 5 | 17 | 0 |
| 600 × 800 | 4 | 17 | 0 |
| 768 × 1024 | 2 | 17 | 0 |
| 844 × 390 | 9 | 17 | 0 |
| 1024 × 768 | 2 | 17 | 0 |
| 1440 × 900 | 0 | 17 | 0 |

## Correções

- Cabeçalho em grade: logo não disputa espaço com a navegação. Celulares usam duas linhas; telas baixas na horizontal usam cabeçalho compacto. Apelidos longos são limitados e dão lugar ao avatar nas larguras intermediárias.
- Teclado com largura limitada à tela, teclas flexíveis e segunda linha proporcional; o corte lateral em 320 px foi removido. Tabuleiro ajusta o tamanho à largura/altura disponíveis.
- Clássico em duas colunas em telas horizontais baixas: tabuleiro à esquerda e teclado à direita. Em 844 × 390, ambos ficam visíveis sem a rolagem longa do layout anterior.
- Modais com altura limitada, margens seguras e rolagem para conteúdo longo. Login/cadastro, perfil e resultado deixaram de ultrapassar o topo em 844 × 390.
- Removida a regra móvel que fazia todo botão dentro de um modal ter largura de 100%. Ela alargava os X do perfil e do resultado. Botões de ação mantêm seu tratamento próprio.
- Botões X do login e do resultado receberam área de 40 × 40 px. X do perfil permanece circular; abas e ações continuam acessíveis em painéis com rolagem.

## Cobertura

Clássico como visitante e conectado, teclado, ranking vazio/preenchido, menu com apelido de 20 caracteres, Como Jogar, login, cadastro, termo, abas Perfil/Evolução/Palavras/Configurações, resultado com seis linhas, escolha de duração do Runner, Runner em andamento e resultado do Runner. O histórico de teste inclui seis vitórias distribuídas em três palavras e recorde Runner, gravados pelos serviços reais no emulador. A conta criada para a revisão é removida ao final.

As capturas foram inspecionadas visualmente para celular, desktop e orientação horizontal. Medições verificam limites dos elementos, overflow interno, interseção de logo/navegação e acesso ao centro dos X. Conteúdo extenso pode exigir rolagem vertical, especialmente no Runner e nos modais; o resultado não significa que todo conteúdo cabe simultaneamente em uma única tela.

## Reprodução e evidência

Com o app local parado e as portas livres:

```sh
npm run audit:responsive
```

O script usa somente o projeto fictício `demo-nextage-v2`, gera capturas e `measurements.json` em `.firebase/responsiveness/current` e termina com código de erro se detectar problemas. A pasta é ignorada pelo Git. Evidências desta revisão estão nas subpastas locais `baseline`, `corrected` e `final`; um novo checkout pode reproduzir a medição atual, mas não inclui os arquivos locais dessas rodadas.

O aviso visual do SDK de emuladores foi removido apenas da página de auditoria; ele não existe no preview hospedado. As capturas iniciais ainda o mostram, mas o detector de problemas não o contabiliza. O script exige Chrome/Edge instalado e Java compatível com o emulador; não instala dependências novas.

Build e lint passaram (0 erros, 10 avisos preexistentes). A regressão do Clássico no Chrome verifica cadastro, consentimento, recarga e ranking após as mudanças de CSS.

## Limites

Não foram testados Safari/iOS, Firefox, aparelhos físicos, teclado virtual do sistema, zoom do navegador ou leitores de tela. Painel administrativo e confirmação detalhada de exclusão de conta não fazem parte dos 17 cenários desta rodada. Esta é uma revisão de layout e regressão funcional, não uma medição Lighthouse nem certificação de acessibilidade. Após atualizar o preview, vale conferir em um celular real, nas duas orientações.
