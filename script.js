// ==========================================
// --- VARIÁVEIS GLOBAIS ---
// ==========================================
const tileDisplay = document.querySelector('#tile-container');
const keyboard = document.querySelector('#keyboard-container');

// 1. LISTA DE RESPOSTAS
const palavrasRespostas = [
    'IDEIA', 'AMIGO', 'CASAS', 'TERRA', 'FOGOS', 'NOITE', 'FEMEA',
    'PODER', 'TEMPO', 'MUNDO', 'LIVRO', 'PLANO', 'FLORA', 'GEMEA',
    'RAMOS', 'CARRO', 'NAVIO', 'PEIXE', 'DADOS', 'SAGAZ', 'EPICA',
    'NOBRE', 'AFETO', 'SUTIL', 'VIGOR', 'AUDAZ', 'SANTO', 'CAPAS', 'MACAS',
    'TESTE', 'SOLAR', 'PRATO', 'GRUPO', 'PODAM','TRENS','FUZIL','CHAVE', 'PORTA', "CASAL", "ADEGA", "APTAS", "TINTA", "FALSO", "PICOS", "ATUAR", "PISTA", "BURRO", "FAZER", 'PODAM', 'TRENS', 'FUZIL',
    "PIZZA", "QUINA", "PINTA", "BANAL", "CORPO", "DETER", "TENUE", "ABONO", "FLUXO", "PAVIO", "LIMAO", "CAQUI", "FINOS", "OBTER", "OVULO", "GRAUS", "CISAO", "ESTES", "HIDRO", "SUPER", "SINTO", "GRUTA", "TONTA", "MAGRO", "FESTA", "PAGAM",
    "GRUPO", "GERAL", "PLACA", "TELAS", "POUCA", "ATUAL", "PODER", "ASSIM", "INATA", "GERME", "BOSSA", "PRESA", "TORTA", "LENTO", "CRIAR", "TORAX", "TUFAO", "MULAS", "BEBER", "BOINA", "POLPA", "MAGIA", "NESSA", "CRASE", "PINHO", "GORDO", "COCOS", "BAZAR", "CAPIM", "LEMES", "LOGAR", "SANTO", "TOSAR", "LATEX", "LATAS", 
    "GINGA", "DESSA", "LIMBO", "HONRA", "NOTAR", "MAIOR", "CASPA", "EUROS", "GRADE", "PAGAO", "CLONE", "COMUM", "RITMO", "VERDE", "LEIGA", "BRACO", "MARES", "SECOS", "SOGRA", "LOUSA", "RITMO", "ANSIA", "PARMA", "PRETA", "MALES", "NINJA", "FOSCA", "DEVER", "TANGA", "UNIDA", "COIFA", "TODOS", "GEMEA", "GATAS", "MALTA", "TRUPE", "PULGA", "HOMEM", "UNTAR", "IRADO", "SECAR", "FUNGO", "ROJAO", "SURDO", "LABIA", "PILHA", "MONGE", "BOLOS", "SELAR", "CALOS", "ATRIZ", "BONUS", "AREIA", "SKATE", "GERAR", "DEVIR", "CEGOS", "EXAME", "FUGIR", "SOUTO", "OUVIR", "ALUNO", "VORAZ", "VASOS", "VERBO", "PADRE", "NETOS", "CANAL", "PAZES", "ANTES", 
    "CREPE", "CORRE", "CRIME", "ASSIS", "MILHO", "MEIOS", "TEDIO", "TOPAR", "VAGEM", "METAL", "LENDA", "LOMBA", "PURAS", "DUQUE", "CLIMA", "TERCA", "DEBIL", "USINA", "CHORA", "BELAS", "ALIAR", "NUDEZ", "RIVAL", "DRAMA", "TREZE", "FRUTA", "TEMOR", "PIANO", "COSMO", "NINAR", "BRUXO", "BABAR", "MAGRA", "AGUDA", "LEIGO", "FACIL", "COLAR", "TEMPO", "MITOS", "RATOS", "CHAVE", "HINDU", "INCAS", "NULOS", "OPCAO", "OBESO", "GORDA", "CAIXA", "POLEN", "BOCAL", "PRETO", "ADIAR", "LICEU", "GRAMA", "RARAS", "FRACO", "SARRO", "MISTO", "RALAR", "MESAS", "CUECA", "HARPA", "GIRAR", "VAGOS", "MAGNA", "VOCES", "GRIPE", "LUVAS", "FREAR", "CALVO", "COSTA", "ALMAS", "FEDOR", "VAGAR", "CHUVA", "MACHO", "LADOS", "SACOS", "FEMEA", "FLORA", "NERVO", "PODIO", "LAGOS", "VINTE", "CARTA", "MEDIA", "BASES", "FEITA", "MICRO", "GELAR", "ARDER", "PESAR", "NAVAL", "ESQUI", "ACOES", "DAMAS", "VARAL", "BALDE", "ACIDA", "BUCHO", "FEMUR", "TORTO", "CAROS", "TABUS", "TIROS", 
    "MAMAE", "PAPAI", "TENIS", "RIMAR", "BIFES", "BACIA", "RELER", "HORTO", "XAMPU", "CUJOS", "ILESA", "DADOS", "NADAR", "MIMOS", "MUSGO", "KARMA", "COPAS", "ERVAS", "FIGOS", "RAMOS", "AVIDA", "VIVER", "BRISA", "DOGMA", "FEIOS", "FOFAS", "MELAO", "MIUDA", "AREAL", "PISAR", "RECEM", "RASOS", "FATAL", "OPTAR", "SUAVE", "FRUTO", "ARDUO", "PONTO", "VIRUS", "VETAR", "TENSA", "SOMAR", "MUITA", "BUMBA", "FELIZ", "BURRA", "ANEIS", "NOCAO", "DESTA", "CILIO", "NOBRE", "REZAR", "SUJAR", "SUTIA", "ERROS", "RICAS", "SERIE", "MALTE", "ARDUA", "ALHOS", "LIDOS", "LAICO", "JEJUM", "TENSO", "MARTE", "LEAIS", "ALCAR", "MAMAR", "OTICO", "LOTAR", "FREVO", "BARCO", "LESAO", "SUJOS", "LUMEN", "BAMBU", "CINZA", "ERRAR", "TUTOR", "BOTAR", "ALUNA", "NESTA", "TOCAR", "CONES", "GRATA", "SAIDA", "GUIAR", "VAZAR", "PUROS", "UTEIS", "TREVO", "PANDA", "METRO", "COESO", "PICAR", "AMADA", "CABAL", "FIAPO", "BOCAO", "FUZUE", "FUROR", "PIRES", "CURAR", "FOLIA", "ALGAS",
    "ALTAR", "FUMAR", "TRIPE", "FORTE", "PRAIA", "SIRIO", "SINOS", "MUNDO", "PECAR", "CORJA", "OTIMA", "LIXAR", "IDOSO", "CARMA", "FOSSA", "CARAS", "NEGAR", "LIRIO", "DUNAS", "CORAL", "TOLDO", "DELTA", "BINGO", "GOLFE", "FARDA", "PAGOS", "ACASO", "AQUEM", "SUECA", "MATOS", "FUSCA", "RACAO", "TEIAS", "HORTA", "AMENO", "MERCE", "NAVES", "CERVO", "PATOS", "DUTOS", "CERTA", "VIRIL", "GAMBA", "RETRO", "AUREA", "CUPIM", "FEBRE", "AUTOS", "VALSA", "NORTE", "LIGAR", "CERNE", "IDOLO", "JUIZO", "MUDOS", "FILHO", "TRIOS", "JUIZA", "PERTO", "TALCO", "SUNGA", "RUSSA", "VOTAR", "HEROI", "MUITO", "SUECO", "TURCA", "FEUDO", "MAJOR", "CIUME", "GOELA", "MARRA", "LACOS", "REGER", "JUROS", "ABRIR", "FEROZ", "MOIDA", "MODOS", "NOZES", "SOCIO", "MOEDA", "ROCAR", "TINTO", "DEDOS", "RASAS", "SEDES", "CENAS", "SALSA", "ESTAS", "REUSO", "TELAO", "REFIL", "PLENA", "COMER", "AMPLO", "LIDAR", "FATOR", "ARMAR", "TRAPO", "TEXTO", "OPACA", "REVES", "ARIDO", "ETICO", "FORUM", "DIETA", "NOMES", "TRIBO", "EXITO", "MIDIA", "BRUTO", "BELOS", "SODIO", "TUBOS", "OPERA", "SALAS", "OMBRO", "ROUPA", "MUTUO", "FLUIR", "VOSSA", "VACAS", "BOATO", "BATER", "BANDO", "GALHO", "VALOR", "NAVIO", "ROLAR", "CUBOS", "TACOS", "VERME", "RITOS", "AUTOR", "DEUSA", "BARES", "TURNE", "OUSAR", "POLIR",
    "DIZER", "VOLEI", "LOIRO", "LETAL", "CALMA", "HIPER", "SOLOS", "ECOAR", "IMPOR", "MUSEU", "VESPA", "UMIDA", "MIRAR", "OSTRA", "LORDE", "FACAO", "SABIO", "BUCAL", "COURO", "DEPOR", "GREGO", "NOSSA", "FUGAS", "CANON", "MANSO", "DOMAR", "BUCHA", "LITRO", "MIOPE", "OLHAO", "AMENA", "CEDER", "VIDAS", "REMAR", "CIVIL", "AROMA", "GOTAS", "FRASE", "NASAL", "BALAO", "SAUNA", "BOLHA", "BAMBA", "SADIO", "CAIRO", "GAFES", "CLICA", "VOTOS", "ACUDE", "MIOLO", "TERCO", "FAVOR", "SURDA", "ANTAS", "MEDIR", "SOGRO", "ZIPER", "SELIM", "CLARA", "FERAS", "OUTRA", "MESES", "AEREA", "ABRIL", "BANCO", "LOUCO", "ALPES", "DEDAO", "LICAO", "FOGAO", "VACUO", "BRASA", "TODAS", "LONGA", "LISOS", "NEVOA", "ISCAS", "PEIXE", "LINHO", "MURAL", "TIBIA", "PLENO", "COCAR", "MODAS", "LEGAL", "CEDRO", "IRMAO", "CONDE", "FUTIL", "FURAR", "DISSO", "TETRA", "TURFE", "SUMIR", "GUETO", "PORCO", "LONGE", "GALAO", "OUTRO", "USUAL", "BUNDA", "MEMES", "PANOS", "SARJA", "PUNHO", "POCAS", "OFURO", "BRAVO", "PINOS", "PONTE", "ANUAL", "SIGNO", "CALAR", "ROXAS", "PELOS", "TIARA", "ATLAS", "VULTO", "BREVE", "POEMA", "CAMAS", "ADVIR", "RUBRO", "EXODO", "NOVOS", "LIBRA", "PENCA", "AMORA", "VAPOR", "REDES", "VILAO", "ANZOL", "MURRO", "LETRA", "DOLAR", "AMIDO", "COFRE", "CESTO", "BOMBA", "GOLFO", "PULAR", "OSSEA", "ANIMO", "LAGOA", "IMUNE", "HORAS", "SAGAZ", "LOCAO", "LAJES", "RETAS", "MUSAS", "SACAR", "INDIA", "SEXTO", "FEIRA", "CASAL", "ARCOS", "ONTEM", "GANSO", "LONGO", "RURAL", "OLHAR", "CUBAS", "PAMPA", "GLOBO", "PERUA", "SELVA", "LEITO", "TRAMA", "ROSTO", "SERVO", "FADAS", "AULAS", "LOTUS", "NEVAR", 
    "CACAR", "JOGAR", "DUPLA", "PRECE", "AGEIS", "CAUDA", "BREGA", "FADOS", "MOELA", "LERDO", "TOUCA", "NATAS", "PUXAR", "DARDO", "TUNEL", "AUDIO", "GIBIS", "ILESO", "MEROS", "FUROS", "PRACA", "CHAPA", "COPIA", "SURFE", "OBRAS", "RAIAR", "ATROZ", "SITIO", "OVNIS", "LATIM", "DOTAR", "CITAR", "OLHOS", "REGAR", "SALMO", "ARENA", "PAGAR", "TRECO", "UNCAO", "ETNIA", "MALAS", "POLVO", "NOVAS", "AVEIA", "VASTO", "VOVOS", "RUSSO", "LAVAR", "MUDAR", "MEIAS", "PATAS", "JOIAS", "ALVOS", "GIROS", "RENTE", "NARIZ", "USADA", "TECER", "VICIO", "TRENO", "PAPOS", "DUPLO", "AMBOS", "ODIAR", "VELHA", "BODAS", "VISAO", "CARGA", "FIXAR", "GARRA", "BOBOS", "SETOR", "ESSES", "LOUCA", "BICHO", "BOBAS", "VINHO", "LONAS", "GOLPE", "SAFRA", "MEIGO", "BENTA", "ARROZ", "NENEM", "LOJAS", "TCHAU", "SABIA", "CALDA", "CHALE", "MOCOS", "SUINO", "LOIRA", "ORFAO", "COUVE", "FALIR", "GALOS", "IMPIO", "PODRE", "GAITA", "CARNE", "MECHA", "DAQUI", "NOSSO", "VAZIO", "PRUMO", "FRIAS", "LOMBO", "INDIO", "FOTOS", "EPICO", "AGUIA", "OSSEO", "PISOS", "CIVIS", "GOSMA", "CASAR", "NACAO", "VELOZ", "LISAS", "ALGUM", "POTES", "DOIDA", "SABER", "JUSTO", "JEITO", "BICOS", "ROLHA", "GEADA", "REFEM", "RAIOS", "MANTA", "CASTA", "LOCAL", "CAPAO", "GARCA", "AEREO", "SOSIA", "ARAME", "DIQUE", "SABAO", "ELFOS", "RACAS", "TUMBA", "PIPAS", "SANAR", "NINFA", "BREJO", "MANHA", "MOLAS", "POREM", "ITENS", "FOBIA", "JULHO", "CRISE", "VINDA", "VISAR", "PROVA", "RUIVA", "VULGO", "ONDAS", "FURIA", "BRITO", "HIFEN", "GEMEO", "FLUOR", "MENOS", "TIMES", "REVER", "TELHA", "HUMOR", "TRETA", "VIDEO", "TESTE", "ARCAR", "BERCO", "LESTE", "CARIE", "FOLHA", "FIXOS", "TABUA", "TOCHA", "RUINS", "NUVEM", "ZONAS", "POCOS", "VENUS", "SARNA", "AONDE", "TOMAR", "TESES", "LUGAR", "PALMA", "PRECO", "PULOS", "SARAU", "SARDA", "BOLSO", "ROTOR", "CIVEL", "FILHA", "ROUCA", "BESTA", "FUGAZ", "OBVIO", "CLERO", "DENSA", "DURAR", "BOLAO", "COMBO", "FRADE",
    "BARBA", "SEITA", "GERIR", "ETAPA", "PUNIR", "TRUCO", "VEIAS", "CASCO", "JEGUE", "GRAOS", "SELOS", "HABIL", "VIVOS", "TERNO", "MOSCA", "OASIS", "CAULE", "UNHAS", "UNICO", "DUZIA", "MACRO", "PAPEL", "PLEBE", "POSSE", "FOCAL", "BRUTA", "ROBOS", "SABOR", "ACIMA", "ROCHA", "SACRA", "LINDO", "PAVAO", "SIGLA", "TOURO", "JUSTA", "CETIM", "CAIDA", "SALAO", "MOCAS", "MEXER", "LEQUE", "PRAXE", "LAZER", "TRIPA", "FEIXE", "RUMOR", "GIRIA", "DANOS", "LENHA", "REDOR", "MACIA", "FRIOS", "ARTES", "CAVAR", "PESOS", "BONDE", "QUAIS", "BECOS", "MUMIA", "RISOS", "IGUAL", "CELAS", "ELITE", "SENAO", "ULTRA", "NELES", "DOIDO", "RELUZ", "JURAR", "ENTAO", "CLORO", "MILHA", "UNIAO", "LIXAO", "TANTO", "PRAGA", "FOGOS", "TOSCO", "CHATO", "CARGO", "IDOSA", "LARVA", "BISPO", "BANJO", "VASTA", "QUASE", "MEIGA", "PEGAR", "EIXOS", "TERMO", "PNEUS", "TANGO", "RUGIR", "FARSA", "VALER", "MORTA", "ZERAR", "DOCES", "FOICE", "HIENA", "PORCA", "PEDIR", "SACRO", "RIMEL", "ASPAS", "VIGAS", "GESTO", "VAZAO", "HARAS", "SADIA", "CHEIO", "LILAS", "TIPOS", "MOTOR", "UNICA", "TAXIS", "DUETO", "IRMAS", "PUXAO", "BOCAS", "CARRO", "GRATO", "POMAR", "GAVEA", "APICE", "NESSE", "MATAR", "MANTO", "TACAS", "JUNHO", "TOTAL", "CALDO", "MANGA", "QUOTA", "FATIA", "MISTA", "DESDE", "GENTE", "LEITE", "PORRE", "LINCE", "FALSA", "TIRAR", "FAROL", "EXPOR", "SUPOR", "VOCAL", "ROLOS", "AMPLA", "TRICO", "HINOS", "LENTA", "VETOR", "EPOCA", "ROSAS", "CRAVO", "PATIO", "CLUBE", "ETICA", "BLUSA", "BUSTO", "PEGOS", "RODAR", "CALOR", "RAMPA", "PRATA", "FAIXA", "PONTA", "SUTIS", "MALES", "OUROS", "OESTE", "LOBOS", "BONES", "PAVOR", "BAITA", "ASTRO", "ARDOR", "TAPAR", "CALVA", "FUNIL", "PRADO", "FACAS", "URNAS", "MAIAS", "GENES", "CIRCO", "TRIGO", "PSICO", "AFINS", "CULTO", "CACOS", "OTICA", "IMPAR", "LINHA", "JOVEM", "CHATA", "CRUAS", "POMBO", "PUDIM", "CINTO", "RENAL", "LEBRE", "PROLE", "AUREO", "METER", "TOTEM", "DIABO", "SILOS",
    "BALAS", "IDEAL", "ANJOS", "RAPAZ", "CANOA", "CACAU", "VITAL", "MORNA", "RUMOS", "CABER", "BODES", "CAPUZ", "GENRO", "LUNAR", "CICLO", "CESTA", "CALMO", "SEIVA", "MORAL", "TEMER", "NISSO", "MENOR", "BALSA", "MOGNO", "FISCO", "VOZES", "PALCO", "ADEUS", "FROTA", "MANIA", "GOSTO", "ARIES", "NEGRO", "LUTAR", "PRATO", "ANDAR", "ALTOS", "LAPIS", "CLAVE", "FIBRA", "NORMA", "POETA", "VELHO", "GRAXA", "VALAS", "ROSCA", "ZELAR", "DUCHA", "JARRA", "HASTE", "POBRE", "PEDRA", "OSCAR", "MEDIO", "OPACO", "BULBO", "RUDES", "SUBIR", "VETOS", "BEATA", "BOTAO", "COISA", "NISTO", "FAUNA", "MESMA", "MEDOS", "PEDAL", "TARJA", "NINHO", "DONOS", "ACIDO", "FALAR", "MOITA", "VOSSO", "CREDO", "RUIVO", "ROMBO", "VAZIA", "SORTE", "GRANA", "TURNO", "PESTO", "BOLSA", "CABOS", "LINDA", "CULTA", "GASES", "SUSHI", "ALGOZ", "PENTE", "CENTO", "TIGRE", "FAVAS", "PILAO", "MAGOA", "POCAO", "TRONO", "CLICO", "FORNO", "SUTIL", "IDEIA", "DOCIL", "PARAR", "MINHA", "PALMO", 'PODAM', 'TRENS',
    "EXATA", "PROSA", "RAZAO", "SISMO", "POROS", "FARAO", "CINCO", "VILAS", "TECNO", "MAGOS", "AGORA", "MISSA", "DITAR", "SOPAS", "PILAR", "LARES", "DIVAS", "POLAR", "GREVE", "BRUXA", "SINAL", "MAMAO", "TRUFA", "PERSA", "SOLAR", "PLUMA", "MUROS", "LENTE", "FASES", "RABOS", "RADIO", "FIADA", "DOADA", "FEIAS", "JOGOS", "PODAR", "FARRA", "ALTAS", "SOTAO", "SENSO", "BOATE", "PIRAR", "RAROS", "NUNCA", "GENIO", "ADAGA", "HOTEL", "IDADE", "BAIAS", "URANO", "PEOES", "CENSO", "GORRO", "GESSO", "GATOS", "ROTAS", "NOBEL", "CLIPE", "SEXTA", "VEADO", "FINAL", "AREAS", "CERTO", "VIGOR", "OXIDO", "PAREO", "PAUSA", "REAIS", "TONTO", "VIRAR", "PARDO", "ZINCO", "URSOS", "FARPA", "DITOS", "PERDA", "REMOS", "TENOR", "PIRAO", "BACON", "ORDEM", "SACHE", "MUTUA", "TRENS", "CHEIA", "MIRIM", "CORVO", "DORSO", "MANSA", "VINIL", "ATOMO", "REPOR", "ICONE", "PUDOR", "CARPA", "CANJA", "FOFOS", "URUBU", "ESTAR", "ZEROS", "PIADA", "EXTRA", "SENSO", "PERNA", "MOVER", "VIRAL", "NAIPE", "CISTO", "BLOCO", "CUPOM", "POVOS", "FARDO", "GRACA", "AVELA", "PALHA", "SUCOS", "TOSCA", "CASOS", "LICOR", "PICA", "GURIA", "DENSO", "TERRA", "DELAS", "RETER", "GREGA", "BIRRA", "LEMES", "LUXOS", "MIADO", "SENHA", "SONAR", "RAIVA", "MENTA", "BIOMA", "HIATO", "HAVER", "BRAVA", "BUQUE", "VEZES", 
    "ATRAS", "FOSCO", "TRAIR", "ORGAO", "CINTA", "CACHO", "COXAS", "POLOS", "ESSAS", "OLEOS", "BANDA", "LIXOS", "DORES", "ACESA", "CLARO", "DUBLE", "ALBUM", "NATAL", "AVIAO", "MASSA", "CATAR", "MAPAS", "LEVAR", "RIGOR", "POMBA", "FOSSO", "FRACA", "BANIR", "COPOS", "AMAGO", "DUROS", "ZEBRA", "CORDA", "CABRA", "MORNO", "TURMA", "MOVEL", "SETAS", "PONEI", "ORIXA", "LAUDO", "TATIL", "DOCAS", "RICOS", "DICAS", "MOTOS", "SEDAS", "PRAZO", "AGUDO", "TOLOS", "MIMAR", "FINAS", "POSAR", "NICHO", "COVAS", "TRENA", "DOSAR", "SOCOS", "BARAO", "FOCAR", "INVES", "PESTE", "ANAIS", "JAULA", "REGUA", "OMEGA", "ACHAR", "CORSO", "CANOS", "BARCA", "CAFES", "MACIO", "FATOS", "FICAR", "MOTEL", "BATOM", "TROPA", "SERIO", "JARRO", "VOGAL", "CANIL", "VISOR", "DENTE", "CASCA", "SANTA", "CHEFE", "PENTA", "FUSAO", "REINA", "GALAS", "MESMO", "CISNE", "LAPSO", "FONTE", "FOCOS", "AMIDO", "FERIR", "CEDRO", "CRUEL", "MAFIA", "EXATO", "CAPAZ", "LENCO", "ASSAR", "AINDA", "CAMPO", "ENFIM", "VERBA", "NOITE", "PENAL", "ANSIA", "SAPOS", "AMBAS", "MORAR", "AMBAR", "FONES", "AXILA", "JATOS", "POMPA", "OSSOS", "MICOS", "POUCO"
];

