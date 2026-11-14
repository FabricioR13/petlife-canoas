// ─────────────────────────────────────────────────────────────────────────────
// PET LIFE CANOAS — DADOS DA LOJA + ARMAZENAMENTO
// ─────────────────────────────────────────────────────────────────────────────
// Compartilhado pela loja (index.html) e pelo painel (admin.html).
//   1) DADOS INICIAIS: produtos, categorias, serviços de banho e tosa, agenda;
//   2) ARMAZENAMENTO (PetDB): nesta demonstração tudo fica salvo no navegador
//      (localStorage). Para colocar no ar com vários aparelhos sincronizados,
//      basta trocar carregar()/salvar() por um banco online (ex.: Firebase).
// ─────────────────────────────────────────────────────────────────────────────

const PL_STORAGE_KEY = "petlife_canoas_v1";
const PL_VERSAO_DADOS = 1;
const TF_SOLUTIONS_WHATSAPP = "5551982165186";

// ─── CONFIGURAÇÕES ───────────────────────────────────────────────────────────
const PL_CONFIG_PADRAO = {
    nomeLoja: "Pet Life",
    subtitulo: "Agropecuária e Pet Shop",
    whatsapp: "5551998795110",
    telefoneExibicao: "(51) 99879-5110",
    instagram: "petlifecanoas",
    horarioTexto: "Seg a Sáb · 8h às 19h",
    avisoTopo: "Tele-entrega GRÁTIS em compras acima de R$ 100",
    lojas: [
        { id: "boqueirao", nome: "Loja Boqueirão", endereco: "Av. Boqueirão, 3221 – Estância Velha, Canoas/RS" },
        { id: "nazario", nome: "Loja Nazário", endereco: "Av. do Nazário, 1361 – Olaria, Canoas/RS" },
    ],
    // Tele-entrega
    freteGratisAcima: 100,
    taxaEntrega: 8,
    formasPagamento: ["PIX", "Cartão de débito", "Cartão de crédito", "Dinheiro"],
    // Agenda de banho e tosa
    agenda: {
        diasSemana: [1, 2, 3, 4, 5, 6], // 0 = domingo
        inicio: "08:00",
        fim: "17:00",          // último horário que começa
        intervaloMin: 60,
        vagasPorHorario: 2,    // quantos pets ao mesmo tempo, por loja
        diasAntecedencia: 21,  // até quantos dias à frente o cliente pode marcar
        lojasComBanho: ["boqueirao", "nazario"],
        diasFechados: [],      // ["2026-12-25", ...]
    },
    senhaPainel: "petlife123",
};

// ─── CATEGORIAS ──────────────────────────────────────────────────────────────
const PL_CATEGORIAS_PADRAO = [
    { id: "caes", nome: "Cães", icone: "fa-dog", cor: "#2AA3AD" },
    { id: "gatos", nome: "Gatos", icone: "fa-cat", cor: "#B9505A" },
    { id: "saude", nome: "Antipulgas e Saúde", icone: "fa-shield-dog", cor: "#3C8D5A" },
    { id: "higiene", nome: "Areias e Higiene", icone: "fa-pump-soap", cor: "#5B7FC7" },
    { id: "acessorios", nome: "Guias e Caminhas", icone: "fa-bone", cor: "#E08A2E" },
    { id: "agro", nome: "Agro e Aves", icone: "fa-wheat-awn", cor: "#8A6D3B" },
];

