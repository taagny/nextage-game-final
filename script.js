const tileDisplay = document.querySelector('#tile-container');
const keyboard = document.querySelector('#keyboard-container');

// Dicionário de Palavras (Adicione mais se quiser)
const validWords = [
    'IDEIA', 'AMIGO', 'CASAS', 'TERRA', 'FOGOS', 'NOITE', 
    'PODER', 'TEMPO', 'MUNDO', 'LIVRO', 'PLANO', 'FLORA',
    'RAMOS', 'CARRO', 'NAVIO', 'PEIXE', 'DADOS', 'SAGAZ',
    'NOBRE', 'AFETO', 'SUTIL', 'VIGOR', 'AUDAZ', 'SANTO',
    'TESTE', 'SOLAR', 'PRATO', 'GRUPO', 'PODAM','TRENS','FUZIL','CHAVE', 'PORTA', "CASAL", "ADEGA", "APTAS", "TINTA", "FALSO", "PICOS", "ATUAR", "PISTA", "BURRO", "FAZER",
    "PIZZA", "QUINA", "PINTA", "BANAL", "CORPO", "DETER", "TENUE", "ABONO", "FLUXO", "PAVIO", "LIMAO", "CAQUI", "FINOS", "OBTER", "OVULO", "GRAUS", "CISAO", "ESTES", "HIDRO", "SUPER", "SINTO", "GRUTA", "TONTA", "MAGRO", "FESTA", "PAGAM",
    "GRUPO", "GERAL", "PLACA", "TELAS", "POUCA", "ATUAL", "PODER", "ASSIM", "INATA", "GERME", "BOSSA", "PRESA", "TORTA", "LENTO", "CRIAR", "TORAX", "TUFAO", "MULAS", "BEBER", "BOINA", "POLPA", "MAGIA", "NESSA", "CRASE", "PINHO", "GORDO", "COCOS", "BAZAR", "CAPIM", "LEMES", "LOGAR", "SANTO", "TOSAR", "LATEX", "LATAS", 
    "GINGA", "DESSA", "LIMBO", "HONRA", "NOTAR", "MAIOR", "CASPA", "EUROS", "GRADE", "PAGAO", "CLONE", "COMUM", "RITMO", "VERDE", "LEIGA", "BRACO", "MARES", "SECOS", "SOGRA", "LOUSA", "RITMO", "ANSIA", "PARMA", "PRETA", "MALES", "NINJA", "FOSCA", "DEVER", "TANGA", "UNIDA", "COIFA", "TODOS", "GEAMEA", "GATAS", "MALTA", "TRUPE", "PULGA", "HOMEM", "UNTAR", "IRADO", "SECAR", "FUNGO", "ROJAO", "SURDO", "LABIA", "PILHA", "MONGE", "BOLOS", "SELAR", "CALOS", "ATRIZ", "BONUS", "AREIA", "SKATE", "GERAR", "DEVIR", "CEGOS", "EXAME", "FUGIR", "SOUTO", "OUVIR", "ALUNO", "VORAZ", "VASOS", "VERBO", "PADRE", "NETOS", "CANAL", "PAZES", "ANTES", 
    "CREPE", "CORRE", "CRIME", "ASSIS", "MILHO", "MEIOS", "TEDIO", "TOPAR", "VAGEM", "METAL", "LENDA", "LOMBA", "PURAS", "DUQUE", "CLIMA", "TERCA", "DEBIL", "USINA", "CHORA", "BELAS", "ALIAR", "NUDEZ", "RIVAL", "DRAMA", "TREZE", "FRUTA", "TEMOR", "PIANO", "COSMO", "NINAR", "BRUXO", "BABAR", "MAGRA", "AGUDA", "LEIGO", "FACIL", "COLAR", "TEMPO", "MITOS", "RATOS", "CHAVE", "HINDU", "INCAS", "NULOS", "OPCAO", "OBESO", "GORDA", "CAIXA", "POLEN", "BOCAL", "PRETO", "ADIAR", "LICEU", "GRAMA", "RARAS", "FRACO", "SARRO", "MISTO", "RALAR", "MESAS", "CUECA", "HARPA", "GIRAR", "VAGOS", "MAGNA", "VOCES", "GRIPE", "LUVAS", "FREAR", "CALVO", "COSTA", "ALMAS", "FEDOR", "VAGAR", "CHUVA", "MACHO", "LADOS", "SACOS", "FEAMEA", "FLORA", "NERVO", "PODIO", "LAGOS", "VINTE", "CARTA", "MEDIA", "BASES", "FEITA", "MICRO", "GELAR", "ARDER", "PESAR", "NAVAL", "ESQUI", "ACOES", "DAMAS", "VARAL", "BALDE", "ACIDA", "BUCHO", "FEMUR", "TORTO", "CAROS", "TABUS", "TIROS", 
    "MAMAE", "PAPAI", "TENIS", "RIMAR", "BIFES", "BACIA", "RELER", "HORTO", "XAMPU", "CUJOS", "ILESA", "DADOS", "NADAR", "MIMOS", "MUSGO", "KARMA", "COPAS", "ERVAS", "FIGOS", "RAMOS", "AVIDA", "VIVER", "BRISA", "DOGMA", "FEIOS", "FOFAS", "MELAO", "MIUDA", "AREAL", "PISAR", "RECEM", "RASOS", "FATAL", "OPTAR", "SUAVE", "FRUTO", "ARDUO", "PONTO", "VIRUS", "VETAR", "TENSA", "SOMAR", "MUITA", "BUMBA", "FELIZ", "BURRA", "ANEIS", "NOCAO", "DESTA", "CILIO", "NOBRE", "REZAR", "SUJAR", "SUTIA", "ERROS", "RICAS", "SERIE", "MALTE", "ARDUA", "ALHOS", "LIDOS", "LAICO", "JEJUM", "TENSO", "MARTE", "LEAIS", "ALCAR", "MAMAR", "OTICO", "LOTAR", "FREVO", "BARCO", "LESAO", "SUJOS", "LUMEN", "BAMBU", "CINZA", "ERRAR", "TUTOR", "BOTAR", "ALUNA", "NESTA", "TOCAR", "CONES", "GRATA", "SAIDA", "GUIAR", "VAZAR", "PUROS", "UTEIS", "TREVO", "PANDA", "METRO", "COESO", "PICAR", "AMADA", "CABAL", "FIAPO", "BOCAO", "FUZUE", "FUROR", "PIRES", "CURAR", "FOLIA", "ALGAS",
    "ALTAR", "FUMAR", "TRIPE", "FORTE", "PRAIA", "SIRIO", "SINOS", "MUNDO", "PECAR", "CORJA", "OTIMA", "LIXAR", "IDOSO", "CARMA", "FOSSA", "CARAS", "NEGAR", "LIRIO", "DUNAS", "CORAL", "TOLDO", "DELTA", "BINGO", "GOLFE", "FARDA", "PAGOS", "ACASO", "AQUEM", "SUECA", "MATOS", "FUSCA", "RACAO", "TEIAS", "HORTA", "AMENO", "MERCE", "NAVES", "CERVO", "PATOS", "DUTOS", "CERTA", "VIRIL", "GAMBA", "RETRO", "AUREA", "CUPIM", "FEBRE", "AUTOS", "VALSA", "NORTE", "LIGAR", "CERNE", "IDOLO", "JUIZO", "MUDOS", "FILHO", "TRIOS", "JUIZA", "PERTO", "TALCO", "SUNGA", "RUSSA", "VOTAR", "HEROI", "MUITO", "SUECO", "TURCA", "FEUDO", "MAJOR", "CIUME", "GOELA", "MARRA", "LACOS", "REGER", "JUROS", "ABRIR", "FEROZ", "MOIDA", "MODOS", "NOZES", "SOCIO", "MOEDA", "ROCAR", "TINTO", "DEDOS", "RASAS", "SEDES", "CENAS", "SALSA", "ESTAS", "REUSO", "TELAO", "REFIL", "PLENA", "COMER", "AMPLO", "LIDAR", "FATOR", "ARMAR", "TRAPO", "TEXTO", "OPACA", "REVES", "ARIDO", "ETICO", "FORUM", "DIETA", "NOMES", "TRIBO", "EXITO", "MIDIA", "BRUTO", "BELOS", "SODIO", "TUBOS", "OPERA", "SALAS", "OMBRO", "ROUPA", "MUTUO", "FLUIR", "VOSSA", "VACAS", "BOATO", "BATER", "BANDO", "GALHO", "VALOR", "NAVIO", "ROLAR", "CUBOS", "TACOS", "VERME", "RITOS", "AUTOR", "DEUSA", "BARES", "TURNE", "OUSAR", "POLIR",
    "DIZER", "VOLEI", "LOIRO", "LETAL", "CALMA", "HIPER", "SOLOS", "ECOAR", "IMPOR", "MUSEU", "VESPA", "UMIDA", "MIRAR", "OSTRA", "LORDE", "FACAO", "SABIO", "BUCAL", "COURO", "DEPOR", "GREGO", "NOSSA", "FUGAS", "CANON", "MANSO", "DOMAR", "BUCHA", "LITRO", "MIOPE", "OLHAO", "AMENA", "CEDER", "VIDAS", "REMAR", "CIVIL", "AROMA", "GOTAS", "FRASE", "NASAL", "BALAO", "SAUNA", "BOLHA", "BAMBA", "SADIO", "CAIRO", "GAFES", "CLICA", "VOTOS", "ACUDE", "MIOLO", "TERCO", "FAVOR", "SURDA", "ANTAS", "MEDIR", "SOGRO", "ZIPER", "SELIM", "CLARA", "FERAS", "OUTRA", "MESES", "AEREA", "ABRIL", "BANCO", "LOUCO", "ALPES", "DEDAO", "LICAO", "FOGAO", "VACUO", "BRASA", "TODAS", "LONGA", "LISOS", "NEVOA", "ISCAS", "PEIXE", "LINHO", "MURAL", "TIBIA", "PLENO", "COCAR", "MODAS", "LEGAL", "CEDRO", "IRMAO", "CONDE", "FUTIL", "FURAR", "DISSO", "TETRA", "TURFE", "SUMIR", "GUETO", "PORCO", "LONGE", "GALAO", "OUTRO", "USUAL", "BUNDA", "MEMES", "PANOS", "SARJA", "PUNHO", "POCAS", "OFURO", "BRAVO", "PINOS", "PONTE", "ANUAL", "SIGNO", "CALAR", "ROXAS", "PELOS", "TIARA", "ATLAS", "VULTO", "BREVE", "POEMA", "CAMAS", "ADVIR", "RUBRO", "EXODO", "NOVOS", "LIBRA", "PENCA", "AMORA", "VAPOR", "REDES", "VILAO", "ANZOL", "MURRO", "LETRA", "DOLAR", "AMIDO", "COFRE", "CESTO", "BOMBA", "GOLFO", "PULAR", "OSSEA", "ANIMO", "LAGOA", "IMUNE", "HORAS", "SAGAZ", "LOCAO", "LAJES", "RETAS", "MUSAS", "SACAR", "INDIA", "SEXTO", "FEIRA", "CASAL", "ARCOS", "ONTEM", "GANSO", "LONGO", "RURAL", "OLHAR", "CUBAS", "PAMPA", "GLOBO", "PERUA", "SELVA", "LEITO", "TRAMA", "ROSTO", "SERVO", "FADAS", "AULAS", "LOTUS", "NEVAR", 
    "CACAR", "JOGAR", "DUPLA", "PRECE", "AGEIS", "CAUDA", "BREGA", "FADOS", "MOELA", "LERDO", "TOUCA", "NATAS", "PUXAR", "DARDO", "TUNEL", "AUDIO", "GIBIS", "ILESO", "MEROS", "FUROS", "PRACA", "CHAPA", "COPIA", "SURFE", "OBRAS", "RAIAR", "ATROZ", "SITIO", "OVNIS", "LATIM", "DOTAR", "CITAR", "OLHOS", "REGAR", "SALMO", "ARENA", "PAGAR", "TRECO", "UNCAO", "ETNIA", "MALAS", "POLVO", "NOVAS", "AVEIA", "VASTO", "VOVOS", "RUSSO", "LAVAR", "MUDAR", "MEIAS", "PATAS", "JOIAS", "ALVOS", "GIROS", "RENTE", "NARIZ", "USADA", "TECER", "VICIO", "TRENO", "PAPOS", "DUPLO", "AMBOS", "ODIAR", "VELHA", "BODAS", "VISAO", "CARGA", "FIXAR", "GARRA", "BOBOS", "SETOR", "ESSES", "LOUCA", "BICHO", "BOBAS", "VINHO", "LONAS", "GOLPE", "SAFRA", "MEIGO", "BENTA", "ARROZ", "NENEM", "LOJAS", "TCHAU", "SABIA", "CALDA", "CHALE", "MOCOS", "SUINO", "LOIRA", "ORFAO", "COUVE", "FALIR", "GALOS", "IMPIO", "PODRE", "GAITA", "CARNE", "MECHA", "DAQUI", "NOSSO", "VAZIO", "PRUMO", "FRIAS", "LOMBO", "INDIO", "FOTOS", "EPICO", "AGUIA", "OSSEO", "PISOS", "CIVIS", "GOSMA", "CASAR", "NACAO", "VELOZ", "LISAS", "ALGUM", "POTES", "DOIDA", "SABER", "JUSTO", "JEITO", "BICOS", "ROLHA", "GEADA", "REFEM", "RAIOS", "MANTA", "CASTA", "LOCAL", "CAPAO", "GARCA", "AEREO", "SOSIA", "ARAME", "DIQUE", "SABAO", "ELFOS", "RACAS", "TUMBA", "PIPAS", "SANAR", "NINFA", "BREJO", "MANHA", "MOLAS", "POREM", "ITENS", "FOBIA", "JULHO", "CRISE", "VINDA", "VISAR", "PROVA", "RUIVA", "VULGO", "ONDAS", "FURIA", "BRITO", "HIFEN", "GEMEO", "FLUOR", "MENOS", "TIMES", "REVER", "TELHA", "HUMOR", "TRETA", "VIDEO", "TESTE", "ARCAR", "BERCO", "LESTE", "CARIE", "FOLHA", "FIXOS", "TABUA", "TOCHA", "RUINS", "NUVEM", "ZONAS", "POCOS", "VENUS", "SARNA", "AONDE", "TOMAR", "TESES", "LUGAR", "PALMA", "PRECO", "PULOS", "SARAU", "SARDA", "BOLSO", "ROTOR", "CIVEL", "FILHA", "ROUCA", "BESTA", "FUGAZ", "OBVIO", "CLERO", "DENSA", "DURAR", "BOLAO", "COMBO", "FRADE",
    "BARBA", "SEITA", "GERIR", "ETAPA", "PUNIR", "TRUCO", "VEIAS", "CASCO", "JEGUE", "GRAOS", "SELOS", "HABIL", "VIVOS", "TERNO", "MOSCA", "OASIS", "CAULE", "UNHAS", "UNICO", "DUZIA", "MACRO", "PAPEL", "PLEBE", "POSSE", "FOCAL", "BRUTA", "ROBOS", "SABOR", "ACIMA", "ROCHA", "SACRA", "LINDO", "PAVAO", "SIGLA", "TOURO", "JUSTA", "CETIM", "CAIDA", "SALAO", "MOCAS", "MEXER", "LEQUE", "PRAXE", "LAZER", "TRIPA", "FEIXE", "RUMOR", "GIRIA", "DANOS", "LENHA", "REDOR", "MACIA", "FRIOS", "ARTES", "CAVAR", "PESOS", "BONDE", "QUAIS", "BECOS", "MUMIA", "RISOS", "IGUAL", "CELAS", "ELITE", "SENAO", "ULTRA", "NELES", "DOIDO", "RELUZ", "JURAR", "ENTAO", "CLORO", "MILHA", "UNIAO", "LIXAO", "TANTO", "PRAGA", "FOGOS", "TOSCO", "CHATO", "CARGO", "IDOSA", "LARVA", "BISPO", "BANJO", "VASTA", "QUASE", "MEIGA", "PEGAR", "EIXOS", "TERMO", "PNEUS", "TANGO", "RUGIR", "FARSA", "VALER", "MORTA", "ZERAR", "DOCES", "FOICE", "HIENA", "PORCA", "PEDIR", "SACRO", "RIMEL", "ASPAS", "VIGAS", "GESTO", "VAZAO", "HARAS", "SADIA", "CHEIO", "LILAS", "TIPOS", "MOTOR", "UNICA", "TAXIS", "DUETO", "IRMAS", "PUXAO", "BOCAS", "CARRO", "GRATO", "POMAR", "GAVEA", "APICE", "NESSE", "MATAR", "MANTO", "TACAS", "JUNHO", "TOTAL", "CALDO", "MANGA", "QUOTA", "FATIA", "MISTA", "DESDE", "GENTE", "LEITE", "PORRE", "LINCE", "FALSA", "TIRAR", "FAROL", "EXPOR", "SUPOR", "VOCAL", "ROLOS", "AMPLA", "TRICO", "HINOS", "LENTA", "VETOR", "EPOCA", "ROSAS", "CRAVO", "PATIO", "CLUBE", "ETICA", "BLUSA", "BUSTO", "PEGOS", "RODAR", "CALOR", "RAMPA", "PRATA", "FAIXA", "PONTA", "SUTIS", "MALES", "OUROS", "OESTE", "LOBOS", "BONES", "PAVOR", "BAITA", "ASTRO", "ARDOR", "TAPAR", "CALVA", "FUNIL", "PRADO", "FACAS", "URNAS", "MAIAS", "GENES", "CIRCO", "TRIGO", "PSICO", "AFINS", "CULTO", "CACOS", "OTICA", "IMPAR", "LINHA", "JOVEM", "CHATA", "CRUAS", "POMBO", "PUDIM", "CINTO", "RENAL", "LEBRE", "PROLE", "AUREO", "METER", "TOTEM", "DIABO", "SILOS",
    "BALAS", "IDEAL", "ANJOS", "RAPAZ", "CANOA", "CACAU", "VITAL", "MORNA", "RUMOS", "CABER", "BODES", "CAPUZ", "GENRO", "LUNAR", "CICLO", "CESTA", "CALMO", "SEIVA", "MORAL", "TEMER", "NISSO", "MENOR", "BALSA", "MOGNO", "FISCO", "VOZES", "PALCO", "ADEUS", "FROTA", "MANIA", "GOSTO", "ARIES", "NEGRO", "LUTAR", "PRATO", "ANDAR", "ALTOS", "LAPIS", "CLAVE", "FIBRA", "NORMA", "POETA", "VELHO", "GRAXA", "VALAS", "ROSCA", "ZELAR", "DUCHA", "JARRA", "HASTE", "POBRE", "PEDRA", "OSCAR", "MEDIO", "OPACO", "BULBO", "RUDES", "SUBIR", "VETOS", "BEATA", "BOTAO", "COISA", "NISTO", "FAUNA", "MESMA", "MEDOS", "PEDAL", "TARJA", "NINHO", "DONOS", "ACIDO", "FALAR", "MOITA", "VOSSO", "CREDO", "RUIVO", "ROMBO", "VAZIA", "SORTE", "GRANA", "TURNO", "PESTO", "BOLSA", "CABOS", "LINDA", "CULTA", "GASES", "SUSHI", "ALGOZ", "PENTE", "CENTO", "TIGRE", "FAVAS", "PILAO", "MAGOA", "POCAO", "TRONO", "CLICO", "FORNO", "SUTIL", "IDEIA", "DOCIL", "PARAR", "MINHA", "PALMO", 'PODAM', 'TRENS',
    "EXATA", "PROSA", "RAZAO", "SISMO", "POROS", "FARAO", "CINCO", "VILAS", "TECNO", "MAGOS", "AGORA", "MISSA", "DITAR", "SOPAS", "PILAR", "LARES", "DIVAS", "POLAR", "GREVE", "BRUXA", "SINAL", "MAMAO", "TRUFA", "PERSA", "SOLAR", "PLUMA", "MUROS", "LENTE", "FASES", "RABOS", "RADIO", "FIADA", "DOADA", "FEIAS", "JOGOS", "PODAR", "FARRA", "ALTAS", "SOTAO", "SENSO", "BOATE", "PIRAR", "RAROS", "NUNCA", "GENIO", "ADAGA", "HOTEL", "IDADE", "BAIAS", "URANO", "PEOES", "CENSO", "GORRO", "GESSO", "GATOS", "ROTAS", "NOBEL", "CLIPE", "SEXTA", "VEADO", "FINAL", "AREAS", "CERTO", "VIGOR", "OXIDO", "PAREO", "PAUSA", "REAIS", "TONTO", "VIRAR", "PARDO", "ZINCO", "URSOS", "FARPA", "DITOS", "PERDA", "REMOS", "TENOR", "PIRAO", "BACON", "ORDEM", "SACHE", "MUTUA", "TRENS", "CHEIA", "MIRIM", "CORVO", "DORSO", "MANSA", "VINIL", "ATOMO", "REPOR", "ICONE", "PUDOR", "CARPA", "CANJA", "FOFOS", "URUBU", "ESTAR", "ZEROS", "PIADA", "EXTRA", "SENSO", "PERNA", "MOVER", "VIRAL", "NAIPE", "CISTO", "BLOCO", "CUPOM", "POVOS", "FARDO", "GRACA", "AVELA", "PALHA", "SUCOS", "TOSCA", "CASOS", "LICOR", "PICA", "GURIA", "DENSO", "TERRA", "DELAS", "RETER", "GREGA", "BIRRA", "LEMES", "LUXOS", "MIADO", "SENHA", "SONAR", "RAIVA", "MENTA", "BIOMA", "HIATO", "HAVER", "BRAVA", "BUQUE", "VEZES", 
    "ATRAS", "FOSCO", "TRAIR", "ORGAO", "CINTA", "CACHO", "COXAS", "POLOS", "ESSAS", "OLEOS", "BANDA", "LIXOS", "DORES", "ACESA", "CLARO", "DUBLE", "ALBUM", "NATAL", "AVIAO", "MASSA", "CATAR", "MAPAS", "LEVAR", "RIGOR", "POMBA", "FOSSO", "FRACA", "BANIR", "COPOS", "AMAGO", "DUROS", "ZEBRA", "CORDA", "CABRA", "MORNO", "TURMA", "MOVEL", "SETAS", "PONEI", "ORIXA", "LAUDO", "TATIL", "DOCAS", "RICOS", "DICAS", "MOTOS", "SEDAS", "PRAZO", "AGUDO", "TOLOS", "MIMAR", "FINAS", "POSAR", "NICHO", "COVAS", "TRENA", "DOSAR", "SOCOS", "BARAO", "FOCAR", "INVES", "PESTE", "ANAIS", "JAULA", "REGUA", "OMEGA", "ACHAR", "CORSO", "CANOS", "BARCA", "CAFES", "MACIO", "FATOS", "FICAR", "MOTEL", "BATOM", "TROPA", "SERIO", "JARRO", "VOGAL", "CANIL", "VISOR", "DENTE", "CASCA", "SANTA", "CHEFE", "PENTA", "FUSAO", "REINA", "GALAS", "MESMO", "CISNE", "LAPSO", "FONTE", "FOCOS", "AMIDO", "FERIR", "CEDRO", "CRUEL", "MAFIA", "EXATO", "CAPAZ", "LENCO", "ASSAR", "AINDA", "CAMPO", "ENFIM", "VERBA", "NOITE", "PENAL", "ANSIA", "SAPOS", "AMBAS", "MORAR", "AMBAR", "FONES", "AXILA", "JATOS", "POMPA", "OSSOS", "MICOS", "POUCO"
];