// 2. LISTA TOTAL
const dicionarioCompleto = [
    ...palavrasRespostas, 
'SAGAZ',
'ÂMAGO', 'TERMO', 'NEGRO', 'ÊXITO', 'MEXER', 'NOBRE', 'SENSO', 'ÉTICA', 'AFETO', 'ALGOZ',
'FAZER', 'PLENA', 'TÊNUE', 'ASSIM', 'MÚTUA', 'SOBRE', 'AQUÉM', 'PODER', 'SEÇÃO', 'VIGOR',
'SUTIL', 'PORÉM', 'FOSSE', 'CERNE', 'IDEIA', 'SANAR', 'AUDAZ', 'MORAL', 'INATO', 'QUIÇÁ',
'MUITO', 'DESDE', 'JUSTO', 'HONRA', 'SONHO', 'TORPE', 'RAZÃO', 'AMIGO', 'ÉGIDE', 'ÍCONE',
'ETNIA', 'FÚTIL', 'ANEXO', 'DENGO', 'TANGE', 'HAVER', 'LAPSO', 'ENTÃO', 'EXPOR', 'TEMPO', 'ARARA',
'BOÇAL', 'SEARA', 'SABER', 'HÁBIL', 'MÚTUO', 'GRAÇA', 'CASAL', 'ÓBICE', 'XIBIU', 'ÁVIDO', 'FEMEA',
'DIZER', 'ARDIL', 'ESTAR', 'PESAR', 'DEVER', 'CAUSA', 'TENAZ', 'SENDO', 'AINDA', 'TEMOR', 'PÁRIA', 'BRADO', 'CRIVO', 'COSER', 'GENRO', 'ÁPICE', 'COMUM', 'POSSE', 'PROLE', 'ASSAZ', 'ÂNIMO', 'CEDER', 'FUGAZ',
'CORJA', 'PAUTA', 'DETÉM', 'CENSO', 'CULTO', 'ÂNSIA', 'ATROZ', 'DIGNO', 'MUNDO', 'FORTE', 'MESMO', 'VULGO', 'VÍCIO', 'GLEBA', 'SAÚDE', 'CRIAR', 'COZER', 'TODOS', 'REVÉS', 'JEITO', 'PUDOR', 'VALHA', 'DOGMA', 'DENSO',
'NENÉM', 'LOUCO', 'ATRÁS', 'ORDEM', 'REGRA', 'LIMBO', 'PEDIR', 'FELIZ', 'CLAVA', 'HOMEM', 'AJUDA', 'MERCÊ', 'USURA', 'IMPOR', 'BANAL', 'COISA', 'ROUND', 'JUÍZO', 'FALSO', 'LEGAL', 'FORMA', 'SÁBIO', 'CERTO', 'FALAR',
'PROSA', 'SERVO', 'TENRO', 'PÍFIO', 'POSSO', 'PRESA', 'DESSE', 'CUNHO', 'HERÓI', 'DEVIR', 'VIRIL', 'FÁCIL', 'VENDO', 'ONTEM', 'VALOR', 'VISAR', 'LINDA', 'MANSO', 'SÉRIO', 'ÉBRIO', 'MÁGOA', 'GUISA', 'MEIGA', 'ACASO',
'PUDER', 'ÍMPIO', 'FLUIR', 'AFAGO', 'REAÇA', 'LUGAR', 'TEMER', 'PLATÔ', 'GARBO', 'ABRIR', 'PRAXE', 'UNIÃO', 'OBTER', 'GERAR', 'BURRO', 'MATIZ', 'ÓBVIO', 'CISMA', 'AFINS', 'BRUMA', 'VÊNIA', 'ÊXODO', 'PLENO', 'CRISE',
'ÁLIBI', 'TÉDIO', 'FLUXO', 'RITMO', 'MORTE', 'LEVAR', 'SENIL', 'HAVIA', 'OLHAR', 'CASTA', 'ENFIM', 'TOMAR', 'VISÃO', 'GÊNIO', 'OUVIR', 'PRUMO', 'PARVO', 'BREGA', 'CABAL', 'PARCO', 'RELES', 'FALTA', 'VITAL', 'CALMA',
'OUTRO', 'BRAVO', 'TECER', 'FAVOR', 'PULHA', 'TERRA', 'RETER', 'VIVAZ', 'SÁBIA', 'VIVER', 'AMENO', 'TENDO', 'ÚNICO', 'FORÇA', 'LAICO', 'PASSO', 'VALIA', 'GRATO', 'NICHO', 'ACHAR', 'PAPEL', 'NOÇÃO', 'CARMA', 'NOSSA',
'REVER', 'POSSA', 'RANÇO', 'POBRE', 'ROGAR', 'NOITE', 'DÚBIO', 'FAÇAM', 'FARDO', 'PRIME', 'ATIVO', 'FARSA', 'COESO', 'ÉPICO', 'FATOR', 'ANELO', 'CLARO', 'LEIGO', 'SELAR', 'LÍDER', 'ÓBITO', 'SESTA', 'SINTO', 'CIÚME', 'CISÃO', 'VAZIO', 'CESTA',
'CITAR', 'SONSO', 'DETER', 'ATUAR', 'FICAR', 'VELHO', 'HASTE', 'GENTE', 'TENDE', 'ADIAR', 'HUMOR', 'REVEL', 'IDEAL', 'FONTE', 'PONTO', 'SULCO', 'ÁRDUO', 'LABOR', 'IGUAL', 'SENÃO', 'MARCO', 'REMIR', 'TERNO', 'FEIXE', 'EXATO', 'HIATO', 'AMPLO',
'VEMOS', 'CAPAZ', 'TANTO', 'LAVRA', 'DÉBIL', 'CAUDA', 'RELVA', 'CICLO', 'INATA', 'TENRA', 'JOVEM', 'VARÃO', 'ÓTICA', 'CHUVA', 'GESTO', 'AMBOS', 'RAIVA', 'POUCO', 'CAÇAR', 'COÇAR', 'TOADA', 'SONSA', 'VELAR', 'APOIO', 'VÁCUO', 'SÉRIE',
'IMUNE', 'XEQUE', 'FARÃO', 'ALGUM', 'VIMOS', 'FEITO', 'HORDA', 'FUSÃO', 'CARRO', 'ADVÉM', 'ENTRE', 'LEITO', 'COESA', 'PROBO', 'MINHA', 'SORTE', 'TRAMA', 'CRUEL', 'SENTE', 'DOIDO', 'ANUIR', 'FRASE', 'LAZER', 'BRISA', 'ÍMPAR', 'VERSO',
'CHATA', 'TORÇO', 'RIGOR', 'MASSA', 'BLASÉ', 'PEGAR', 'BOTAR', 'PRECE', 'MAIOR', 'SEITA', 'DORSO', 'ÁUREA', 'FAUNA', 'MOÇÃO', 'SIGNO', 'FUROR', 'AGORA', 'LIVRO', 'PLANO', 'LIAME', 'PRESO', 'SAIBA', 'VETOR', 'COVIL', 'COMER', 'CREDO',
'OCASO', 'SENDA', 'FLORA', 'CASTO', 'MORAR', 'PRAIA', 'PECHA', 'NUNCA', 'FAINA', 'ADEUS', 'DÓCIL', 'ALIÁS', 'HOUVE', 'PESTE', 'ÁRIDO', 'ARDOR', 'SETOR', 'MUDAR', 'AMBAS', 'MANHA', 'PARTE', 'PEIXE', 'RISCO', 'ANTRO', 'REZAR', 'VISSE',
'VÍRUS', 'MESES', 'SALVO', 'JUNTO', 'VULTO', 'PAJEM', 'BEATA', 'CAMPO', 'GRUPO', 'ESTÃO', 'SAÍDA', 'BREVE', 'AVARO', 'ÓTIMO', 'VASTO', 'ACESO', 'MORRO', 'ANTES', 'SINAL', 'CONTA', 'SÉRIA', 'ANDAR', 'LENDA', 'ANAIS', 'REGER', 'BANZO',
'ÁUREO', 'PRADO', 'VERBO', 'OXALÁ', 'ACIMA', 'FUGIR', 'OPÇÃO', 'SERÃO', 'FESTA', 'VILÃO', 'CHULO', 'SEGUE', 'RAPAZ', 'LEITE', 'MOTIM', 'NAÇÃO', 'BIRRA', 'TEXTO', 'FRUIR', 'ÍNDIO', 'TRETA', 'BRAVA', 'TIRAR', 'PARAR', 'FITAR', 'PUXAR',
'ÁTOMO', 'ÁTRIO', 'ÍDOLO', 'JAZIA', 'FILHO', 'ALUDE', 'GERIR', 'TOSCO', 'TENSO', 'REINO', 'TRAGA', 'TURBA', 'PRAZO', 'BÔNUS', 'PROVA', 'NORMA', 'ÉPOCA', 'EXAME', 'MANHÃ', 'VORAZ', 'ACESA', 'CORPO', 'CHEIO', 'SARÇA', 'PRETO', 'LIGAR',
'BANDO', 'MALTA', 'AONDE', 'ARCAR', 'MAGIA', 'NOSSO', 'QUASE', 'FATOS', 'VENAL', 'SINHÁ', 'PSICO', 'ANCIÃ', 'CÓPIA', 'LOGRO', 'AVIÃO', 'LONGE', 'FATAL', 'AFORA', 'CERTA', 'DESSA', 'PRAGA', 'QUOTA', 'NÍVEL', 'FIXAR', 'OÁSIS', 'SEXTA',
'MENTE', 'APEGO', 'MESSE', 'NÓDOA', 'POMPA', 'LIDAR', 'PERDA', 'APELO', 'PARCA', 'TOCAR', 'GLOSA', 'VERVE', 'ALADO', 'JIRAU', 'COITO', 'CAIXA', 'SUMIR', 'FRACO', 'LIVRE', 'TINHA', 'SOLDO', 'VEZES', 'PORTA', 'GRAVE', 'FIRME', 'LINDO',
'CÂNON', 'BATER', 'OPACO', 'SOLTO', 'IRMÃO', 'BESTA', 'FAIXA', 'ASTRO', 'SALVE', 'SABIA', 'TURVA', 'VIRÃO', 'ATUAL', 'ELITE', 'DOÍDO', 'TRUPE', 'SUPRA', 'NAVIO', 'FENDA', 'DEIXA', 'GRATA', 'CIOSO', 'ALÇAR', 'PARDO', 'JUNCO', 'AUTOR',
'CURSO', 'PIQUE', 'EXIJO', 'PARVA', 'BIOMA', 'CHATO', 'VIRIA', 'BICHO', 'DESTA', 'DOUTO', 'MACIO', 'ALUNO', 'PAGÃO', 'ÉTICO', 'RESES', 'COUSA', 'MENOS', 'FICHA', 'CALDA', 'POSTO', 'CABER', 'ABUSO', 'RÁDIO', 'VÍDEO', 'LOCUS', 'CULPA',
'SUPOR', 'LÁPIS', 'JUDEU', 'ZELAR', 'GOSTO', 'VERBA', 'SUPER', 'SUAVE', 'CALÃO', 'DROPS', 'ADVIR', 'AGUDO', 'EXTRA', 'RETÉM', 'JÚLIA', 'MOLHO', 'PRIVÊ', 'TORSO', 'BAIXO', 'PIADA', 'FACHO', 'VOSSO', 'PEITO', 'VINHA', 'TURMA', 'SÍTIO',
'RUÍNA', 'ÍGNEO', 'PASSA', 'PÓDIO', 'ASILO', 'TRAÇO', 'LIGHT', 'COMBO', 'ÓRFÃO', 'ÁVIDA', 'ESTIO', 'PILAR', 'TURVO', 'CHAMA', 'LOUÇA', 'MOSTO', 'PÁREO', 'AÇÕES', 'REFÉM', 'MUSEU', 'AMENA', 'POETA', 'FOREM', 'PISAR', 'BRABO', 'ACOLÁ',
'MESMA', 'LASSO', 'ERETO', 'LOCAL', 'MEIGO', 'FINDA', 'OPTAR', 'METIÊ', 'MEDIR', 'BUSCA', 'DRAMA', 'TESTE', 'POEMA', 'TENTO', 'CLIMA', 'CÚTIS', 'AUTOS', 'SURJA', 'FACTO', 'CORAL', 'FOLGA', 'AVISO', 'COCHO', 'RUMOR', 'GERAL', 'ROUCA',
'HOBBY', 'AMIGA', 'PÍFIA', 'PAIRA', 'CALMO', 'IDOSO', 'PEDRA', 'TACHA', 'CETRO', 'BOATO', 'URGIA', 'FEROZ', 'VOLTA', 'RUBRO', 'PACTO', 'FEUDO', 'MÓVEL', 'LIÇÃO', 'AÇUDE', 'GOLPE', 'CRIME', 'MONGE', 'ATEIA', 'DAQUI', 'CLEAN', 'RISTE',
'ECOAR', 'TETRA', 'ARTUR', 'ÉBANO', 'PONHA', 'NATAL', 'CASAR', 'CARTA', 'BENÇA', 'CORSO', 'MANGA', 'FALHA', 'MONTE', 'AROMA', 'SALDO', 'VERDE', 'CACHO', 'CONTO', 'VIGIA', 'ITENS', 'PLUMO', 'ESCOL', 'BRIGA', 'VETAR', 'HOSTE', 'TRIBO',
'GRAMA', 'PASMO', 'FÓRUM', 'TARDE', 'FAZIA', 'LETAL', 'AMADA', 'ORNAR', 'MANGÁ', 'TROÇA', 'VENTO', 'ÚNICA', 'PEDRO', 'RIVAL', 'CHEFE', 'SÚCIA', 'SÓSIA', 'CIVIL', 'FRUTO', 'ÚTEIS', 'ROUPA', 'VENHA', 'PLAGA', 'TCHAU', 'NUVEM', 'ÓRGÃO',
'SARAU', 'PINHO', 'PENTA', 'AREIA', 'PLEBE', 'JOGAR', 'ÁTIMO', 'VAZÃO', 'SWING', 'JEJUM', 'VIRAR', 'CARGO', 'NESSE', 'COVER', 'ARADO', 'BERRO', 'LESSE', 'SEIXO', 'STAND', 'MACRO', 'FOSSO', 'PERTO', 'CATRE', 'MAGNA', 'GÍRIA', 'AXILA',
'MÍDIA', 'FINJO', 'ROCHA', 'MÁ-FÉ', 'BEIJO', 'TIVER', 'VAROA', 'LÉGUA', 'FARTA', 'TUTOR', 'TIÇÃO', 'TROCA', 'BRUTO', 'INTER', 'TODAS', 'CALOR', 'BRUTA', 'RENDA', 'TRAJE', 'POMAR', 'DESTE', 'GABAR', 'ASSAR', 'CLOSE', 'TENHA', 'TRATO',
'DANÇA', 'SURTO', 'XUCRO', 'ARFAR', 'SANTO', 'VADIO', 'AMADO', 'PORTE', 'GURIA', 'NESSA', 'ESTRO', 'PERCO', 'VERÃO', 'ÂMBAR', 'VIRAM', 'RURAL', 'SILVO', 'FEITA', 'ODIAR', 'LOGOS', 'NESTA', 'VISTA', 'DEPOR', 'MAMÃE', 'AVIAR', 'CHULA',
'CANTO', 'LAUDO', 'MARCA', 'CANSO', 'FOSSA', 'NEGAR', 'CENHO', 'VEDAR', 'ETAPA', 'BAZAR', 'GROTA', 'ÁGAPE', 'PAVOR', 'SALMO', 'CERCA', 'CHEIA', 'BOLSA', 'MINAR', 'RECÉM', 'DENSA', 'ÍMPIA', 'IRADO', 'CIFRA', 'CLERO', 'VISTO', 'RÉGIO',
'COROA', 'CINTO', 'FERPA', 'URDIR', 'SOFIA', 'VAGAR', 'BUCHO', 'BURRA', 'HORTO', 'RUÍDO', 'INVÉS', 'LETRA', 'LARGO', 'FOLHA', 'MECHE', 'MOLDE', 'QUAIS', 'SEGAR', 'JAZER', 'LESÃO', 'PROTO', 'ESGAR', 'SÍMIO', 'SÓTÃO', 'PAIOL', 'FINAL',
'PUGNA', 'ÚBERE', 'VELHA', 'TRAGO', 'PENSO', 'FUNDO', 'MORFO', 'NARCO', 'LESTO', 'VASTA', 'PASMA', 'QUEDA', 'DERAM', 'ÁLAMO', 'DÚBIA', 'CEITA', 'UFANO', 'OLHOS', 'PODAR', 'ARDIS', 'TROÇO', 'PICHE', 'LINHA', 'APEAR', 'TROCO', 'PÓLIS',
'VIGER', 'PREÇO', 'ÚMIDO', 'FROTA', 'ÁUDIO', 'BULIR', 'FOLIA', 'MOCHO', 'NESTE', 'OUTRA', 'PEITA', 'ILESO', 'FAROL', 'MONTA', 'DISSO', 'RESTO', 'COSMO', 'MANTO', 'MATAR', 'CHAVE', 'SEIVA', 'REDOR', 'CHAGA', 'BARRO', 'BOLSO', 'MOVER',
'MISTO', 'FALSA', 'CÍVEL', 'RETRO', 'LIMPO', 'VAZIA', 'LÁBIA', 'LOUCA', 'VELOZ', 'BEDEL', 'NARIZ', 'CAMPA', 'NÁCAR', 'BARÃO', 'LOGIA', 'JUSTA', 'LOURO', 'CULTA', 'MIMAR', 'SAMBA', 'LUTAR', 'ÁLBUM', 'SABOR', 'BANTO', 'DADOS', 'MACHO',
'R', 'PORCA', 'LUCRO', 'AXIAL', 'COEVO', 'TOQUE', 'ZUMBI', 'PUNHA', 'LONGO', 'ARROZ', 'CALÇA', 'ENJOO', 'SACAR', 'RENTE', 'SALVA', 'DIABO', 'SUBIR', 'FINDO', 'FARTO', 'CALVO', 'URGIR', 'PAGAR', 'LOUSA', 'VENHO', 'XAMPU', 'BAIXA',
'PLUMA', 'VALER', 'OUSAR', 'SABIÁ', 'SEXTO', 'FIRMA', 'BRUXA', 'SOLTA', 'FOCAR', 'SIGLA', 'FÁTUO', 'HÍFEN', 'FORRO', 'TORNA', 'REPOR', 'LENTO',
'CHOÇA', 'RELER', 'CARDO', 'FAZES', 'GUETO', 'BUGRE', 'FUGIU', 'CORTE', 'PULAR', 'VOILÀ', 'VÁRIO', 'CUSTO', 'CORAR', 'FEIRA', 'MANIA', 'NESGA', 'CANIL', 'DEMÃO', 'VERSA', 'RÁCIO', 'SADIO', 'FERIR', 'MÍOPE', 'MODAL', 'TÊNIS'
];