// ─── PRODUTOS ────────────────────────────────────────────────────────────────
// preco / precoAntigo ("de", riscado) · estoque / estoqueMin (alerta no painel)
// variacoes: [{ nome, preco, estoque }] → quando o produto tem tamanhos/pesos
// selo: texto do selo no card (ex.: "Black Friday")
const IMG = (n) => `assets/produtos/${n}.webp`;
const PL_PRODUTOS_PADRAO = [
    { id: 1, nome: "Ração Primus All Day Cães Adultos", unidade: "15 kg", categoria: "caes", preco: 123.90, precoAntigo: 139.90, estoque: 14, estoqueMin: 4, imagem: IMG("primus"), destaque: true, selo: "Black Friday", descricao: "Premium especial sabor carne e frango para cães adultos. Oferta válida na Esquenta Black Friday." },
    { id: 2, nome: "Ração Birbo Tradicional Cães Adultos", unidade: "15 kg", categoria: "caes", preco: 99.90, precoAntigo: 114.90, estoque: 18, estoqueMin: 5, imagem: IMG("birbo"), destaque: true, selo: "Black Friday", descricao: "Ração completa para cães adultos, sabor carne e frango." },
    { id: 3, nome: "Ração Bolly Todo Dia Cães Adultos", unidade: "carne", categoria: "caes", preco: 116.90, estoque: 0, estoqueMin: 4, imagem: IMG("bolly-todo-dia"), selo: "Novidade",
      variacoes: [{ nome: "20 kg", preco: 116.90, estoque: 8 }, { nome: "10 kg", preco: 65.90, estoque: 11 }],
      descricao: "Novidade na Pet Life! Alimento completo para o dia a dia do seu cão." },
    { id: 4, nome: "Ração Bolly Premium Cães Adultos", unidade: "20 kg", categoria: "caes", preco: 129.90, estoque: 9, estoqueMin: 3, imagem: IMG("bolly-premium"), selo: "Novidade", descricao: "Premium sabor carne e cereais, para cães adultos de todas as raças." },
    { id: 5, nome: "Ração Bolly Sênior", unidade: "cães idosos", categoria: "caes", preco: 89.90, estoque: 6, estoqueMin: 3, imagem: IMG("bolly-senior"), descricao: "Fórmula para cães sênior, sabor frango e beterraba." },
    { id: 6, nome: "Ração Primocão Raças Pequenas", unidade: "raças pequenas", categoria: "caes", preco: 89.90, estoque: 10, estoqueMin: 3, imagem: IMG("primocao"), destaque: true, descricao: "Croquetes menores, ideais para raças pequenas." },
    { id: 7, nome: "Ração Mandala Cães Adultos", unidade: "20 kg", categoria: "caes", preco: 129.90, precoAntigo: 149.90, estoque: 7, estoqueMin: 3, imagem: IMG("mandala"), selo: "Promoção", descricao: "Promoção Mandala 20 kg. Válido até 17/12." },
    { id: 8, nome: "Ração Three Cats Gatos Castrados", unidade: "10,1 kg", categoria: "gatos", preco: 149.90, precoAntigo: 169.90, estoque: 3, estoqueMin: 3, imagem: IMG("threecats"), destaque: true, selo: "Black Friday", descricao: "Super premium para gatos castrados, controle de peso e saúde urinária." },
    { id: 9, nome: "Ração The Best Gatos Castrados", unidade: "10,1 kg", categoria: "gatos", preco: 99.90, estoque: 8, estoqueMin: 3, imagem: IMG("the-best"), descricao: "Especial para gatos adultos castrados." },
    { id: 10, nome: "Ração Fámil Gatos Adultos", unidade: "10 kg", categoria: "gatos", preco: 99.90, estoque: 6, estoqueMin: 3, imagem: IMG("combo-famil-birbo"), descricao: "Ração para gatos adultos. Tele-entrega grátis acima de R$ 100." },
    { id: 11, nome: "Ração Monello Go Gatos Adultos", unidade: "10 kg", categoria: "gatos", preco: 129.90, estoque: 4, estoqueMin: 3, imagem: IMG("monello"), selo: "Oferta", descricao: "Oferta especial! Premium para gatos adultos." },
    { id: 12, nome: "Caixa de Sachê Whiskas (fechada)", unidade: "20 unidades", categoria: "gatos", preco: 49.90, precoAntigo: 59.90, estoque: 12, estoqueMin: 4, imagem: IMG("whiskas-caixa"), destaque: true, selo: "Black Friday", descricao: "Caixa fechada de sachês Whiskas. Últimas unidades!" },
    { id: 13, nome: "Sachês Cães e Gatos — leve 4", unidade: "4 unidades", categoria: "gatos", preco: 10.00, estoque: 60, estoqueMin: 12, imagem: IMG("saches"), selo: "Black Friday", descricao: "Kitekat ou Champ: 4 sachês por R$ 10,00. Escolha os sabores na conversa." },
    { id: 14, nome: "Antipulgas Defenza (Fluralaner)", unidade: "pulgas, carrapatos e sarnas", categoria: "saude", preco: 55.90, estoque: 0, estoqueMin: 3, imagem: IMG("defenza"), destaque: true, selo: "Promoção",
      variacoes: [
          { nome: "2 a 4,5 kg", preco: 55.90, estoque: 6 }, { nome: "4,5 a 10 kg", preco: 59.90, estoque: 8 },
          { nome: "10 a 20 kg", preco: 76.90, estoque: 5 }, { nome: "20 a 40 kg", preco: 84.90, estoque: 2 },
          { nome: "40 a 56 kg", preco: 93.90, estoque: 3 }],
      descricao: "Proteção de 37 dias contra pulgas, carrapatos, sarnas e bicho-de-pé. Escolha pelo peso do seu cão." },
    { id: 15, nome: "Coleira Antipulgas Seresto", unidade: "cães e gatos", categoria: "saude", preco: 219.90, estoque: 6, estoqueMin: 2, imagem: IMG("seresto"), descricao: "Proteção prolongada contra pulgas e carrapatos. Consulte o tamanho ideal." },
    { id: 16, nome: "Beneflora Vet — Probiótico e Prebiótico", unidade: "cães e gatos", categoria: "saude", preco: 49.90, estoque: 7, estoqueMin: 2, imagem: IMG("beneflora"), selo: "Novidade", descricao: "Suplemento alimentar com probiótico e prebiótico para cães e gatos." },
    { id: 17, nome: "Macrogard Pet — Suplemento Alimentar", unidade: "comprimido ou pasta", categoria: "saude", preco: 69.90, estoque: 5, estoqueMin: 2, imagem: IMG("macrogard"), selo: "Novidade", descricao: "Suplemento com betaglucanas, disponível em comprimido ou pasta." },
    { id: 18, nome: "Granulado de Madeira Wood Cat", unidade: "15 kg", categoria: "higiene", preco: 29.90, precoAntigo: 36.90, estoque: 20, estoqueMin: 5, imagem: IMG("woodcat"), selo: "Black Friday", descricao: "Granulado higiênico natural, alto rendimento." },
    { id: 19, nome: "Areia Bob Esconde Biodegradável", unidade: "2 kg", categoria: "higiene", preco: 37.90, estoque: 9, estoqueMin: 3, imagem: IMG("areia-bob"), descricao: "Areia biodegradável para gatos." },
    { id: 20, nome: "Areia Huspet Bio Biodegradável", unidade: "gatos", categoria: "higiene", preco: 29.90, estoque: 0, estoqueMin: 3, imagem: IMG("areia-huspet"),
      variacoes: [{ nome: "2 kg", preco: 29.90, estoque: 7 }, { nome: "4 kg", preco: 56.90, estoque: 2 }],
      descricao: "Areia vegetal biodegradável, ótimo controle de odor." },
    { id: 21, nome: "Fonte de Água para Gatos", unidade: "rosa ou azul", categoria: "acessorios", preco: 129.90, estoque: 4, estoqueMin: 2, imagem: IMG("fonte"), destaque: true, descricao: "Água sempre fresca e corrente, estimula o gato a beber mais." },
    { id: 22, nome: "Guia de Nylon com Peitoral", unidade: "consulte as medidas", categoria: "acessorios", preco: 25.90, estoque: 0, estoqueMin: 2, imagem: IMG("guia-nylon"),
      variacoes: [
          { nome: "Nº 00", preco: 25.90, estoque: 4 }, { nome: "Nº 0", preco: 27.90, estoque: 4 }, { nome: "Nº 1", preco: 28.90, estoque: 5 },
          { nome: "Nº 2", preco: 31.90, estoque: 3 }, { nome: "Nº 3", preco: 33.90, estoque: 3 }, { nome: "Nº 4", preco: 36.90, estoque: 2 }, { nome: "Nº 5", preco: 37.90, estoque: 1 }],
      descricao: "Guia com peitoral em nylon. Consulte as medidas para escolher o número." },
    { id: 23, nome: "Guia de Nylon com EVA Reforçada", unidade: "consulte as medidas", categoria: "acessorios", preco: 44.90, estoque: 0, estoqueMin: 2, imagem: IMG("guia-eva"),
      variacoes: [
          { nome: "Nº 2", preco: 44.90, estoque: 3 }, { nome: "Nº 3", preco: 57.90, estoque: 3 }, { nome: "Nº 4", preco: 81.90, estoque: 2 },
          { nome: "Nº 5", preco: 88.90, estoque: 2 }, { nome: "Nº 6", preco: 99.90, estoque: 1 }, { nome: "Nº 7", preco: 109.90, estoque: 1 }],
      descricao: "Peitoral acolchoado com EVA, mais conforto e segurança para cães grandes." },
    { id: 24, nome: "Guia para Gatos", unidade: "estampada", categoria: "acessorios", preco: 29.90, estoque: 0, estoqueMin: 2, imagem: IMG("guia-gatos"),
      variacoes: [{ nome: "Nº 00", preco: 29.90, estoque: 3 }, { nome: "Nº 0", preco: 30.90, estoque: 3 }, { nome: "Nº 1", preco: 32.90, estoque: 2 }],
      descricao: "Guia com peitoral para gatos, várias estampas." },
    { id: 25, nome: "Caminha Gaby 2", unidade: "várias estampas", categoria: "acessorios", preco: 197.00, estoque: 3, estoqueMin: 1, imagem: IMG("caminha-gaby"), descricao: "Caminha acolchoada com bordas altas, várias cores e estampas." },
    { id: 26, nome: "Caminha Conforto", unidade: "várias estampas", categoria: "acessorios", preco: 89.90, estoque: 5, estoqueMin: 2, imagem: IMG("caminha-conforto"), descricao: "Caminha macia e lavável para cães e gatos." },
    { id: 27, nome: "Milho em Grão", unidade: "25 kg", categoria: "agro", preco: 69.90, estoque: 12, estoqueMin: 4, descricao: "Saca de milho inteiro para aves e criação." },
    { id: 28, nome: "Ração Galinha Poedeira", unidade: "20 kg", categoria: "agro", preco: 94.90, estoque: 6, estoqueMin: 2, descricao: "Mais postura e casca de ovo mais resistente." },
    { id: 29, nome: "Alpiste Tratado", unidade: "1 kg", categoria: "agro", preco: 11.50, estoque: 25, estoqueMin: 6, descricao: "Grãos limpos e selecionados para pássaros." },
    { id: 30, nome: "Mistura para Calopsita e Periquito", unidade: "500 g", categoria: "agro", preco: 12.90, estoque: 2, estoqueMin: 5, descricao: "Painço, alpiste, aveia e girassol." },
    { id: 31, nome: "Ração para Coelhos e Roedores", unidade: "1 kg", categoria: "agro", preco: 16.90, estoque: 10, estoqueMin: 3, descricao: "Alimento completo para coelhos, porquinhos-da-índia e hamsters." },
].map((p) => ({ imagem: "", ativo: true, destaque: false, precoAntigo: null, selo: "", variacoes: null, ...p }));