let wordle;
let currentRow = 0;
let currentTile = 0;
let isGameOver = false;
let usuarioAtual = null;
let sequenciaAtualLocal = 0; // Guarda a sequência (foguinho) na memória

const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<<']
];

const guessRows = Array.from({ length: 6 }, () => Array(5).fill(''));

// ==========================================
// --- FUNÇÕES DO JOGO ---
// ==========================================

function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * validWords.length);
    wordle = validWords[randomIndex].toUpperCase();
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
    }
}

function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = document.getElementById(`row-${currentRow}-tile-${currentTile}`);
        tile.textContent = '';
        guessRows[currentRow][currentTile] = '';
    }
}

function checkRow() {
    const guess = guessRows[currentRow].join('');
    
    if (guess.length !== 5) return;

    if (!validWords.includes(guess)) {
        showMessage('Palavra não encontrada');
        const row = document.getElementById(`row-${currentRow}`);
        row.classList.add('shake');
        setTimeout(() => row.classList.remove('shake'), 500);
        return;
    }

    const rowTiles = document.getElementById(`row-${currentRow}`).children;
    
    // Pinta as cores
    for (let i = 0; i < 5; i++) {
        const letter = guess[i];
        const tile = rowTiles[i];
        let colorClass = wordle[i] === letter ? 'green-overlay' : (wordle.includes(letter) ? 'yellow-overlay' : 'grey-overlay');
        
        tile.classList.add(colorClass);
        tile.style.borderColor = colorClass === 'green-overlay' ? '#538d4e' : (colorClass === 'yellow-overlay' ? '#b59f3b' : '#3a3a3c');
        updateKeyboardStatus(letter, colorClass);
    }

    if (guess === wordle) {
        setTimeout(() => { showResult(true); isGameOver = true; }, 100);
    } else {
        if (currentRow >= 5) {
            setTimeout(() => { showResult(false); isGameOver = true; }, 100);
        } else {
            currentRow++;
            currentTile = 0;
        }
    }
}