let wordle;
let currentRow = 0;
let currentTile = 0;
let isGameOver = false;
let usuarioAtual = null;
let sequenciaAtualLocal = 0;

const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<<']
];

const guessRows = Array.from({ length: 6 }, () => Array(5).fill(''));

// ==========================================
// --- LÓGICA DO JOGO (COM CORREÇÃO DE CORES) ---
// ==========================================

async function getRandomWord() {
    try {
        if(window.db && window.doc && window.getDoc) {
             const docRef = window.doc(window.db, "config", "jogo_diario");
             const docSnap = await window.getDoc(docRef);
             if (docSnap.exists()) {
                 wordle = docSnap.data().palavraAtiva;
                 return;
             }
        }
    } catch (e) {}
    const randomIndex = Math.floor(Math.random() * palavrasRespostas.length);
    wordle = palavrasRespostas[randomIndex].toUpperCase();
}

function createGrid() {
    tileDisplay.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const rowElement = document.createElement('div');
        rowElement.classList.add('tile-row');
        rowElement.setAttribute('id', `row-${i}`);
        for (let j = 0; j < 5; j++) {
            const tileElement = document.createElement('div');
            tileElement.setAttribute('id', `row-${i}-tile-${j}`);
            tileElement.classList.add('tile');
            rowElement.append(tileElement);
        }
        tileDisplay.append(rowElement);
    }
}

