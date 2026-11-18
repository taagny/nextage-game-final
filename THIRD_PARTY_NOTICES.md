# Créditos das listas de palavras

A comparação integral identificou scripts/raw-words.txt como uma cópia de content/2018/pt_br/pt_br_50k.txt do projeto FrequencyWords, de Hermit Dave, com conversão de finais de linha para CRLF.

Fonte fixada: https://github.com/hermitdave/FrequencyWords/blob/525f9b560de45753a5ea01069454e72e9aa541c6/content/2018/pt_br/pt_br_50k.txt
Declaração de licença: https://github.com/hermitdave/FrequencyWords/blob/525f9b560de45753a5ea01069454e72e9aa541c6/README.md
Conteúdo upstream: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). O MIT do repositório upstream refere-se ao código, não aos dados.
Licença: https://creativecommons.org/licenses/by-sa/4.0/
Texto integral: public/wordlists/CC-BY-SA-4.0.txt
O upstream declara usar o corpus OpenSubtitles 2018, disponibilizado pelo OPUS: https://opus.nlpl.eu/OpenSubtitles2018.php

Transformações conhecidas: remoção das frequências, normalização Unicode NFD, remoção de marcas de acento, conversão para maiúsculas e filtragem de cinco letras A-Z. A transformação automática da base gera 5.861 palavras distintas. A versão legada do dicionário contém 5.971 entradas/5.969 palavras distintas: exclui GYPSY, acrescenta 109 palavras distintas e repete HIFEN e PODAM. As palavras adicionais também estão na lista completa da mesma fonte, mas a origem histórica da seleção e das alterações não foi comprovada.

A seleção de sorteio em src/utils/answers.js foi preservada: 1.501 entradas/1.465 palavras distintas, com suas multiplicidades e probabilidades. Em 16/11/2026, o autor informou recordar a extração das palavras do código público de Palavra Charada (https://charada.app/), seguida de adaptações no NEXTAGE.

A comparação com constants/wordlist.ts, disponibilizado no source map público https://charada.app/static/js/main.89dbf6ab.js.map, encontrou 1.440 palavras distintas em comum após remover acentos e converter para maiúsculas, além de uma subsequência comum de 1.438 entradas na mesma ordem. Há 25 palavras exclusivas em cada seleção distinta; as listas não são idênticas. O arquivo observado tem 1.465 respostas distintas, enquanto o NEXTAGE mantém as repetições acima. Isso apoia o relato de origem imediata, sem comprovar todas as adaptações históricas.

Nos módulos públicos consultados, o Charada credita um projeto-base de software de Hannah Park, mas não declara uma fonte anterior nem uma licença específica para as listas em português. O crédito ao software não foi interpretado como licença dessas listas. A origem anterior e as condições de reutilização da seleção portuguesa continuam pendentes de confirmação pelo responsável do Charada. A licença CC BY-SA da base FrequencyWords identificada não foi estendida automaticamente à seleção copiada do Charada.

Os dados provenientes de FrequencyWords e suas adaptações identificadas são disponibilizados sob CC BY-SA 4.0, com os créditos e as alterações acima. A licença do código da aplicação é uma decisão separada.