function updateKeyboardStatus(letter, colorClass) {
    const btn = document.getElementById(letter);
    if (!btn || btn.classList.contains('green-overlay')) return;
    btn.classList.remove('yellow-overlay', 'grey-overlay');
    btn.classList.add(colorClass);
}

// ==========================================
// --- RESULTADO E SEQUÊNCIA ---
// ==========================================

async function showResult(won) {
    const modal = document.getElementById('modal-overlay');
    modal.style.display = 'flex';
    
    document.getElementById('modal-title').textContent = won ? "PARABÉNS!" : "FIM DE JOGO";
    document.getElementById('modal-word-reveal').textContent = `A palavra era: ${wordle}`;
    
    // --- PROTEÇÃO CONTRA ERRO ---
    const streakDiv = document.getElementById('streak-display');
    const streakNumber = document.getElementById('streak-number');

    // Só tenta mexer no estilo se o elemento existir no HTML
    if (streakDiv && streakNumber) {
        if (usuarioAtual) {
            streakDiv.style.display = 'flex';
            
            // Salva antes de mostrar para garantir o valor atualizado
            if (won) {
                await salvarVitoria();
            } else {
                await salvarDerrota();
            }
            // Atualiza o número na tela
            streakNumber.textContent = Number(sequenciaAtualLocal).toLocaleString('pt-BR');
        } else {
            streakDiv.style.display = 'none';
        }
    }
    // ----------------------------

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

function resetGame() {
    getRandomWord();
    currentRow = 0;
    currentTile = 0;
    isGameOver = false;
    guessRows.forEach(row => row.fill(''));
    
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.textContent = '';
        tile.classList.remove('green-overlay', 'yellow-overlay', 'grey-overlay');
        tile.style.borderColor = '#3a3a3c';
    });
    
    const keys = document.querySelectorAll('.keyboard-button');
    keys.forEach(btn => btn.classList.remove('green-overlay', 'yellow-overlay', 'grey-overlay'));
    
    document.getElementById('modal-overlay').style.display = 'none';
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