function createKeyboard() {
    keyboard.innerHTML = '';
    keys.forEach(row => {
        const rowElement = document.createElement('div');
        rowElement.classList.add('key-row');
        row.forEach(key => {
            const button = document.createElement('button');
            button.textContent = key === '<<' ? '⌫' : key;
            button.setAttribute('id', key);
            button.classList.add('keyboard-button');
            if (key === 'ENTER' || key === '<<') button.classList.add('wide');
            button.onclick = () => handleInput(key);
            rowElement.append(button);
        });
        keyboard.append(rowElement);
    });
}

function handleInput(key) {
    if (isGameOver) return;
    const modalAberto = document.querySelector('.modal-overlay[style*="display: flex"]');
    if (modalAberto) return; 

    if (key === 'ENTER') return checkRow();
    if (key === '<<' || key === 'BACKSPACE') return deleteLetter();
    if (/^[A-Z]$/.test(key)) addLetter(key);
}

function addLetter(letter) {
    if (currentTile < 5 && currentRow < 6) {
        const tile = document.getElementById(`row-${currentRow}-tile-${currentTile}`);
        tile.textContent = letter;
        guessRows[currentRow][currentTile] = letter;
        currentTile++;
        salvarJogoLocal();
    }
}

function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = document.getElementById(`row-${currentRow}-tile-${currentTile}`);
        tile.textContent = '';
        guessRows[currentRow][currentTile] = '';
        salvarJogoLocal();
    }
}