// ─── SERVIÇOS DE BANHO E TOSA ────────────────────────────────────────────────
const PL_PORTES = [
    { id: "P", nome: "Pequeno", dica: "até 10 kg" },
    { id: "M", nome: "Médio", dica: "10 a 25 kg" },
    { id: "G", nome: "Grande", dica: "25 a 40 kg" },
    { id: "GG", nome: "Gigante", dica: "acima de 40 kg" },
];
const PL_SERVICOS_PADRAO = [
    { id: "banho", nome: "Banho", icone: "fa-shower", descricao: "Banho com shampoo neutro, secagem, limpeza de ouvidos e perfume.", precos: { P: 45, M: 55, G: 70, GG: 90 }, ativo: true },
    { id: "banho-higienica", nome: "Banho + Tosa higiênica", icone: "fa-soap", descricao: "Banho completo + tosa das patinhas, barriga e região íntima.", precos: { P: 60, M: 70, G: 90, GG: 110 }, ativo: true },
    { id: "banho-tosa", nome: "Banho + Tosa completa", icone: "fa-scissors", descricao: "Banho completo + tosa na máquina ou tesoura, no estilo que você preferir.", precos: { P: 80, M: 95, G: 120, GG: 150 }, ativo: true },
    { id: "gato", nome: "Banho para gatos", icone: "fa-cat", descricao: "Banho com manejo tranquilo e produtos próprios para felinos.", precos: { P: 60, M: 70, G: 80, GG: 80 }, ativo: true },
];
const PL_ADICIONAIS_PADRAO = [
    { id: "hidratacao", nome: "Hidratação", preco: 20, ativo: true },
    { id: "unhas", nome: "Corte de unhas", preco: 10, ativo: true },
    { id: "dentes", nome: "Escovação de dentes", preco: 12, ativo: true },
    { id: "antipulgas", nome: "Banho antipulgas", preco: 15, ativo: true },
];