// ==========================================
// --- BACK-END FIREBASE ---
// ==========================================

// 1. SALVAR VITÓRIA (+1 Sequência)
async function salvarVitoria() {
    if (!usuarioAtual) return;
    sequenciaAtualLocal++;
    
    const userRef = window.doc(window.db, "jogadores", usuarioAtual.uid);
    try {
        // --- ATUALIZADO: Só aumenta Vitória e Sequência ---
        await window.updateDoc(userRef, {
            vitorias: window.increment(1),
            sequenciaAtual: window.increment(1)
            // NÃO mexe em tentativas aqui
        });
    } catch (error) {
        console.error("Erro ao salvar vitória:", error);
    }
}

// 2. SALVAR DERROTA (Zera Sequência)
async function salvarDerrota() {
    if (!usuarioAtual) return;
    sequenciaAtualLocal = 0;
    
    const userRef = window.doc(window.db, "jogadores", usuarioAtual.uid);
    try {
        // --- ATUALIZADO: Zera sequência e AUMENTA tentativa ---
        await window.updateDoc(userRef, {
            sequenciaAtual: 0,
            tentativas: window.increment(1) // +1 Erro
        });
    } catch (error) {
        console.error("Erro ao salvar derrota:", error);
    }
}

// 3. CARREGAR SEQUÊNCIA DO BANCO (Ao Logar)
async function carregarSequenciaDoBanco(uid) {
    try {
        // Busca todos e filtra (método seguro sem importar getDoc)
        const q = window.query(window.collection(window.db, "jogadores"));
        const querySnapshot = await window.getDocs(q);
        querySnapshot.forEach((doc) => {
            if (doc.id === uid) {
                const data = doc.data();
                sequenciaAtualLocal = data.sequenciaAtual || 0;
                console.log("Sequência carregada:", sequenciaAtualLocal);
            }
        });
    } catch(e) { console.log("Erro carregar sequencia", e); }
}