// --- FUNÇÃO CHECKROW CORRIGIDA (INTELIGENTE) ---
function checkRow() {
    const guess = guessRows[currentRow].join('');
    if (guess.length !== 5) return;

    if (!dicionarioCompleto.includes(guess)) {
        showMessage('Palavra não existe no dicionário');
        const row = document.getElementById(`row-${currentRow}`);
        row.classList.add('shake');
        setTimeout(() => row.classList.remove('shake'), 500);
        return;
    }

    const rowTiles = document.getElementById(`row-${currentRow}`).children;
    const solutionChars = wordle.split(''); // Array da palavra certa (ex: ['N','A','V','I','O'])
    const guessChars = guess.split('');     // Array do chute (ex: ['V','I','C','I','O'])
    const colors = new Array(5).fill('grey-overlay'); // Começa tudo cinza

    // PASSO 1: Encontrar os VERDES (Posição exata)
    guessChars.forEach((char, index) => {
        if (char === solutionChars[index]) {
            colors[index] = 'green-overlay';
            solutionChars[index] = null; // Marca como "usado" na solução
            guessChars[index] = null;    // Marca como "processado" no chute
        }
    });

    // PASSO 2: Encontrar os AMARELOS (Letra existe mas em outro lugar)
    guessChars.forEach((char, index) => {
        if (char !== null && solutionChars.includes(char)) {
            colors[index] = 'yellow-overlay';
            // Remove a primeira ocorrência dessa letra dos disponíveis
            solutionChars[solutionChars.indexOf(char)] = null; 
        }
    });

    // PASSO 3: Aplicar as cores na tela
    for (let i = 0; i < 5; i++) {
        const tile = rowTiles[i];
        const letter = guessRows[currentRow][i]; // Pega a letra original
        const colorClass = colors[i];

        tile.classList.add(colorClass);
        tile.style.borderColor = colorClass === 'green-overlay' ? '#538d4e' : (colorClass === 'yellow-overlay' ? '#b59f3b' : '#3a3a3c');
        updateKeyboardStatus(letter, colorClass);
    }

    if (guess === wordle) {
        localStorage.removeItem('nextage_save');
        setTimeout(() => { showResult(true); isGameOver = true; }, 100);
    } else {
        if (currentRow >= 5) {
            localStorage.removeItem('nextage_save');
            setTimeout(() => { showResult(false); isGameOver = true; }, 100);
        } else {
            currentRow++;
            currentTile = 0;
            salvarJogoLocal();
        }
    }
}