// ─── UTILITÁRIOS DE DATA ─────────────────────────────────────────────────────
const plDataISO = (d) => {
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
const plParseData = (iso) => { const [a, m, d] = iso.split("-").map(Number); return new Date(a, m - 1, d); };
const plMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const plHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Lista os horários do dia conforme a configuração da agenda
const plHorariosDoDia = (agenda) => {
    const lista = [];
    for (let m = plMin(agenda.inicio); m <= plMin(agenda.fim); m += Number(agenda.intervaloMin) || 60) lista.push(plHHMM(m));
    return lista;
};

// Preço de um agendamento
const plValorAgendamento = (ag, servicos, adicionais) => {
    const s = servicos.find((x) => x.id === ag.servico);
    let total = s ? Number(s.precos[ag.porte] || 0) : 0;
    (ag.adicionais || []).forEach((id) => { const a = adicionais.find((x) => x.id === id); if (a) total += Number(a.preco); });
    return total;
};

// ─── HISTÓRICO DE EXEMPLO (para o painel não abrir vazio) ───────────────────
const plGerarHistorico = (produtos, config) => {
    let semente = 20261114;
    const rand = () => { semente = (semente * 1103515245 + 12345) % 2147483648; return semente / 2147483648; };
    const escolhe = (arr) => arr[Math.floor(rand() * arr.length)];
    const pets = [
        ["Thor", "Cão", "Shih-tzu", "P"], ["Mel", "Cão", "Poodle", "P"], ["Bob", "Cão", "Golden", "G"], ["Luna", "Cão", "Lhasa Apso", "P"],
        ["Fred", "Cão", "Vira-lata", "M"], ["Nina", "Cão", "Yorkshire", "P"], ["Max", "Cão", "Labrador", "G"], ["Pipoca", "Cão", "Maltês", "P"],
        ["Zeus", "Cão", "Husky", "G"], ["Belinha", "Cão", "Pinscher", "P"], ["Simba", "Gato", "Persa", "P"], ["Toddy", "Cão", "Beagle", "M"],
        ["Amora", "Cão", "Spitz", "P"], ["Rex", "Cão", "Pastor Alemão", "GG"], ["Lola", "Cão", "Border Collie", "M"], ["Chico", "Cão", "Salsicha", "P"],
    ];
    const tutores = ["Ana Paula", "Marcos Silva", "Juliana Rocha", "Fernanda Lima", "Carlos Eduardo", "Patrícia Souza", "Rafael Martins", "Camila Duarte",
        "Bruno Oliveira", "Larissa Costa", "Diego Ramos", "Vanessa Prado", "Tiago Moraes", "Aline Teixeira", "Rodrigo Nunes", "Gabriela Alves"];
    const servPeso = ["banho", "banho", "banho-higienica", "banho-higienica", "banho-tosa", "banho-tosa", "gato"];
    const horarios = plHorariosDoDia(config.agenda);
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const agendamentos = [];
    let id = 1;
    for (let dd = -35; dd <= 9; dd++) {
        const dia = new Date(hoje); dia.setDate(hoje.getDate() + dd);
        if (!config.agenda.diasSemana.includes(dia.getDay())) continue;
        const sabado = dia.getDay() === 6;
        const qtd = (dd > 0 ? 1 : 3) + Math.floor(rand() * (sabado ? 7 : 4)) - (dd > 4 ? 1 : 0);
        const usados = {};
        const petsDia = new Set();
        for (let i = 0; i < qtd; i++) {
            const loja = rand() < 0.6 ? "boqueirao" : "nazario";
            const hora = escolhe(horarios);
            const k = loja + hora;
            if ((usados[k] || 0) >= config.agenda.vagasPorHorario) continue;
            usados[k] = (usados[k] || 0) + 1;
            const pi = Math.floor(rand() * pets.length);
            if (petsDia.has(pi)) continue;
            petsDia.add(pi);
            const [nomePet, especie, raca, porte] = pets[pi];
            let servico = escolhe(servPeso);
            if (especie === "Gato") servico = "gato"; else if (servico === "gato") servico = "banho";
            const adicionais = [];
            if (rand() < 0.35) adicionais.push("unhas");
            if (rand() < 0.2) adicionais.push("hidratacao");
            let status = "confirmado";
            if (dd < 0) status = rand() < 0.08 ? "faltou" : "concluido";
            else if (dd === 0) status = escolhe(["confirmado", "confirmado", "concluido", "pendente"]);
            else status = rand() < 0.35 ? "pendente" : "confirmado";
            agendamentos.push({
                id: id++, data: plDataISO(dia), hora, loja, nomePet, especie, raca, porte, servico, adicionais,
                tutor: tutores[pi], telefone: `(51) 9${8000 + Math.floor(rand() * 1999)}-${1000 + Math.floor(rand() * 8999)}`,
                observacoes: rand() < 0.2 ? escolhe(["Tem medo do secador", "Pele sensível, usar shampoo hipoalergênico", "Deixar a franja", "Primeira vez no pet shop"]) : "",
                origem: rand() < 0.55 ? "site" : "balcao", status, criadoEm: new Date(dia.getTime() - 2 * 86400000).toISOString(),
            });
        }
    }
    // Pedidos enviados pelo site (registro de quem finalizou no WhatsApp)
    const pedidos = [];
    const ativos = produtos.filter((p) => p.ativo);
    for (let dd = -30; dd <= 0; dd++) {
        const dia = new Date(hoje); dia.setDate(hoje.getDate() + dd);
        if (dia.getDay() === 0) continue;
        const qtd = 1 + Math.floor(rand() * 5) + (dd > -14 ? 1 : 0);
        for (let i = 0; i < qtd; i++) {
            const itens = [];
            const n = 1 + Math.floor(rand() * 3);
            for (let j = 0; j < n; j++) {
                const p = escolhe(ativos);
                const v = p.variacoes ? escolhe(p.variacoes) : null;
                itens.push({ id: p.id, nome: p.nome + (v ? ` (${v.nome})` : ""), qtd: 1 + Math.floor(rand() * 2), preco: v ? v.preco : p.preco });
            }
            const subtotal = itens.reduce((a, it) => a + it.qtd * it.preco, 0);
            const d = new Date(dia); d.setHours(8 + Math.floor(rand() * 11), Math.floor(rand() * 60));
            const entrega = rand() < 0.6;
            const taxa = entrega && subtotal < config.freteGratisAcima ? config.taxaEntrega : 0;
            pedidos.push({ codigo: "PL" + Math.floor(100000 + rand() * 899999), data: d.toISOString(), cliente: escolhe(tutores), itens, subtotal, taxa, total: subtotal + taxa, entrega: entrega ? "Tele-entrega" : "Retirada" });
        }
    }
    return { agendamentos, pedidos };
};

const plDadosIniciais = () => {
    const config = JSON.parse(JSON.stringify(PL_CONFIG_PADRAO));
    const produtos = PL_PRODUTOS_PADRAO.map((p) => JSON.parse(JSON.stringify(p)));
    const { agendamentos, pedidos } = plGerarHistorico(produtos, config);
    return {
        versao: PL_VERSAO_DADOS, config,
        categorias: PL_CATEGORIAS_PADRAO.map((c) => ({ ...c })),
        produtos,
        servicos: JSON.parse(JSON.stringify(PL_SERVICOS_PADRAO)),
        adicionais: PL_ADICIONAIS_PADRAO.map((a) => ({ ...a })),
        agendamentos, pedidos,
    };
};

// ─── ARMAZENAMENTO ───────────────────────────────────────────────────────────
const PetDB = (() => {
    let memoria = null;
    const ler = () => { try { return localStorage.getItem(PL_STORAGE_KEY); } catch (e) { return null; } };
    const gravar = (t) => { try { localStorage.setItem(PL_STORAGE_KEY, t); return true; } catch (e) { return false; } };
    const completar = (d) => {
        d.config = { ...PL_CONFIG_PADRAO, ...(d.config || {}) };
        d.config.agenda = { ...PL_CONFIG_PADRAO.agenda, ...(d.config.agenda || {}) };
        ["categorias", "produtos", "servicos", "adicionais", "agendamentos", "pedidos"].forEach((k) => { d[k] = d[k] || []; });
        return d;
    };
    return {
        carregar() {
            const bruto = ler();
            if (bruto) {
                try { const d = JSON.parse(bruto); if (d && d.versao === PL_VERSAO_DADOS) { memoria = completar(d); return memoria; } } catch (e) { /* recomeça */ }
            }
            if (memoria) return memoria;
            memoria = plDadosIniciais();
            gravar(JSON.stringify(memoria));
            return memoria;
        },
        salvar(d) { memoria = d; return gravar(JSON.stringify(d)); },
        restaurarExemplo() { memoria = plDadosIniciais(); gravar(JSON.stringify(memoria)); return memoria; },
        importar(texto) {
            const d = JSON.parse(texto);
            if (!d || !Array.isArray(d.produtos) || !d.config) throw new Error("Arquivo de backup inválido.");
            d.versao = PL_VERSAO_DADOS; memoria = completar(d); gravar(JSON.stringify(memoria)); return memoria;
        },
        aoMudarEmOutraAba(cb) {
            window.addEventListener("storage", (e) => { if (e.key === PL_STORAGE_KEY) { memoria = null; cb(this.carregar()); } });
        },
    };
})();

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
const plMoeda = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const plEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const plSlug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const plEstoqueTotal = (p) => (p.variacoes && p.variacoes.length ? p.variacoes.reduce((a, v) => a + (Number(v.estoque) || 0), 0) : Number(p.estoque) || 0);
const plPrecoMin = (p) => (p.variacoes && p.variacoes.length ? Math.min(...p.variacoes.map((v) => Number(v.preco))) : Number(p.preco));
const plSoNumeros = (s) => String(s || "").replace(/\D/g, "");
const plLinkWhats = (numero, texto) => `https://wa.me/${plSoNumeros(numero)}?text=${encodeURIComponent(texto)}`;
const PL_STATUS_AG = {
    pendente: { nome: "Aguardando confirmação", curto: "Pendente", cor: "#C98A00", icone: "fa-hourglass-half" },
    confirmado: { nome: "Confirmado", curto: "Confirmado", cor: "#1C7C85", icone: "fa-circle-check" },
    concluido: { nome: "Concluído", curto: "Concluído", cor: "#3C8D5A", icone: "fa-paw" },
    faltou: { nome: "Não compareceu", curto: "Faltou", cor: "#8A8F98", icone: "fa-user-xmark" },
    cancelado: { nome: "Cancelado", curto: "Cancelado", cor: "#B9505A", icone: "fa-ban" },
};