// --- FUNÇÃO DE CARREGAR RANKING (ATUALIZADA COM PONTINHOS) ---
async function carregarRanking() {
    const listaContainer = document.querySelector('.ranking-list-container');
    listaContainer.innerHTML = '<p style="text-align:center; color:white; padding:20px;">Carregando...</p>';

    try {
        const q = window.query(window.collection(window.db, "jogadores"), window.orderBy("vitorias", "desc"), window.limit(20));
        const querySnapshot = await window.getDocs(q);

        listaContainer.innerHTML = '';
        let posicao = 1;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let medalha = posicao;
            
            // Define os troféus
            if (posicao === 1) medalha = '🏆 1';
            if (posicao === 2) medalha = '🥈 2';
            if (posicao === 3) medalha = '🥉 3';

            // Formata os números (1000 vira 1.000)
            const tentativasFormatado = Number(data.tentativas || 0).toLocaleString('pt-BR');
            const sequenciaFormatada = Number(data.sequenciaAtual || 0).toLocaleString('pt-BR');

            const linhaHTML = `
                <div class="ranking-row">
                    <span class="col-top">${medalha}</span>
                    <span class="col-name">${data.nome}</span>
                    <span class="col-stat highlight-blue">${tentativasFormatado}</span>
                    <span class="col-stat highlight-blue">${sequenciaFormatada}</span>
                </div>
            `;
            listaContainer.innerHTML += linhaHTML;
            posicao++;
        });
    } catch (error) {
        console.error("Erro ranking:", error);
        listaContainer.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar ranking.</p>';
    }
}

// 5. CRIAR CONTA
async function criarContaFirebase() {
    const nome = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-pass').value;

    if (!nome || !email || !senha) { alert("Preencha todos os campos!"); return; }

    try {
        const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, senha);
        const user = userCredential.user;
        
        // --- ATUALIZADO ---
        await window.setDoc(window.doc(window.db, "jogadores", user.uid), {
            nome: nome.toUpperCase(),
            email: email,
            vitorias: 0,
            sequenciaAtual: 0,
            tentativas: 0 // Novo campo (começa com 0 erros)
        });
        
        alert("Conta criada com sucesso!");
    } catch (error) { alert("Erro ao criar conta: " + error.message); }
}

// 6. FAZER LOGIN
async function fazerLoginFirebase() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-pass').value;
    const btn = document.getElementById('btn-entrar');

    if (!email || !senha) { alert("Preencha e-mail e senha!"); return; }

    const textoOriginal = btn.textContent;
    btn.textContent = "ENTRANDO...";
    btn.disabled = true;

    try {
        // Tenta logar
        const userCredential = await window.signInWithEmailAndPassword(window.auth, email, senha);
        console.log("Login realizado!");
        
        // --- ATUALIZADO: APENAS FECHA O MODAL ---
        // Não mexemos no botão do header aqui. O onAuthStateChanged vai fazer isso sozinho.
        document.getElementById('login-overlay').style.display = 'none';

        // Carrega a sequencia
        usuarioAtual = userCredential.user;
        carregarSequenciaDoBanco(usuarioAtual.uid);

    } catch (error) {
        console.error(error);
        if (error.code === 'auth/wrong-password') alert("Senha errada!");
        else if (error.code === 'auth/user-not-found') alert("E-mail não existe!");
        else alert("Erro: " + error.message);
        
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

// ==========================================
// --- INTERFACE DE LOGIN (HTML) ---
// ==========================================

function showLogin() {
    const auth = document.getElementById('auth-container');
    
    // Ícone do Google
    const googleIcon = `<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>`;

    auth.innerHTML = `
        <input type="email" id="login-email" class="auth-input" placeholder="E-mail">
        <input type="password" id="login-pass" class="auth-input" placeholder="Senha">
        <button id="btn-entrar" class="auth-submit-btn" onclick="fazerLoginFirebase()">ENTRAR</button>
        
        <div class="separator">OU</div>
        
        <!-- APENAS O BOTÃO DO GOOGLE AGORA -->
        <button class="social-btn" onclick="fazerLoginSocial()">
            ${googleIcon} Entre com o Gmail
        </button>
        
        <p class="auth-switch" id="switch-to-register">NÃO TEM CONTA?? Cadastre-se</p>
    `;
    document.getElementById('switch-to-register').onclick = showRegister;
}

function showRegister() {
    const auth = document.getElementById('auth-container');
    auth.innerHTML = `
        <input type="text" id="reg-name" class="auth-input" placeholder="Digite seu nome">
        <input type="email" id="reg-email" class="auth-input" placeholder="E-mail">
        <input type="password" id="reg-pass" class="auth-input" placeholder="Senha">
        <input type="password" class="auth-input" placeholder="Confirmar Senha">
        <button class="auth-submit-btn" style="background-color: #ff3b3b;" onclick="criarContaFirebase()">CADASTRAR</button>
        <p class="auth-switch" id="switch-to-login">JÁ POSSUI UMA CONTA? Faça LOGIN</p>
    `;
    document.getElementById('switch-to-login').onclick = showLogin;
}

// ==========================================
// --- INICIALIZAÇÃO E EVENTOS ---
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    getRandomWord();
    createGrid();
    createKeyboard();

    // Botão de Doação 💚
    const donateBtn = document.getElementById('donate-btn');
    const donateOverlay = document.getElementById('donate-overlay');
    const closeDonate = document.getElementById('close-donate');
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.onclick = copiarResultado;
    }

    if (donateBtn) {
        donateBtn.onclick = () => {
            donateOverlay.style.display = 'flex';
            carregarMuralDoadores(); // Carrega a lista na hora
        };
    }
    if (closeDonate) {
        closeDonate.onclick = () => {
            donateOverlay.style.display = 'none';
        };
    }

    // Eventos de Clique
    const rankingBtn = document.getElementById('ranking-btn');
    if (rankingBtn) rankingBtn.onclick = () => {
        document.getElementById('ranking-overlay').style.display = 'flex';
        carregarRanking();
    };

    const closeRanking = document.getElementById('close-ranking');
    if (closeRanking) closeRanking.onclick = () => document.getElementById('ranking-overlay').style.display = 'none';

    document.getElementById('open-login-btn').onclick = () => {
        showLogin();
        document.getElementById('login-overlay').style.display = 'flex';
    };

    document.getElementById('close-login').onclick = () => document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('info-btn').onclick = () => document.getElementById('help-overlay').style.display = 'flex';
    document.getElementById('close-help').onclick = () => document.getElementById('help-overlay').style.display = 'none';
    document.getElementById('close-modal').onclick = () => document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('reset-game').onclick = resetGame;

    // Teclado Físico
    document.addEventListener('keydown', (e) => {
        if (!e.key) return; // Correção do bug toUpperCase
        const key = e.key.toUpperCase();
        
        const algumModalAberto = document.querySelector('.modal-overlay[style*="display: flex"]');
        const modalResultado = document.getElementById('modal-overlay');

        if (modalResultado.style.display === 'flex' && key === 'ENTER') {
            resetGame();
            return;
        }

        if (!algumModalAberto) {
            handleInput(key);
        }
    });
});