function updateKeyboardStatus(letter, colorClass) {
    const btn = document.getElementById(letter);
    if (!btn) return;
    
    // Se a tecla já é verde, ela não muda mais
    if (btn.classList.contains('green-overlay')) return;
    
    // Se a tecla é amarela e vai virar verde, pode. Senão, mantém amarela.
    if (btn.classList.contains('yellow-overlay') && colorClass !== 'green-overlay') return;

    btn.classList.remove('yellow-overlay', 'grey-overlay');
    btn.classList.add(colorClass);
}

// ==========================================
// --- SISTEMA DE SAVE (CORRIGIDO TAMBÉM) ---
// ==========================================

function salvarJogoLocal() {
    if (isGameOver) { localStorage.removeItem('nextage_save'); return; }
    const estado = { wordle, currentRow, currentTile, guessRows, sequencia: sequenciaAtualLocal };
    localStorage.setItem('nextage_save', JSON.stringify(estado));
}

function carregarJogoLocal() {
    try {
        const salvo = localStorage.getItem('nextage_save');
        if (salvo) {
            const estado = JSON.parse(salvo);
            wordle = estado.wordle;
            currentRow = estado.currentRow;
            currentTile = estado.currentTile;
            for (let i = 0; i < 6; i++) { guessRows[i] = [...estado.guessRows[i]]; }
            sequenciaAtualLocal = estado.sequencia || 0;
            return true;
        }
    } catch (e) { console.error("Erro save:", e); }
    return false;
}

function reconstruirTabuleiro() {
    for (let i = 0; i < 6; i++) {
        const rowData = guessRows[i];
        const rowElement = document.getElementById(`row-${i}`);
        if(!rowElement) continue;
        const tiles = rowElement.children;

        for (let j = 0; j < 5; j++) {
            if (rowData[j]) {
                tiles[j].textContent = rowData[j];
                tiles[j].setAttribute('data', rowData[j]);
            }
        }

        if (i < currentRow) {
            // LÓGICA INTELIGENTE AQUI TAMBÉM (Para o F5 não bugar as cores)
            const guess = rowData.join('');
            const solutionChars = wordle.split('');
            const guessChars = guess.split('');
            const colors = new Array(5).fill('grey-overlay');

            // Passo 1: Verdes
            guessChars.forEach((char, index) => {
                if (char === solutionChars[index]) {
                    colors[index] = 'green-overlay';
                    solutionChars[index] = null;
                    guessChars[index] = null;
                }
            });

            // Passo 2: Amarelos
            guessChars.forEach((char, index) => {
                if (char !== null && solutionChars.includes(char)) {
                    colors[index] = 'yellow-overlay';
                    solutionChars[solutionChars.indexOf(char)] = null;
                }
            });

            // Aplica
            for (let j = 0; j < 5; j++) {
                const letter = rowData[j];
                const tile = tiles[j];
                const colorClass = colors[j];
                
                tile.classList.add(colorClass);
                tile.style.borderColor = colorClass === 'green-overlay' ? '#538d4e' : (colorClass === 'yellow-overlay' ? '#b59f3b' : '#3a3a3c');
                updateKeyboardStatus(letter, colorClass);
            }
        }
    }
}

// ==========================================
// --- RESULTADOS E MODAIS ---
// ==========================================

async function showResult(won) {
    const modal = document.getElementById('modal-overlay');
    modal.style.display = 'flex';
    document.getElementById('modal-title').textContent = won ? "PARABÉNS!" : "FIM DE JOGO";
    document.getElementById('modal-word-reveal').textContent = `A palavra era: ${wordle}`;
    
    const streakDiv = document.getElementById('streak-display');
    const streakNumber = document.getElementById('streak-number');

    if (streakDiv && streakNumber) {
        if (usuarioAtual) {
            streakDiv.style.display = 'flex';
            if (won) await salvarVitoria();
            else await salvarDerrota();
            streakNumber.textContent = Number(sequenciaAtualLocal).toLocaleString('pt-BR');
        } else {
            streakDiv.style.display = 'none';
        }
    }
    generateMiniGrid();
}

function generateMiniGrid() {
    const miniGrid = document.getElementById('mini-grid');
    miniGrid.innerHTML = '';
    for (let i = 0; i <= currentRow; i++) {
        const tiles = document.getElementById(`row-${i}`).children;
        for (let t = 0; t < 5; t++) {
            const miniTile = document.createElement('div');
            miniTile.classList.add('mini-tile');
            if (tiles[t].classList.contains('green-overlay')) miniTile.style.backgroundColor = '#538d4e';
            else if (tiles[t].classList.contains('yellow-overlay')) miniTile.style.backgroundColor = '#b59f3b';
            else miniTile.style.backgroundColor = '#3a3a3c';
            miniGrid.appendChild(miniTile);
        }
    }
}

function showMessage(text) {
    let container = document.querySelector('.message-container');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('message-container');
        document.body.appendChild(container);
    }
    const message = document.createElement('div');
    message.classList.add('message');
    message.textContent = text;
    container.append(message);
    setTimeout(() => container.removeChild(message), 2500);
}

async function copiarResultado() {
    const btn = document.getElementById('share-btn');
    let tentativas = currentRow + 1;
    if (tentativas > 6 && !isGameOver) tentativas = 6;
    if (!wordle || (currentRow >= 5 && document.querySelector('.green-overlay') === null)) tentativas = "X";
    if (isGameOver) {
         const linhas = document.querySelectorAll('.tile-row');
         linhas.forEach((row, index) => {
             const tiles = row.children;
             let tudoVerde = true;
             for(let t of tiles) if(!t.classList.contains('green-overlay')) tudoVerde = false;
             if(tudoVerde) tentativas = index + 1;
         });
    }

    let texto = `NEXTAGE 🧛 ${tentativas}/6\n\n`;
    for (let i = 0; i < 6; i++) {
        const row = document.getElementById(`row-${i}`);
        const tiles = row.children;
        let linha = "";
        let temCor = false;
        for (let tile of tiles) {
            if (tile.classList.contains('green-overlay')) { linha += "🟩"; temCor = true; }
            else if (tile.classList.contains('yellow-overlay')) { linha += "🟨"; temCor = true; }
            else if (tile.classList.contains('grey-overlay')) { linha += "⬛"; temCor = true; }
        }
        if (temCor) texto += linha + "\n";
    }
    texto += `\n🔥 Sequência: ${sequenciaAtualLocal}`;
    texto += `\nJogue agora: ${window.location.href}`;

    try {
        await navigator.clipboard.writeText(texto);
        const original = btn.textContent;
        btn.textContent = "COPIADO! ✅";
        setTimeout(() => btn.textContent = original, 2000);
    } catch (e) { alert("Erro ao copiar."); }
}

async function resetGame() {
    localStorage.removeItem('nextage_save');
    await getRandomWord();
    currentRow = 0;
    currentTile = 0;
    isGameOver = false;
    guessRows.forEach(row => row.fill(''));
    document.querySelectorAll('.tile').forEach(tile => {
        tile.textContent = '';
        tile.classList.remove('green-overlay', 'yellow-overlay', 'grey-overlay');
        tile.style.borderColor = '#3a3a3c';
    });
    document.querySelectorAll('.keyboard-button').forEach(btn => btn.classList.remove('green-overlay', 'yellow-overlay', 'grey-overlay'));
    document.getElementById('modal-overlay').style.display = 'none';
}

// ==========================================
// --- INICIALIZAÇÃO E EVENTOS ---
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    createGrid();
    createKeyboard();

    const carregou = carregarJogoLocal();
    if (carregou) {
        reconstruirTabuleiro();
    } else {
        await getRandomWord();
    }

    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.onclick = copiarResultado;

    const rankingBtn = document.getElementById('ranking-btn');
    if (rankingBtn) rankingBtn.onclick = () => {
        document.getElementById('ranking-overlay').style.display = 'flex';
        carregarRanking();
    };
    document.getElementById('close-ranking').onclick = () => document.getElementById('ranking-overlay').style.display = 'none';

    const donateBtn = document.getElementById('donate-btn');
    if (donateBtn) donateBtn.onclick = () => {
        document.getElementById('donate-overlay').style.display = 'flex';
        carregarMuralDoadores();
    };
    document.getElementById('close-donate').onclick = () => document.getElementById('donate-overlay').style.display = 'none';

    const closeAdmin = document.getElementById('close-admin');
    if(closeAdmin) closeAdmin.onclick = () => document.getElementById('admin-overlay').style.display = 'none';

    document.getElementById('info-btn').onclick = () => document.getElementById('help-overlay').style.display = 'flex';
    document.getElementById('close-help').onclick = () => document.getElementById('help-overlay').style.display = 'none';
    document.getElementById('close-modal').onclick = () => document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('reset-game').onclick = resetGame;
    document.getElementById('close-login').onclick = () => document.getElementById('login-overlay').style.display = 'none';

    document.addEventListener('keydown', (e) => {
        if (!e.key) return;
        const key = e.key.toUpperCase();
        
        const modalResultado = document.getElementById('modal-overlay');
        const isModalResultadoAberto = modalResultado.style.display === 'flex';
        const outrosModais = document.querySelector('.modal-overlay[style*="display: flex"]:not(#modal-overlay)');

        if (outrosModais) return;

        if (isGameOver) {
            if (key === 'ENTER') {
                if (isModalResultadoAberto) resetGame();
                else modalResultado.style.display = 'flex';
            }
            return;
        }
        handleInput(key);
    });
});

// ==========================================
// --- FIREBASE / AUTH / ADMIN ---
// ==========================================

const ADMIN_EMAIL = "taagnyaugusto3214@gmail.com"; 

function iniciarMonitoramentoAuth() {
    if (!window.auth) { setTimeout(iniciarMonitoramentoAuth, 500); return; }

    window.onAuthStateChanged(window.auth, async (user) => {
        const btn = document.getElementById('open-login-btn');
        const userNameDisplay = document.getElementById('user-name-display');
        const loginOverlay = document.getElementById('login-overlay');
        const adminBtn = document.getElementById('admin-btn-float');

        if (user) {
            usuarioAtual = user;
            carregarSequenciaDoBanco(user.uid);
            
            // Verifica Admin
            if (user.email === ADMIN_EMAIL) {
                if(adminBtn) {
                    adminBtn.style.display = 'block';
                    
                    // NOVO: Abre o painel E carrega as estatísticas
                    adminBtn.onclick = () => {
                        document.getElementById('admin-overlay').style.display = 'flex';
                        window.carregarStatsAdmin(); 
                    };
                }
            }

            if (loginOverlay) loginOverlay.style.display = 'none';

            let nome = user.displayName || user.email.split('@')[0];
            if (userNameDisplay) userNameDisplay.textContent = "OLÁ, " + nome.toUpperCase();

            if (btn) {
                btn.innerHTML = "👤";
                btn.className = "profile-btn";
                btn.style.backgroundColor = "#eee";
                btn.onclick = (e) => { e.stopPropagation(); window.toggleUserMenu(); };
            }
        } else {
            usuarioAtual = null;
            sequenciaAtualLocal = 0;
            if(adminBtn) adminBtn.style.display = 'none';
            document.getElementById('user-menu').style.display = 'none';

            if (btn) {
                btn.textContent = "FAZER LOGIN";
                btn.className = "login-btn-header";
                btn.style.backgroundColor = "#ff3b3b";
                btn.onclick = () => { showLogin(); document.getElementById('login-overlay').style.display = 'flex'; };
            }
        }
    });
}
iniciarMonitoramentoAuth();

// --- FUNÇÕES GLOBAIS ---
window.toggleUserMenu = function() {
    const menu = document.getElementById('user-menu');
    menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
};

window.sairDaConta = async function() {
    await window.signOut(window.auth);
    window.location.reload();
};

async function salvarVitoria() {
    if (!usuarioAtual) return;
    sequenciaAtualLocal++;
    try {
        await window.updateDoc(window.doc(window.db, "jogadores", usuarioAtual.uid), {
            vitorias: window.increment(1),
            sequenciaAtual: window.increment(1)
        });
    } catch(e){}
}

async function salvarDerrota() {
    if (!usuarioAtual) return;
    sequenciaAtualLocal = 0;
    try {
        await window.updateDoc(window.doc(window.db, "jogadores", usuarioAtual.uid), {
            tentativas: window.increment(1),
            sequenciaAtual: 0
        });
    } catch(e){}
}