// ==========================================
// --- MONITORAMENTO DE AUTH (PERFIL 👤) ---
// ==========================================

// Função para Sair da Conta
async function sairDaConta() {
    try {
        await window.signOut(window.auth);
        document.getElementById('user-menu').style.display = 'none'; // Fecha o menu
        alert("Você saiu da conta.");
        window.location.reload(); // Recarrega a página para limpar tudo
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
}

// Função que alterna o Menu (Abre/Fecha)
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}

// ==========================================
// --- MONITORAMENTO CENTRAL DE AUTH ---
// ==========================================

function iniciarMonitoramentoAuth() {
    // 1. Se o Firebase não carregou, tenta de novo em 0.5s
    if (!window.auth) {
        setTimeout(iniciarMonitoramentoAuth, 500);
        return;
    }

    // 2. Ouve as mudanças de estado (Entrou ou Saiu)
    window.onAuthStateChanged(window.auth, async (user) => {
        const btn = document.getElementById('open-login-btn');
        const userNameDisplay = document.getElementById('user-name-display');
        const loginOverlay = document.getElementById('login-overlay');
        const adminBtn = document.getElementById('admin-btn-float'); // Botão da engrenagem

        if (user) {
            // ===================================
            // --- CENÁRIO: USUÁRIO LOGADO ✅ ---
            // ===================================
            console.log("Status: Logado como", user.email);
            usuarioAtual = user;

            // 1. Carrega os dados do jogador (Sequência)
            carregarSequenciaDoBanco(user.uid);

            // 2. VERIFICAÇÃO DE ADMIN (Passo 4)
            // Se a função existir e o e-mail for o seu, mostra a engrenagem
            if (typeof verificarAdmin === "function") {
                verificarAdmin(user);
            }

            // 3. Fecha modal de login se estiver aberto
            if (loginOverlay) loginOverlay.style.display = 'none';

            // 4. Atualiza o nome no menu (Pega do Google ou do Email)
            let nomeDisplay = user.displayName ? user.displayName : user.email.split('@')[0];
            if (userNameDisplay) userNameDisplay.textContent = "OLÁ, " + nomeDisplay.toUpperCase();

            // 5. Transforma o botão "Fazer Login" em "Perfil 👤"
            if (btn) {
                btn.innerHTML = "👤"; // Ícone
                btn.classList.remove("login-btn-header"); // Remove estilo antigo
                btn.classList.add("profile-btn"); // Adiciona estilo redondo
                
                // Estilo visual
                btn.style.backgroundColor = "#eee"; 
                btn.style.color = "#1a1010";
                
                // Define o clique para abrir o menu suspenso
                btn.onclick = function(e) {
                    e.stopPropagation(); // Evita bugs de clique
                    window.toggleUserMenu();
                };
            }

        } else {
            // ===================================
            // --- CENÁRIO: USUÁRIO DESLOGADO ❌ ---
            // ===================================
            console.log("Status: Deslogado");
            usuarioAtual = null;
            sequenciaAtualLocal = 0;

            // 1. Esconde menu de usuário e botão admin
            document.getElementById('user-menu').style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';

            // 2. Restaura o botão para "FAZER LOGIN" (Vermelho)
            if (btn) {
                btn.textContent = "FAZER LOGIN";
                btn.classList.remove("profile-btn");
                btn.classList.add("login-btn-header");
                
                // Restaura cores originais
                btn.style.backgroundColor = "#ff3b3b";
                btn.style.color = "black";
                
                // Define o clique para abrir o modal de login
                btn.onclick = () => {
                    showLogin();
                    if (loginOverlay) loginOverlay.style.display = 'flex';
                };
            }
        }
    });
}

// Inicia o processo
iniciarMonitoramentoAuth();

// Função Global para Abrir/Fechar o Menu
window.toggleUserMenu = function() {
    const menu = document.getElementById('user-menu');
    
    // Lógica simples de alternar
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}


// ==========================================
// --- LOGIN SOCIAL (GOOGLE) ---
// ==========================================

async function fazerLoginSocial() {
    // Define direto o Google como provedor
    const provider = new window.GoogleAuthProvider();

    try {
        console.log("Iniciando login com Google...");
        
        // Abre o Pop-up
        const result = await window.signInWithPopup(window.auth, provider);
        const user = result.user;
        
        console.log("Login Social OK:", user.displayName);

        // --- VERIFICA SE O USUÁRIO JÁ EXISTE NO BANCO ---
        const userRef = window.doc(window.db, "jogadores", user.uid);
        
        // Atualiza nome/email (ou cria se não existir)
        await window.setDoc(userRef, {
            nome: user.displayName ? user.displayName.toUpperCase() : "JOGADOR GOOGLE",
            email: user.email,
        }, { merge: true });

        // Se for usuário novo, zera os stats
        const isNewUser = result._tokenResponse && result._tokenResponse.isNewUser;
        if (isNewUser) {
            await window.setDoc(userRef, {
                vitorias: 0,
                tentativas: 0,
                sequenciaAtual: 0,
                jogos: 0
            }, { merge: true });
        }

        // Fecha o modal e carrega dados
        document.getElementById('login-overlay').style.display = 'none';
        carregarSequenciaDoBanco(user.uid);

    } catch (error) {
        console.error(error);
        if (error.code === 'auth/popup-closed-by-user') {
            alert("Login cancelado.");
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            alert("Já existe uma conta com esse e-mail.");
        } else {
            alert("Erro no login Google: " + error.message);
        }
    }
}

// ==========================================
// --- ÁREA DO DESENVOLVEDOR (ADMIN) ---
// ==========================================

// COLOQUE AQUI O SEU E-MAIL DE LOGIN
const ADMIN_EMAIL = "taagnyaugusto3214@gmail.com";

function verificarAdmin(user) {
    const adminBtn = document.getElementById('admin-btn-float');
    
    // Se o usuário logado tiver o e-mail do chefe
    if (user && user.email === ADMIN_EMAIL) {
        adminBtn.style.display = 'block'; // Mostra a engrenagem
        
        // Configura o clique
        adminBtn.onclick = () => {
            document.getElementById('admin-overlay').style.display = 'flex';
            carregarStatsAdmin();
        };
    } else {
        adminBtn.style.display = 'none'; // Esconde de meros mortais
    }
}

// Fecha o painel
const closeAdmin = document.getElementById('close-admin');
if(closeAdmin) closeAdmin.onclick = () => document.getElementById('admin-overlay').style.display = 'none';


// --- FUNÇÃO 1: ADICIONAR PALAVRA NOVA ---
async function adicionarPalavraAoBanco() {
    const input = document.getElementById('new-word-input');
    const palavra = input.value.toUpperCase().trim();

    if (palavra.length !== 5) {
        alert("A palavra precisa ter exatamente 5 letras!");
        return;
    }

    try {
        // Salva na coleção 'dicionario'
        // Usamos a própria palavra como ID para evitar duplicatas
        await window.setDoc(window.doc(window.db, "dicionario", palavra), {
            palavra: palavra,
            adicionadoEm: new Date(),
            autor: "Admin"
        });

        alert(`Palavra "${palavra}" adicionada ao jogo!`);
        input.value = ""; // Limpa campo
        
        // (Opcional) Adiciona ela na lista local imediatamente para testar
        validWords.push(palavra); 

    } catch (error) {
        console.error(error);
        alert("Erro ao salvar palavra.");
    }
}

// --- FUNÇÃO 2: VER QUANTOS JOGADORES TÊM ---
async function carregarStatsAdmin() {
    const display = document.getElementById('total-users-count');
    display.textContent = "Contando...";
    
    try {
        // Conta documentos na coleção 'jogadores'
        const snapshot = await window.getDocs(window.collection(window.db, "jogadores"));
        display.textContent = snapshot.size; // Mostra o número total
    } catch (e) {
        display.textContent = "Erro";
    }
}

// --- FUNÇÃO 4: BUSCAR JOGADOR PARA BANIR ---
window.buscarJogadorParaBanir = async function() {
    console.log("Botão de buscar clicado!"); // Isso vai aparecer no F12
    
    const input = document.getElementById('ban-search-input');
    const lista = document.getElementById('ban-list-container');
    
    // Verificação de segurança: Os elementos existem?
    if (!input || !lista) {
        console.error("Erro: Não achei o input ou a lista no HTML.");
        alert("Erro interno: Elementos HTML não encontrados.");
        return;
    }

    const termo = input.value.toUpperCase().trim();
    console.log("Termo pesquisado:", termo);

    if (termo.length < 3) {
        lista.innerHTML = '<p style="color:orange; text-align:center; padding:10px;">Digite pelo menos 3 letras.</p>';
        return;
    }

    lista.innerHTML = '<p style="color:white; text-align:center; padding:10px;">Buscando no banco de dados...</p>';

    try {
        // Busca todos os jogadores
        const q = window.query(window.collection(window.db, "jogadores"));
        const snapshot = await window.getDocs(q);
        
        lista.innerHTML = ''; // Limpa a lista
        let encontrou = false;

        snapshot.forEach((doc) => {
            const data = doc.data();
            // Verifica se o nome existe e contém o termo pesquisado
            if (data.nome && data.nome.includes(termo)) {
                encontrou = true;
                
                // Cria o visual do item
                const div = document.createElement('div');
                div.className = 'ban-item';
                // Adicionamos estilo inline para garantir que apareça bonito
                div.style.cssText = "display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #333; color: white;";
                
                div.innerHTML = `
                    <span>${data.nome} <br><small style="color:#888">${data.email}</small></span>
                    <button onclick="confirmarBanimento('${doc.id}', '${data.nome}')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">BANIR 🗑️</button>
                `;
                lista.appendChild(div);
            }
        });

        if (!encontrou) {
            lista.innerHTML = '<p style="color:#aaa; text-align:center; padding:10px;">Ninguém encontrado com esse nome.</p>';
        }

    } catch (e) {
        console.error("Erro na busca:", e);
        lista.innerHTML = `<p style="color:red; text-align:center;">Erro: ${e.message}</p>`;
    }
}

// --- FUNÇÃO 5: EXECUTAR O BANIMENTO ---
window.confirmarBanimento = async function(uid, nome) {
    if (confirm(`TEM CERTEZA que deseja banir "${nome}"? Isso não pode ser desfeito.`)) {
        try {
            await window.deleteDoc(window.doc(window.db, "jogadores", uid));
            alert(`Jogador ${nome} banido!`);
            window.buscarJogadorParaBanir(); // Atualiza a lista
        } catch (error) {
            console.error(error);
            alert("Erro ao banir (verifique se deleteDoc está importado no HTML): " + error.message);
        }
    }
}

// --- FUNÇÃO 5: EXECUTAR O BANIMENTO ---
window.confirmarBanimento = async function(uid, nome) {
    if (confirm(`TEM CERTEZA que deseja banir o jogador "${nome}"? Isso apagará todos os pontos e rank dele.`)) {
        try {
            // Deleta o documento do jogador
            await window.deleteDoc(window.doc(window.db, "jogadores", uid));
            
            alert(`Jogador ${nome} foi banido com sucesso!`);
            
            // Atualiza a lista para sumir com ele
            buscarJogadorParaBanir();
            
        } catch (error) {
            console.error(error);
            alert("Erro ao banir: " + error.message);
        }
    }
}

// ==========================================
// --- SISTEMA DE DOAÇÃO (LIVEPIX) ---
// ==========================================

// 1. CARREGAR MURAL (Público)
async function carregarMuralDoadores() {
    const lista = document.getElementById('donors-list');
    
    try {
        const q = window.query(window.collection(window.db, "doacoes"), window.orderBy("data", "desc"), window.limit(50));
        const snapshot = await window.getDocs(q);

        if (snapshot.empty) {
            lista.innerHTML = '<p class="donate-loading">Seja o primeiro a apoiar! 💚</p>';
            return;
        }

        lista.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Cria o elemento SEM estilos inline, usando apenas classes
            const div = document.createElement('div');
            div.className = 'donor-item'; // <--- Usa a classe do CSS novo
            
            div.innerHTML = `
                <span>${data.nome}</span>
                <span class="donor-badge">R$ ${data.valor}</span>
            `;
            lista.appendChild(div);
        });

    } catch (e) {
        console.error(e);
        lista.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar.</p>';
    }
}

// 2. ADICIONAR DOADOR (Apenas Admin)
window.adicionarDoadorManual = async function() {
    const nome = document.getElementById('donor-name').value;
    const valor = document.getElementById('donor-value').value;

    if (!nome || !valor) { alert("Preencha nome e valor!"); return; }

    try {
        await window.addDoc(window.collection(window.db, "doacoes"), {
            nome: nome,
            valor: valor,
            data: new Date() // Salva a data para ordenar
        });
        
        alert(`Doador ${nome} adicionado ao mural!`);
        document.getElementById('donor-name').value = '';
        document.getElementById('donor-value').value = '';
        
        // Atualiza a lista se estiver aberta
        carregarMuralDoadores();

    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    }
}