async function carregarSequenciaDoBanco(uid) {
    try {
        const q = window.query(window.collection(window.db, "jogadores"));
        const snapshot = await window.getDocs(q);
        snapshot.forEach(doc => {
            if(doc.id === uid) sequenciaAtualLocal = doc.data().sequenciaAtual || 0;
        });
    } catch(e){}
}

async function carregarRanking() {
    const listaContainer = document.querySelector('.ranking-list-container');
    listaContainer.innerHTML = '<p style="text-align:center;color:white;padding:20px;">Carregando...</p>';
    try {
        const q = window.query(window.collection(window.db, "jogadores"), window.orderBy("vitorias", "desc"), window.limit(20));
        const querySnapshot = await window.getDocs(q);
        listaContainer.innerHTML = '';
        let posicao = 1;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let medalha = posicao;
            if (posicao === 1) medalha = '🏆 1';
            if (posicao === 2) medalha = '🥈 2';
            if (posicao === 3) medalha = '🥉 3';
            const tentativas = (data.tentativas || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            const sequencia = (data.sequenciaAtual || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            listaContainer.innerHTML += `
                <div class="ranking-row">
                    <span class="col-top">${medalha}</span>
                    <span class="col-name">${data.nome}</span>
                    <span class="col-stat highlight-blue">${tentativas}</span>
                    <span class="col-stat highlight-blue">${sequencia}</span>
                </div>`;
            posicao++;
        });
    } catch (e) { listaContainer.innerHTML = '<p style="color:red;text-align:center;">Erro ao carregar ranking.</p>'; }
}

window.adicionarPalavraAoBanco = async function() {
    const val = document.getElementById('new-word-input').value.toUpperCase().trim();
    if(val.length === 5) {
        await window.setDoc(window.doc(window.db, "dicionario", val), { palavra: val });
        alert("Adicionado!");
    }
};

window.definirPalavraDoDia = async function() {
    const val = document.getElementById('force-word-input').value.toUpperCase().trim();
    if(!val) {
        try { await window.deleteDoc(window.doc(window.db, "config", "jogo_diario")); alert("Modo Aleatório"); } catch(e){}
    } else if(val.length === 5) {
        await window.setDoc(window.doc(window.db, "config", "jogo_diario"), { palavraAtiva: val });
        alert("Definido: " + val);
    }
};

window.buscarJogadorParaBanir = async function() {
    const term = document.getElementById('ban-search-input').value.toUpperCase();
    const list = document.getElementById('ban-list-container');
    list.innerHTML = "Buscando...";
    const q = window.query(window.collection(window.db, "jogadores"));
    const snap = await window.getDocs(q);
    list.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        if(d.nome && d.nome.includes(term)) {
            list.innerHTML += `<div class="ban-item"><span>${d.nome}</span><button onclick="confirmarBanimento('${doc.id}', '${d.nome}')" style="color:red">X</button></div>`;
        }
    });
};

window.confirmarBanimento = async function(uid, nome) {
    if(confirm("Banir " + nome + "?")) {
        await window.deleteDoc(window.doc(window.db, "jogadores", uid));
        alert("Banido.");
        window.buscarJogadorParaBanir();
    }
};

window.adicionarDoadorManual = async function() {
    const nome = document.getElementById('donor-name').value;
    const valor = document.getElementById('donor-value').value;
    await window.addDoc(window.collection(window.db, "doacoes"), { nome, valor, data: new Date() });
    alert("Doador Add");
};

window.carregarDoacoesAdmin = async function() {
    const list = document.getElementById('admin-donations-list');
    list.innerHTML = "Carregando...";
    const q = window.query(window.collection(window.db, "doacoes"), window.orderBy("data", "desc"), window.limit(20));
    const snap = await window.getDocs(q);
    list.innerHTML = "";
    snap.forEach(doc => {
        list.innerHTML += `<div class="admin-donation-item"><span>${doc.data().nome} - R$${doc.data().valor}</span><button onclick="excluirDoacao('${doc.id}')" style="color:red">X</button></div>`;
    });
};

window.excluirDoacao = async function(id) {
    if(confirm("Apagar doação?")) {
        await window.deleteDoc(window.doc(window.db, "doacoes", id));
        window.carregarDoacoesAdmin();
    }
};

window.carregarMuralDoadores = async function() {
    const lista = document.getElementById('donors-list');
    try {
        const q = window.query(window.collection(window.db, "doacoes"), window.orderBy("data", "desc"), window.limit(50));
        const snapshot = await window.getDocs(q);
        if (snapshot.empty) { lista.innerHTML = '<p class="donate-loading">Seja o primeiro a apoiar! 💚</p>'; return; }
        lista.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            lista.innerHTML += `<div class="donor-item"><span>${data.nome}</span><span class="donor-badge">R$ ${data.valor}</span></div>`;
        });
    } catch (e) { lista.innerHTML = '<p style="color:red">Erro.</p>'; }
};

window.zerarTodasSequencias = async function() {
    if(!confirm("ATENÇÃO: Zerar foguinho de todos?")) return;
    if(prompt("Senha:") !== "BATATA123") return;
    const q = window.query(window.collection(window.db, "jogadores"), window.where("sequenciaAtual", ">", 0));
    const snap = await window.getDocs(q);
    snap.forEach(doc => window.updateDoc(doc.ref, { sequenciaAtual: 0 }));
    alert("Zerado.");
};

window.fazerLoginSocial = async function() {
    const provider = new window.GoogleAuthProvider();
    try {
        const result = await window.signInWithPopup(window.auth, provider);
        const userRef = window.doc(window.db, "jogadores", result.user.uid);
        await window.setDoc(userRef, { nome: result.user.displayName.toUpperCase(), email: result.user.email }, { merge: true });
        if (result._tokenResponse && result._tokenResponse.isNewUser) {
            await window.setDoc(userRef, { vitorias: 0, tentativas: 0, sequenciaAtual: 0, jogos: 0 }, { merge: true });
        }
        document.getElementById('login-overlay').style.display = 'none';
        carregarSequenciaDoBanco(result.user.uid);
    } catch(e) { alert("Erro login Google: " + e.message); }
};

window.fazerLoginFirebase = async function() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-pass').value;
    try {
        const cred = await window.signInWithEmailAndPassword(window.auth, email, senha);
        usuarioAtual = cred.user;
        carregarSequenciaDoBanco(usuarioAtual.uid);
        document.getElementById('login-overlay').style.display = 'none';
    } catch(e) { alert("Erro: " + e.code); }
};

window.criarContaFirebase = async function() {
    const nome = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-pass').value;
    try {
        const cred = await window.createUserWithEmailAndPassword(window.auth, email, senha);
        await window.setDoc(window.doc(window.db, "jogadores", cred.user.uid), {
            nome: nome.toUpperCase(), email, vitorias: 0, tentativas: 0, sequenciaAtual: 0, jogos: 0
        });
        alert("Conta criada!");
    } catch(e) { alert(e.message); }
};

function showLogin() {
    const googleIcon = `<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>`;
    document.getElementById('auth-container').innerHTML = `
    <input type="email" id="login-email" class="auth-input" placeholder="E-mail">
    <input type="password" id="login-pass" class="auth-input" placeholder="Senha">
    <button id="btn-entrar" class="auth-submit-btn" onclick="fazerLoginFirebase()">ENTRAR</button>
    <div class="separator">OU</div>
    <button class="social-btn" onclick="fazerLoginSocial()">${googleIcon} Entre com o Gmail</button>
    <p class="auth-switch" onclick="showRegister()">NÃO TEM CONTA?? Cadastre-se</p>`;
}

function showRegister() {
    document.getElementById('auth-container').innerHTML = `
    <input type="text" id="reg-name" class="auth-input" placeholder="Digite seu nome">
    <input type="email" id="reg-email" class="auth-input" placeholder="E-mail">
    <input type="password" id="reg-pass" class="auth-input" placeholder="Senha">
    <button class="auth-submit-btn" style="background-color: #ff3b3b;" onclick="criarContaFirebase()">CADASTRAR</button>
    <p class="auth-switch" onclick="showLogin()">JÁ POSSUI UMA CONTA? Faça LOGIN</p>`;
}

// --- FUNÇÃO PARA CONTAR JOGADORES (ADMIN) ---
window.carregarStatsAdmin = async function() {
    const display = document.getElementById('total-users-count');
    if (!display) return;
    
    display.textContent = "Contando...";
    try {
        // Busca todos os jogadores para contar
        const q = window.query(window.collection(window.db, "jogadores"));
        const snapshot = await window.getDocs(q);
        
        display.textContent = snapshot.size; // Mostra o total
    } catch (e) {
        console.error(e);
        display.textContent = "Erro";
    }
};