// --- FUNÇÃO 6: LISTAR DOAÇÕES NO ADMIN ---
window.carregarDoacoesAdmin = async function() {
    const lista = document.getElementById('admin-donations-list');
    lista.innerHTML = '<p style="color:white; text-align:center;">Carregando...</p>';

    try {
        // Busca as últimas 20 doações
        const q = window.query(window.collection(window.db, "doacoes"), window.orderBy("data", "desc"), window.limit(20));
        const snapshot = await window.getDocs(q);

        if (snapshot.empty) {
            lista.innerHTML = '<p style="color:#666; text-align:center;">Nenhuma doação encontrada.</p>';
            return;
        }

        lista.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            
            const div = document.createElement('div');
            div.className = 'admin-donation-item';
            div.innerHTML = `
                <div>
                    <span style="color: #fff; font-weight: bold;">${data.nome}</span>
                    <span style="color: #00ff00;">R$ ${data.valor}</span>
                </div>
                <button class="btn-del-don" onclick="excluirDoacao('${doc.id}', '${data.nome}', '${data.valor}')">X</button>
            `;
            lista.appendChild(div);
        });

    } catch (e) {
        console.error(e);
        lista.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar lista.</p>';
    }
}

// --- FUNÇÃO 7: EXCLUIR DOAÇÃO ---
window.excluirDoacao = async function(id, nome, valor) {
    if (confirm(`Tem certeza que deseja apagar a doação de ${nome} (R$ ${valor})?`)) {
        try {
            // Deleta do banco
            await window.deleteDoc(window.doc(window.db, "doacoes", id));
            
            alert("Doação removida!");
            
            // Atualiza a lista do admin
            carregarDoacoesAdmin();
            
            // Atualiza o mural público (caso esteja aberto atrás)
            carregarMuralDoadores();
            
        } catch (e) {
            alert("Erro ao excluir: " + e.message);
        }
    }
}

// --- FUNÇÃO 8: ZERAR SEQUÊNCIAS (TEMPORADA) ---
window.zerarTodasSequencias = async function() {
    // 1. Confirmação Dupla de Segurança
    if (!confirm("ATENÇÃO: Isso vai zerar o foguinho 🔥 de TODOS os jogadores do site.\n\nDeseja continuar?")) return;
    
    const confirmacao = prompt("Para confirmar, digite a senha!");
    if (confirmacao !== "Casper360") {
        alert("Cancelado. Nada foi alterado.");
        return;
    }

    // Muda texto do botão para avisar que está trabalhando
    const btn = event.target;
    const textoOriginal = btn.textContent;
    btn.textContent = "PROCESSANDO... (ISSO PODE DEMORAR)";
    btn.disabled = true;

    try {
        console.log("Iniciando reset global...");

        // 2. Busca APENAS jogadores que têm sequência maior que 0
        // (Isso economiza recursos do Firebase e é mais rápido)
        const q = window.query(
            window.collection(window.db, "jogadores"), 
            window.where("sequenciaAtual", ">", 0)
        );

        const snapshot = await window.getDocs(q);

        if (snapshot.empty) {
            alert("Ninguém tem sequência ativa para zerar.");
            btn.textContent = textoOriginal;
            btn.disabled = false;
            return;
        }

        // 3. Atualiza todos eles
        let contador = 0;
        const promises = []; // Array para guardar as tarefas

        snapshot.forEach((doc) => {
            // Adiciona a tarefa de atualização na fila
            const tarefa = window.updateDoc(doc.ref, { 
                sequenciaAtual: 0 
            });
            promises.push(tarefa);
            contador++;
        });

        // Espera todas as atualizações terminarem
        await Promise.all(promises);

        alert(`SUCESSO! A sequência de ${contador} jogadores foi zerada.`);
        console.log("Reset concluído.");

    } catch (e) {
        console.error(e);
        alert("Erro ao zerar: " + e.message);
    } finally {
        // Restaura o botão
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

// ==========================================
// --- FUNÇÃO DE COMPARTILHAR (EMOJIS) ---
// ==========================================

async function copiarResultado() {
    const btn = document.getElementById('share-btn');
    
    // 1. Monta o Cabeçalho
    // Se ganhou, mostra quantas tentativas. Se perdeu, mostra "X/6".
    // Nota: currentRow começa em 0, então somamos 1.
    // Se perdeu (currentRow > 5), mostramos X.
    let tentativas = currentRow + 1;
    if (tentativas > 6 && !isGameOver) tentativas = 6; // Ajuste fino
    if (!wordle || (currentRow >= 5 && document.querySelector('.green-overlay') === null)) tentativas = "X";
    // Se ganhou, ajusta o número exato
    if (isGameOver) {
         // Procura em qual linha ganhou
         const linhas = document.querySelectorAll('.tile-row');
         linhas.forEach((row, index) => {
             const tiles = row.children;
             let tudoVerde = true;
             for(let t of tiles) {
                 if(!t.classList.contains('green-overlay')) tudoVerde = false;
             }
             if(tudoVerde) tentativas = index + 1;
         });
    }

    let textoCompartilhar = `NEXTAGE 🧛 ${tentativas}/6\n\n`;

    // 2. Monta o Grid de Emojis
    // Vamos varrer todas as linhas do tabuleiro
    for (let i = 0; i < 6; i++) {
        const row = document.getElementById(`row-${i}`);
        const tiles = row.children;
        let linhaEmojis = "";
        let temCor = false;

        for (let tile of tiles) {
            if (tile.classList.contains('green-overlay')) {
                linhaEmojis += "🟩";
                temCor = true;
            } else if (tile.classList.contains('yellow-overlay')) {
                linhaEmojis += "🟨";
                temCor = true;
            } else if (tile.classList.contains('grey-overlay')) {
                linhaEmojis += "⬛";
                temCor = true;
            }
        }
        
        // Só adiciona a linha no texto se ela tiver sido jogada
        if (temCor) {
            textoCompartilhar += linhaEmojis + "\n";
        }
    }

    // 3. Adiciona o Link do site e Sequência
    textoCompartilhar += `\n🔥 Sequência: ${sequenciaAtualLocal}`;
    textoCompartilhar += `\nJogue agora: ${window.location.href}`;

    // 4. Copia para a Área de Transferência
    try {
        if (navigator.share) {
            // Tenta usar o compartilhamento nativo do celular (abre o menu do Android/iPhone)
            await navigator.share({
                title: 'Nextage Game',
                text: textoCompartilhar
            });
        } else {
            // Se for no PC, copia para o Ctrl+V
            await navigator.clipboard.writeText(textoCompartilhar);
            
            // Feedback Visual no Botão
            const textoOriginal = btn.textContent;
            btn.textContent = "COPIADO! ✅";
            btn.style.backgroundColor = "#538d4e";
            
            setTimeout(() => {
                btn.textContent = textoOriginal;
                btn.style.backgroundColor = "#538d4e"; // Mantém verde ou volta pro original
            }, 2000);
        }
    } catch (err) {
        console.error('Erro ao compartilhar:', err);
        // Fallback simples
        alert("Erro ao copiar automaticamente. Tire um print!");
    }

}

