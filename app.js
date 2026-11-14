// ─────────────────────────────────────────────────────────────────────────────
// PET LIFE CANOAS — LOJA (catálogo, sacolinha e agendamento de banho e tosa)
// ─────────────────────────────────────────────────────────────────────────────
(() => {
    let db = PetDB.carregar();
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const CHAVE_SACOLA = "petlife_sacola_v1";
    const CHAVE_CLIENTE = "petlife_cliente_v1";

    const estado = {
        cat: null, busca: "", ordenar: "destaque",
        sacola: (() => { try { return JSON.parse(localStorage.getItem(CHAVE_SACOLA) || "[]"); } catch (e) { return []; } })(),
        checkout: { tipo: "entrega", loja: "", pagamento: "PIX", troco: "", nome: "", fone: "", rua: "", numero: "", bairro: "", referencia: "" },
        ag: { especie: "Cão", porte: "P", servico: "banho", adicionais: [], loja: "", data: "", hora: "" },
    };
    try { Object.assign(estado.checkout, JSON.parse(localStorage.getItem(CHAVE_CLIENTE) || "{}")); } catch (e) { /* ok */ }

    const cfg = () => db.config;
    const categoria = (id) => db.categorias.find((c) => c.id === id) || { nome: "", icone: "fa-paw", cor: "#2AA3AD" };
    const produtosAtivos = () => db.produtos.filter((p) => p.ativo);
    const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("mostra"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("mostra"), 2400); };
    const abrirWhats = (url) => { const w = window.open(url, "_blank", "noopener"); if (!w) location.href = url; };

    // ─── INFORMAÇÕES DA LOJA ────────────────────────────────────────────────
    const preencherLoja = () => {
        const c = cfg();
        $("#aviso-topo").textContent = c.avisoTopo;
        $("#horario-topo").textContent = c.horarioTexto;
        $("#telefone-topo").textContent = c.telefoneExibicao;
        $("#rod-fone").textContent = c.telefoneExibicao;
        const oi = plLinkWhats(c.whatsapp, "Olá, Pet Life! Vim pelo site e gostaria de uma informação.");
        ["#whats-topo", "#rod-whats", "#whats-flutuante"].forEach((s) => { $(s).href = oi; });
        $("#rod-insta").href = `https://instagram.com/${c.instagram}`;
        $("#credito-tf").href = plLinkWhats(TF_SOLUTIONS_WHATSAPP, "Olá! Vi o site da Pet Life e quero saber mais sobre os sites da TF Solutions.");
        $("#lojas-grid").innerHTML = c.lojas.map((l) => `
            <div class="loja-card">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                <div><strong>${plEsc(l.nome)}</strong><small>${plEsc(l.endereco)}</small><br><small>${plEsc(c.horarioTexto)}</small></div>
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Pet Life " + l.endereco)}" target="_blank" rel="noopener"><i class="fa-solid fa-map"></i> Ver no mapa</a>
            </div>`).join("");
    };

    // ─── CARDS DE PRODUTO ───────────────────────────────────────────────────
    const fotoHTML = (p) => {
        if (p.imagem) return `<span class="fundo-desfocado" style="background-image:url('${plEsc(p.imagem)}')"></span><img src="${plEsc(p.imagem)}" alt="${plEsc(p.nome)}" loading="lazy">`;
        const c = categoria(p.categoria);
        return `<span class="foto-arte" style="--c:${c.cor}"><i class="fa-solid ${c.icone}"></i></span>`;
    };
    const seloHTML = (p) => {
        let h = "";
        if (p.selo) {
            const cls = /black/i.test(p.selo) ? "bf" : /novidade/i.test(p.selo) ? "novidade" : "";
            h += `<span class="selo ${cls}">${plEsc(p.selo)}</span>`;
        }
        if (p.precoAntigo && !p.variacoes && p.precoAntigo > p.preco) h += `<span class="selo-desc">-${Math.round((1 - p.preco / p.precoAntigo) * 100)}%</span>`;
        return h;
    };
    const qtdNaSacola = (id) => estado.sacola.filter((i) => i.id === id).reduce((a, i) => a + i.qtd, 0);

    const cardProduto = (p) => {
        const est = plEstoqueTotal(p);
        const esgotado = est <= 0;
        const varios = p.variacoes && p.variacoes.length;
        const naSacola = qtdNaSacola(p.id);
        return `
        <article class="produto ${esgotado ? "esgotado" : ""}" data-id="${p.id}">
            <button class="foto" type="button" data-abrir="${p.id}" aria-label="Ver ${plEsc(p.nome)}">${fotoHTML(p)}${seloHTML(p)}</button>
            <div class="produto-info">
                <span class="produto-cat">${plEsc(categoria(p.categoria).nome)}</span>
                <span class="produto-nome" data-abrir="${p.id}">${plEsc(p.nome)}</span>
                <span class="produto-un">${plEsc(p.unidade)}</span>
                ${!esgotado && est <= 3 ? `<span class="ultimas"><i class="fa-solid fa-fire"></i> Últimas unidades</span>` : ""}
                <div class="produto-preco">
                    ${varios ? `<span class="a-partir">a partir de</span>` : ""}
                    <span class="por">${plMoeda(plPrecoMin(p))}</span>
                    ${p.precoAntigo && !varios ? `<span class="de">${plMoeda(p.precoAntigo)}</span>` : ""}
                </div>
                <button class="btn-add ${naSacola ? "no-carrinho" : ""}" type="button" data-add="${p.id}" ${esgotado ? "disabled" : ""}>
                    ${esgotado ? "Esgotado" : varios ? `<i class="fa-solid fa-list-check"></i> Escolher opção` : naSacola ? `<i class="fa-solid fa-check"></i> ${naSacola} na sacolinha` : `<i class="fa-solid fa-plus"></i> Adicionar`}
                </button>
            </div>
        </article>`;
    };

    const renderOfertas = () => {
        const ofertas = produtosAtivos().filter((p) => /black/i.test(p.selo) || (p.precoAntigo && p.precoAntigo > p.preco));
        $("#ofertas").hidden = !ofertas.length;
        $("#carrossel-ofertas").innerHTML = ofertas.map((p) => `
            <a class="oferta" href="#produto/${plSlug(p.nome)}">
                ${p.imagem ? `<img src="${plEsc(p.imagem)}" alt="" loading="lazy">` : ""}
                <div><strong>${plEsc(p.nome)}</strong>${p.precoAntigo ? `<span class="de">${plMoeda(p.precoAntigo)}</span>` : ""}<span class="por">${plMoeda(plPrecoMin(p))}</span></div>
            </a>`).join("");
    };

    const renderCategorias = () => {
        $("#cat-grid").innerHTML = db.categorias.map((c) => `
            <button class="cat" type="button" data-cat="${c.id}" style="--c:${c.cor}">
                <span class="cat-ico"><i class="fa-solid ${c.icone}"></i></span>${plEsc(c.nome)}
            </button>`).join("");
        $("#chips-cat").innerHTML = `<button class="chip ${!estado.cat ? "ativo" : ""}" data-cat="">Todos</button>` +
            db.categorias.map((c) => `<button class="chip ${estado.cat === c.id ? "ativo" : ""}" data-cat="${c.id}">${plEsc(c.nome)}</button>`).join("");
    };

    const normalizar = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const renderProdutos = () => {
        let lista = produtosAtivos();
        if (estado.cat) lista = lista.filter((p) => p.categoria === estado.cat);
        if (estado.busca) {
            const termos = normalizar(estado.busca).split(/\s+/).filter(Boolean);
            lista = lista.filter((p) => { const t = normalizar(`${p.nome} ${p.unidade} ${p.descricao} ${categoria(p.categoria).nome}`); return termos.every((x) => t.includes(x)); });
        }
        const disp = (p) => (plEstoqueTotal(p) > 0 ? 0 : 1);
        const ord = {
            destaque: (a, b) => disp(a) - disp(b) || (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0) || a.id - b.id,
            ofertas: (a, b) => disp(a) - disp(b) || (b.precoAntigo || b.selo ? 1 : 0) - (a.precoAntigo || a.selo ? 1 : 0),
            menor: (a, b) => plPrecoMin(a) - plPrecoMin(b),
            maior: (a, b) => plPrecoMin(b) - plPrecoMin(a),
            nome: (a, b) => a.nome.localeCompare(b.nome),
        };
        lista.sort(ord[estado.ordenar]);
        $("#grid-produtos").innerHTML = lista.map(cardProduto).join("");
        $("#titulo-lista").textContent = estado.busca ? `Resultados para "${estado.busca}"` : estado.cat ? categoria(estado.cat).nome : "Todos os produtos";
        $("#contador").textContent = `${lista.length} ${lista.length === 1 ? "produto" : "produtos"}`;
        $("#vazio").hidden = lista.length > 0;
        $("#perguntar-whats").href = plLinkWhats(cfg().whatsapp, `Olá! Vocês têm ${estado.busca || "este produto"}?`);
        $$(".chip", $("#chips-cat")).forEach((b) => b.classList.toggle("ativo", (b.dataset.cat || null) === estado.cat));
    };

    // ─── MODAL DO PRODUTO ───────────────────────────────────────────────────
    let modalAtual = null;
    const abrirProduto = (p, varInicial = null) => {
        const varios = p.variacoes && p.variacoes.length;
        let vi = varInicial ?? (varios ? p.variacoes.findIndex((v) => v.estoque > 0) : null);
        if (vi === -1) vi = null;
        let qtd = 1;
        modalAtual = p;
        const desenhar = () => {
            const preco = varios && vi !== null ? p.variacoes[vi].preco : p.preco;
            const est = varios ? (vi !== null ? p.variacoes[vi].estoque : 0) : p.estoque;
            $("#mp-conteudo").innerHTML = `
            <div class="mp">
                <div class="foto">${seloHTML(p)}${fotoHTML(p)}</div>
                <div class="mp-info">
                    <span class="produto-cat">${plEsc(categoria(p.categoria).nome)}</span>
                    <h2 id="mp-nome">${plEsc(p.nome)}</h2>
                    <span class="produto-un">${plEsc(p.unidade)}</span>
                    <p>${plEsc(p.descricao)}</p>
                    ${varios ? `<p class="rotulo">Escolha a opção</p><div class="mp-variacoes">${p.variacoes.map((v, i) => `
                        <button type="button" class="opcao ${i === vi ? "ativo" : ""}" data-var="${i}" ${v.estoque <= 0 ? "disabled" : ""}>${plEsc(v.nome)}<small>${v.estoque <= 0 ? "esgotado" : plMoeda(v.preco)}</small></button>`).join("")}</div>` : ""}
                    <div class="produto-preco"><span class="por">${plMoeda(preco)}</span>${p.precoAntigo && !varios ? `<span class="de">${plMoeda(p.precoAntigo)}</span>` : ""}</div>
                    ${est > 0 && est <= 3 ? `<span class="ultimas"><i class="fa-solid fa-fire"></i> Só ${est} em estoque</span>` : ""}
                    <div class="mp-acoes">
                        <div class="qtd"><button type="button" data-q="-1" aria-label="Menos">−</button><span>${qtd}</span><button type="button" data-q="1" aria-label="Mais">+</button></div>
                        <button class="btn btn-teal" type="button" id="mp-add" ${est <= 0 ? "disabled" : ""}><i class="fa-solid fa-bag-shopping"></i> ${est <= 0 ? "Esgotado" : "Adicionar " + plMoeda(preco * qtd)}</button>
                    </div>
                    <button class="link-compartilhar" type="button" id="mp-link"><i class="fa-solid fa-link"></i> Copiar link deste produto</button>
                </div>
            </div>`;
            $$("[data-var]", $("#mp-conteudo")).forEach((b) => b.onclick = () => { vi = Number(b.dataset.var); qtd = 1; desenhar(); });
            $$("[data-q]", $("#mp-conteudo")).forEach((b) => b.onclick = () => { qtd = Math.max(1, Math.min(est || 1, qtd + Number(b.dataset.q))); desenhar(); });
            $("#mp-add").onclick = () => {
                if (varios && vi === null) return;
                adicionar(p.id, varios ? vi : null, qtd);
                fecharModal();
            };
            $("#mp-link").onclick = () => {
                const url = `${location.origin}${location.pathname}#produto/${plSlug(p.nome)}`;
                (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copiado! Cole no WhatsApp ou nos stories.")).catch(() => prompt("Copie o link:", url));
            };
        };
        desenhar();
        $("#modal-produto").hidden = false;
        document.body.classList.add("travado");
        const novoHash = `#produto/${plSlug(p.nome)}`;
        if (location.hash !== novoHash) history.replaceState(null, "", novoHash);
    };
    const fecharModal = () => {
        $("#modal-produto").hidden = true;
        document.body.classList.remove("travado");
        modalAtual = null;
        if (location.hash.startsWith("#produto/")) history.replaceState(null, "", "#produtos");
    };

    // ─── SACOLINHA ──────────────────────────────────────────────────────────
    const salvarSacola = () => { try { localStorage.setItem(CHAVE_SACOLA, JSON.stringify(estado.sacola)); } catch (e) { /* ok */ } };
    const itemInfo = (it) => {
        const p = db.produtos.find((x) => x.id === it.id);
        if (!p) return null;
        const v = it.v !== null && p.variacoes ? p.variacoes[it.v] : null;
        return { p, v, nome: p.nome + (v ? ` · ${v.nome}` : ""), preco: v ? v.preco : p.preco, estoque: v ? v.estoque : p.estoque };
    };
    const adicionar = (id, v, qtd = 1) => {
        const ex = estado.sacola.find((i) => i.id === id && i.v === v);
        const info = itemInfo({ id, v });
        const atual = ex ? ex.qtd : 0;
        const nova = Math.min(info.estoque, atual + qtd);
        if (nova <= atual) { toast("Quantidade máxima em estoque."); return; }
        if (ex) ex.qtd = nova; else estado.sacola.push({ id, v, qtd: nova });
        salvarSacola(); atualizarSacola(); renderProdutos();
        toast(`${info.nome} adicionado à sacolinha`);
        const b = $("#abrir-sacola"); b.classList.remove("pulo"); void b.offsetWidth; b.classList.add("pulo");
    };
    const subtotal = () => estado.sacola.reduce((a, it) => { const i = itemInfo(it); return a + (i ? i.preco * it.qtd : 0); }, 0);
    const taxa = () => (estado.checkout.tipo === "entrega" && subtotal() < cfg().freteGratisAcima ? Number(cfg().taxaEntrega) : 0);

    const atualizarSacola = () => {
        estado.sacola = estado.sacola.filter((it) => itemInfo(it));
        const qtd = estado.sacola.reduce((a, i) => a + i.qtd, 0);
        const total = subtotal();
        $("#badge").textContent = qtd;
        $("#total-header").textContent = plMoeda(total);
        $("#barra-sacola").hidden = qtd === 0 || !$("#view-loja").offsetParent;
        $("#barra-qtd").textContent = `${qtd} ${qtd === 1 ? "item" : "itens"}`;
        $("#barra-total").textContent = plMoeda(total);
        if (!$("#gaveta").hidden) renderSacola();
    };

    const renderSacola = () => {
        const c = cfg(), ck = estado.checkout;
        if (!estado.sacola.length) {
            $("#sacola-corpo").innerHTML = `<div class="sacola-vazia"><i class="fa-solid fa-bag-shopping"></i><p>Sua sacolinha está vazia.</p><br><button class="btn btn-teal" data-fechar-sacola>Ver produtos</button></div>`;
            return;
        }
        if (!ck.loja) ck.loja = c.lojas[0].id;
        const sub = subtotal(), tx = taxa();
        const falta = c.freteGratisAcima - sub;
        $("#sacola-corpo").innerHTML = `
            ${estado.sacola.map((it, idx) => {
                const i = itemInfo(it); const cat = categoria(i.p.categoria);
                return `<div class="item-sacola">
                    ${i.p.imagem ? `<img src="${plEsc(i.p.imagem)}" alt="">` : `<span class="mini-arte" style="--c:${cat.cor}"><i class="fa-solid ${cat.icone}"></i></span>`}
                    <div class="info"><strong>${plEsc(i.nome)}</strong><small>${plMoeda(i.preco)} · total ${plMoeda(i.preco * it.qtd)}</small></div>
                    <div class="qtd"><button type="button" data-item="${idx}" data-d="-1" aria-label="Menos">${it.qtd === 1 ? '<i class="fa-solid fa-trash-can"></i>' : "−"}</button><span>${it.qtd}</span><button type="button" data-item="${idx}" data-d="1" aria-label="Mais">+</button></div>
                </div>`;
            }).join("")}

            <div class="bloco">
                <h3>Como quer receber?</h3>
                <div class="opcoes">
                    <button type="button" class="opcao ${ck.tipo === "entrega" ? "ativo" : ""}" data-tipo="entrega"><i class="fa-solid fa-motorcycle"></i> Tele-entrega</button>
                    <button type="button" class="opcao ${ck.tipo === "retirada" ? "ativo" : ""}" data-tipo="retirada"><i class="fa-solid fa-store"></i> Retirar na loja</button>
                </div>
                ${ck.tipo === "entrega" ? `
                    <div class="linha-2"><label class="campo">Rua<input data-ck="rua" value="${plEsc(ck.rua)}" autocomplete="address-line1"></label><label class="campo">Número<input data-ck="numero" value="${plEsc(ck.numero)}" inputmode="numeric"></label></div>
                    <div class="linha-2"><label class="campo">Bairro<input data-ck="bairro" value="${plEsc(ck.bairro)}"></label><label class="campo">Referência<input data-ck="referencia" value="${plEsc(ck.referencia)}" placeholder="opcional"></label></div>
                    <div class="aviso-frete ${falta <= 0 ? "ok" : ""}">${falta <= 0 ? `<i class="fa-solid fa-gift"></i> Oba! Sua tele-entrega é grátis.` : `<i class="fa-solid fa-truck"></i> Faltam ${plMoeda(falta)} para a tele-entrega grátis.`}</div>
                ` : `
                    <div class="opcoes">${c.lojas.map((l) => `<button type="button" class="opcao ${ck.loja === l.id ? "ativo" : ""}" data-loja="${l.id}">${plEsc(l.nome)}</button>`).join("")}</div>
                    <small class="produto-un">${plEsc((c.lojas.find((l) => l.id === ck.loja) || c.lojas[0]).endereco)}</small>
                `}
            </div>

            <div class="bloco">
                <h3>Pagamento</h3>
                <div class="opcoes">${c.formasPagamento.map((f) => `<button type="button" class="opcao ${ck.pagamento === f ? "ativo" : ""}" data-pag="${plEsc(f)}">${plEsc(f)}</button>`).join("")}</div>
                ${ck.pagamento === "Dinheiro" ? `<label class="campo">Troco para quanto?<input data-ck="troco" value="${plEsc(ck.troco)}" inputmode="decimal" placeholder="Ex.: 100"></label>` : ""}
            </div>

            <div class="bloco">
                <h3>Seus dados</h3>
                <div class="linha-2"><label class="campo">Nome<input data-ck="nome" value="${plEsc(ck.nome)}" autocomplete="name"></label><label class="campo">WhatsApp<input data-ck="fone" value="${plEsc(ck.fone)}" inputmode="tel" autocomplete="tel"></label></div>
            </div>

            <div class="bloco totais">
                <div class="resumo-linha"><span>Produtos</span><span>${plMoeda(sub)}</span></div>
                <div class="resumo-linha"><span>${ck.tipo === "entrega" ? "Tele-entrega" : "Retirada"}</span><span>${ck.tipo === "entrega" ? (tx ? plMoeda(tx) : "Grátis") : "Grátis"}</span></div>
                <div class="resumo-total"><span>Total</span><strong>${plMoeda(sub + tx)}</strong></div>
                <p class="erro" id="sacola-erro" hidden></p>
                <button class="btn btn-whats btn-bloco" type="button" id="finalizar"><i class="fa-brands fa-whatsapp"></i> Finalizar no WhatsApp</button>
                <small class="nota">O pagamento é combinado na conversa com a loja.</small>
            </div>`;
    };

    const finalizar = () => {
        const c = cfg(), ck = estado.checkout;
        const faltando = [];
        if (!ck.nome.trim()) faltando.push("seu nome");
        if (plSoNumeros(ck.fone).length < 10) faltando.push("seu WhatsApp");
        if (ck.tipo === "entrega" && (!ck.rua.trim() || !ck.numero.trim() || !ck.bairro.trim())) faltando.push("o endereço completo");
        const erro = $("#sacola-erro");
        if (faltando.length) { erro.textContent = `Falta preencher ${faltando.join(", ")}.`; erro.hidden = false; return; }
        const codigo = "PL" + Date.now().toString().slice(-6);
        const sub = subtotal(), tx = taxa();
        const itens = estado.sacola.map((it) => { const i = itemInfo(it); return { id: it.id, nome: i.nome, qtd: it.qtd, preco: i.preco }; });
        const loja = c.lojas.find((l) => l.id === ck.loja) || c.lojas[0];
        const linhas = [
            `🐾 *Pedido ${codigo} — Pet Life*`, "",
            ...itens.map((i) => `• ${i.qtd}x ${i.nome} — ${plMoeda(i.qtd * i.preco)}`), "",
            `Produtos: ${plMoeda(sub)}`,
            ck.tipo === "entrega" ? `Tele-entrega: ${tx ? plMoeda(tx) : "grátis"}` : `Retirada: ${loja.nome}`,
            `*Total: ${plMoeda(sub + tx)}*`, "",
            ck.tipo === "entrega" ? `📍 Entregar em: ${ck.rua}, ${ck.numero} — ${ck.bairro}${ck.referencia ? ` (${ck.referencia})` : ""}` : `📍 Vou retirar na ${loja.nome} (${loja.endereco})`,
            `💳 Pagamento: ${ck.pagamento}${ck.pagamento === "Dinheiro" && ck.troco ? ` (troco para R$ ${ck.troco})` : ""}`,
            `👤 ${ck.nome} · ${ck.fone}`,
        ];
        // Registro para os gráficos do painel
        db.pedidos.push({ codigo, data: new Date().toISOString(), cliente: ck.nome, itens, subtotal: sub, taxa: tx, total: sub + tx, entrega: ck.tipo === "entrega" ? "Tele-entrega" : "Retirada" });
        PetDB.salvar(db);
        try { localStorage.setItem(CHAVE_CLIENTE, JSON.stringify({ nome: ck.nome, fone: ck.fone, rua: ck.rua, numero: ck.numero, bairro: ck.bairro, referencia: ck.referencia })); } catch (e) { /* ok */ }
        abrirWhats(plLinkWhats(c.whatsapp, linhas.join("\n")));
        estado.sacola = []; salvarSacola(); atualizarSacola(); renderProdutos();
        $("#sacola-corpo").innerHTML = `<div class="sacola-vazia"><i class="fa-solid fa-circle-check" style="color:var(--whats)"></i><p><strong>Pedido ${codigo} enviado!</strong><br>Agora é só confirmar na conversa do WhatsApp.</p><br><button class="btn btn-teal" data-fechar-sacola>Continuar comprando</button></div>`;
    };

    const abrirSacola = () => { $("#gaveta").hidden = false; document.body.classList.add("travado"); renderSacola(); };
    const fecharSacola = () => { $("#gaveta").hidden = true; document.body.classList.remove("travado"); };

    // ─── BANHO E TOSA ───────────────────────────────────────────────────────
    const ag = estado.ag;
    const servicosAtivos = () => db.servicos.filter((s) => s.ativo);
    const lojasBanho = () => cfg().lojas.filter((l) => cfg().agenda.lojasComBanho.includes(l.id));
    const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    const vagasLivres = (data, hora, loja) => {
        const usados = db.agendamentos.filter((a) => a.data === data && a.hora === hora && a.loja === loja && !["cancelado", "faltou"].includes(a.status)).length;
        return Number(cfg().agenda.vagasPorHorario) - usados;
    };
    const horariosLivres = (data, loja) => {
        const a = cfg().agenda;
        const d = plParseData(data);
        if (!a.diasSemana.includes(d.getDay()) || (a.diasFechados || []).includes(data)) return [];
        const agora = new Date();
        const ehHoje = data === plDataISO(agora);
        const minAgora = agora.getHours() * 60 + agora.getMinutes() + 30;
        return plHorariosDoDia(a).map((h) => ({ hora: h, livres: ehHoje && plMin(h) < minAgora ? 0 : vagasLivres(data, h, loja) }));
    };

    const renderTabelaPrecos = () => {
        $("#tabela-precos").innerHTML = servicosAtivos().map((s) => `
            <div class="servico-card">
                <h3><i class="fa-solid ${s.icone || "fa-shower"}"></i> ${plEsc(s.nome)}</h3>
                <p>${plEsc(s.descricao)}</p>
                <div class="precos-porte">${PL_PORTES.map((p) => `<div><small>${p.nome}</small><strong>${plMoeda(s.precos[p.id])}</strong></div>`).join("")}</div>
            </div>`).join("") +
            `<div class="servico-card"><h3><i class="fa-solid fa-plus"></i> Adicionais</h3><p>Escolha junto com o serviço.</p>
             ${db.adicionais.filter((a) => a.ativo).map((a) => `<div class="resumo-linha"><span>${plEsc(a.nome)}</span><span>${plMoeda(a.preco)}</span></div>`).join("")}</div>`;
    };

    const renderAgendar = () => {
        const lojas = lojasBanho();
        if (!lojas.find((l) => l.id === ag.loja)) ag.loja = lojas[0] ? lojas[0].id : "";
        // espécie
        $$("#ag-especie .opcao").forEach((b) => b.classList.toggle("ativo", b.dataset.v === ag.especie));
        // porte
        $("#ag-porte").innerHTML = PL_PORTES.map((p) => `<button type="button" class="opcao ${ag.porte === p.id ? "ativo" : ""}" data-porte="${p.id}">${p.nome}<small>${p.dica}</small></button>`).join("");
        // serviços (gato só vê banho para gatos; cão não vê)
        const lista = servicosAtivos().filter((s) => (ag.especie === "Gato" ? s.id === "gato" || !["banho", "banho-higienica", "banho-tosa"].includes(s.id) : s.id !== "gato"));
        if (!lista.find((s) => s.id === ag.servico)) ag.servico = lista[0] ? lista[0].id : "";
        $("#ag-servicos").innerHTML = lista.map((s) => `
            <button type="button" class="servico-op ${ag.servico === s.id ? "ativo" : ""}" data-servico="${s.id}">
                <i class="fa-solid ${s.icone || "fa-shower"}"></i><div><strong>${plEsc(s.nome)}</strong><span>${plMoeda(s.precos[ag.porte])}</span></div>
            </button>`).join("");
        $("#ag-adicionais").innerHTML = db.adicionais.filter((a) => a.ativo).map((a) => `
            <label class="adicional"><input type="checkbox" data-adicional="${a.id}" ${ag.adicionais.includes(a.id) ? "checked" : ""}> ${plEsc(a.nome)} <b>+${plMoeda(a.preco)}</b></label>`).join("");
        // loja
        $("#ag-loja").innerHTML = lojas.map((l) => `<button type="button" class="opcao ${ag.loja === l.id ? "ativo" : ""}" data-agloja="${l.id}"><i class="fa-solid fa-store"></i> ${plEsc(l.nome)}</button>`).join("");
        // dias
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const dias = [];
        for (let i = 0; i <= Number(cfg().agenda.diasAntecedencia); i++) {
            const d = new Date(hoje); d.setDate(hoje.getDate() + i);
            const iso = plDataISO(d);
            const hs = horariosLivres(iso, ag.loja);
            const livres = hs.reduce((a, h) => a + Math.max(0, h.livres), 0);
            dias.push({ d, iso, livres, fechado: !hs.length });
        }
        if (ag.data && !dias.find((x) => x.iso === ag.data && x.livres > 0)) { ag.data = ""; ag.hora = ""; }
        if (!ag.data) { const pr = dias.find((x) => x.livres > 0); ag.data = pr ? pr.iso : ""; }
        $("#ag-dias").innerHTML = dias.map((x, i) => `
            <button type="button" class="dia ${ag.data === x.iso ? "ativo" : ""}" data-dia="${x.iso}" ${x.livres > 0 ? "" : "disabled"}>
                <small>${i === 0 ? "Hoje" : i === 1 ? "Amanhã" : DIAS[x.d.getDay()]}</small><strong>${x.d.getDate()}</strong><em>${x.livres > 0 ? MESES[x.d.getMonth()] : x.fechado ? "fechado" : "lotado"}</em>
            </button>`).join("");
        // horários
        const hs = ag.data ? horariosLivres(ag.data, ag.loja) : [];
        if (ag.hora && !hs.find((h) => h.hora === ag.hora && h.livres > 0)) ag.hora = "";
        $("#ag-dia-txt").textContent = ag.data ? `· ${plParseData(ag.data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}` : "";
        $("#ag-horarios").innerHTML = hs.length ? hs.map((h) => `
            <button type="button" class="hora ${ag.hora === h.hora ? "ativo" : ""}" data-hora="${h.hora}" ${h.livres > 0 ? "" : "disabled"}>${h.hora}<small>${h.livres > 0 ? (h.livres === 1 ? "última vaga" : "livre") : "ocupado"}</small></button>`).join("")
            : `<p class="sem-horario">Sem horários neste dia. Escolha outro dia.</p>`;
        renderResumoAg();
    };

    const renderResumoAg = () => {
        const s = db.servicos.find((x) => x.id === ag.servico);
        const loja = cfg().lojas.find((l) => l.id === ag.loja);
        const porte = PL_PORTES.find((p) => p.id === ag.porte);
        const adic = db.adicionais.filter((a) => ag.adicionais.includes(a.id));
        const total = plValorAgendamento({ servico: ag.servico, porte: ag.porte, adicionais: ag.adicionais }, db.servicos, db.adicionais);
        const pet = $("#ag-pet").value.trim();
        $("#ag-resumo").innerHTML = `
            <div class="resumo-linha"><span>Pet</span><span>${plEsc(pet || "—")} · ${ag.especie} ${porte.nome.toLowerCase()}</span></div>
            <div class="resumo-linha"><span>Serviço</span><span>${s ? plEsc(s.nome) : "—"}</span></div>
            ${adic.length ? `<div class="resumo-linha"><span>Adicionais</span><span>${adic.map((a) => plEsc(a.nome)).join(", ")}</span></div>` : ""}
            <div class="resumo-linha"><span>Loja</span><span>${loja ? plEsc(loja.nome) : "—"}</span></div>
            <div class="resumo-linha"><span>Quando</span><span>${ag.data ? plParseData(ag.data).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }) : "—"}${ag.hora ? ` às ${ag.hora}` : ""}</span></div>
            <div class="resumo-total"><span>Valor estimado</span><strong>${plMoeda(total)}</strong></div>`;
    };

    const enviarAgendamento = (e) => {
        e.preventDefault();
        const erro = $("#ag-erro");
        const campos = { pet: $("#ag-pet"), tutor: $("#ag-tutor"), fone: $("#ag-fone") };
        Object.values(campos).forEach((el) => el.closest(".campo").classList.remove("invalido"));
        const faltando = [];
        if (!campos.pet.value.trim()) { faltando.push("o nome do pet"); campos.pet.closest(".campo").classList.add("invalido"); }
        if (!ag.servico) faltando.push("o serviço");
        if (!ag.data || !ag.hora) faltando.push("o dia e o horário");
        if (!campos.tutor.value.trim()) { faltando.push("seu nome"); campos.tutor.closest(".campo").classList.add("invalido"); }
        if (plSoNumeros(campos.fone.value).length < 10) { faltando.push("seu WhatsApp"); campos.fone.closest(".campo").classList.add("invalido"); }
        if (faltando.length) { erro.textContent = `Falta escolher/preencher: ${faltando.join(", ")}.`; erro.hidden = false; return; }
        db = PetDB.carregar();
        if (vagasLivres(ag.data, ag.hora, ag.loja) <= 0) { erro.textContent = "Esse horário acabou de ser ocupado. Escolha outro, por favor."; erro.hidden = false; renderAgendar(); return; }
        erro.hidden = true;
        const novo = {
            id: Math.max(0, ...db.agendamentos.map((a) => a.id)) + 1,
            data: ag.data, hora: ag.hora, loja: ag.loja, nomePet: campos.pet.value.trim(), especie: ag.especie, raca: $("#ag-raca").value.trim(), porte: ag.porte,
            servico: ag.servico, adicionais: [...ag.adicionais], tutor: campos.tutor.value.trim(), telefone: campos.fone.value.trim(),
            observacoes: $("#ag-obs").value.trim(), origem: "site", status: "pendente", criadoEm: new Date().toISOString(),
        };
        db.agendamentos.push(novo);
        PetDB.salvar(db);
        const s = db.servicos.find((x) => x.id === novo.servico);
        const loja = cfg().lojas.find((l) => l.id === novo.loja);
        const adic = db.adicionais.filter((a) => novo.adicionais.includes(a.id)).map((a) => a.nome);
        const total = plValorAgendamento(novo, db.servicos, db.adicionais);
        const dataTxt = plParseData(novo.data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
        const msg = [
            "🛁 *Agendamento de Banho e Tosa — Pet Life*", "",
            `🐾 Pet: ${novo.nomePet} (${novo.especie}${novo.raca ? `, ${novo.raca}` : ""}, porte ${PL_PORTES.find((p) => p.id === novo.porte).nome.toLowerCase()})`,
            `✂️ Serviço: ${s.nome}${adic.length ? ` + ${adic.join(", ")}` : ""}`,
            `📅 ${dataTxt} às ${novo.hora}`,
            `📍 ${loja.nome} — ${loja.endereco}`,
            `💰 Valor estimado: ${plMoeda(total)}`,
            novo.observacoes ? `📝 Obs.: ${novo.observacoes}` : "",
            "", `👤 ${novo.tutor} · ${novo.telefone}`, "", "Pode confirmar, por favor? 😊",
        ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "");
        abrirWhats(plLinkWhats(cfg().whatsapp, msg.join("\n")));
        try { const cli = JSON.parse(localStorage.getItem(CHAVE_CLIENTE) || "{}"); localStorage.setItem(CHAVE_CLIENTE, JSON.stringify({ ...cli, nome: novo.tutor, fone: novo.telefone })); } catch (er) { /* ok */ }
        $("#form-agendar").innerHTML = `
            <div class="etapa" style="grid-column:1/-1;text-align:center;padding:36px 20px">
                <i class="fa-solid fa-circle-check" style="font-size:3rem;color:var(--whats)"></i>
                <h2 class="titulo-secao" style="margin:10px 0 6px">Horário reservado para ${plEsc(novo.nomePet)}!</h2>
                <p class="secao-sub">${plEsc(dataTxt)} às ${novo.hora} · ${plEsc(loja.nome)}<br>Envie a mensagem no WhatsApp para a loja confirmar.</p><br>
                <button class="btn btn-teal" type="button" onclick="location.reload()"><i class="fa-solid fa-plus"></i> Agendar outro pet</button>
            </div>`;
    };

    // ─── NAVEGAÇÃO (abas e links) ───────────────────────────────────────────
    const mostrarView = (qual) => {
        $("#view-loja").hidden = qual !== "loja";
        $("#view-banho").hidden = qual !== "banho";
        $$(".aba").forEach((a) => a.classList.toggle("ativo", a.dataset.aba === qual));
        document.title = qual === "banho" ? "Banho e Tosa · Pet Life Canoas" : "Pet Life Canoas · Agropecuária, Pet Shop e Banho e Tosa";
        if (qual === "banho") renderAgendar();
        atualizarSacola();
    };
    const rotear = () => {
        const h = decodeURIComponent(location.hash.slice(1));
        if (!$("#gaveta").hidden) fecharSacola();
        if (h.startsWith("produto/")) {
            mostrarView("loja");
            const p = produtosAtivos().find((x) => plSlug(x.nome) === h.slice(8));
            if (p) abrirProduto(p);
            return;
        }
        if (!$("#modal-produto").hidden) fecharModal();
        if (h === "banho-e-tosa" || h === "agendar") {
            const mudou = $("#view-banho").hidden;
            mostrarView("banho");
            if (h === "agendar") $("#agendar").scrollIntoView({ behavior: "smooth" });
            else if (mudou) window.scrollTo({ top: 0 });
            return;
        }
        const mudou = $("#view-loja").hidden;
        mostrarView("loja");
        const alvo = h && document.getElementById(h);
        if (alvo && h !== "loja") alvo.scrollIntoView({ behavior: mudou ? "auto" : "smooth" });
        else if (mudou) window.scrollTo({ top: 0 });
    };

    // ─── EVENTOS ────────────────────────────────────────────────────────────
    document.addEventListener("click", (e) => {
        const t = e.target.closest("button, a, [data-abrir]");
        if (!t) return;
        if (t.dataset.abrir) { const p = db.produtos.find((x) => x.id === Number(t.dataset.abrir)); if (p) abrirProduto(p); return; }
        if (t.dataset.add) {
            const p = db.produtos.find((x) => x.id === Number(t.dataset.add));
            if (p.variacoes && p.variacoes.length) abrirProduto(p); else adicionar(p.id, null, 1);
            return;
        }
        if (t.dataset.cat !== undefined && (t.classList.contains("cat") || t.classList.contains("chip"))) {
            estado.cat = t.dataset.cat || null; estado.busca = ""; $("#busca").value = "";
            renderProdutos();
            if (t.classList.contains("cat")) $("#produtos").scrollIntoView({ behavior: "smooth" });
            return;
        }
        if (t.hasAttribute("data-fechar")) { fecharModal(); return; }
        if (t.hasAttribute("data-fechar-sacola")) { fecharSacola(); if (t.classList.contains("btn")) location.hash = "#produtos"; return; }
        // sacolinha
        if (t.dataset.item !== undefined) {
            const it = estado.sacola[Number(t.dataset.item)];
            const info = itemInfo(it);
            it.qtd = Math.min(info.estoque, it.qtd + Number(t.dataset.d));
            if (it.qtd <= 0) estado.sacola.splice(Number(t.dataset.item), 1);
            salvarSacola(); atualizarSacola(); renderProdutos(); return;
        }
        if (t.dataset.tipo) { estado.checkout.tipo = t.dataset.tipo; renderSacola(); return; }
        if (t.dataset.loja) { estado.checkout.loja = t.dataset.loja; renderSacola(); return; }
        if (t.dataset.pag) { estado.checkout.pagamento = t.dataset.pag; renderSacola(); return; }
        if (t.id === "finalizar") { finalizar(); return; }
        // agendamento
        if (t.closest("#ag-especie")) { ag.especie = t.dataset.v; if (ag.especie === "Gato" && ["G", "GG"].includes(ag.porte)) ag.porte = "M"; renderAgendar(); return; }
        if (t.dataset.porte) { ag.porte = t.dataset.porte; renderAgendar(); return; }
        if (t.dataset.servico) { ag.servico = t.dataset.servico; renderAgendar(); return; }
        if (t.dataset.agloja) { ag.loja = t.dataset.agloja; ag.hora = ""; renderAgendar(); return; }
        if (t.dataset.dia) { ag.data = t.dataset.dia; ag.hora = ""; renderAgendar(); return; }
        if (t.dataset.hora) { ag.hora = t.dataset.hora; renderAgendar(); return; }
    });
    document.addEventListener("change", (e) => {
        if (e.target.dataset.adicional) {
            const id = e.target.dataset.adicional;
            ag.adicionais = e.target.checked ? [...ag.adicionais, id] : ag.adicionais.filter((x) => x !== id);
            renderResumoAg();
        }
    });
    const mascaraFone = (v) => {
        const n = plSoNumeros(v).slice(0, 11);
        if (n.length <= 2) return n;
        if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
        if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
        return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    };
    document.addEventListener("input", (e) => {
        if (e.target.id === "ag-fone" || e.target.dataset.ck === "fone") e.target.value = mascaraFone(e.target.value);
        if (e.target.dataset.ck) estado.checkout[e.target.dataset.ck] = e.target.value;
        if (e.target.id === "ag-pet") renderResumoAg();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (!$("#modal-produto").hidden) fecharModal(); else if (!$("#gaveta").hidden) fecharSacola(); } });
    $("#abrir-sacola").onclick = abrirSacola;
    $("#barra-sacola").onclick = abrirSacola;
    let tBusca;
    $("#busca").addEventListener("input", (e) => {
        clearTimeout(tBusca);
        tBusca = setTimeout(() => {
            estado.busca = e.target.value.trim(); estado.cat = null;
            if ($("#view-loja").hidden) location.hash = "#produtos";
            renderProdutos();
            if (estado.busca) $("#produtos").scrollIntoView({ behavior: "smooth" });
        }, 250);
    });
    $("#ordenar").onchange = (e) => { estado.ordenar = e.target.value; renderProdutos(); };
    $("#form-agendar").addEventListener("submit", enviarAgendamento);
    window.addEventListener("hashchange", rotear);

    // Painel aberto em outra aba mudou algo → atualiza a loja
    PetDB.aoMudarEmOutraAba((novo) => { db = novo; renderTudo(); if (!$("#view-banho").hidden) renderAgendar(); });

    const renderTudo = () => { preencherLoja(); renderOfertas(); renderCategorias(); renderProdutos(); renderTabelaPrecos(); atualizarSacola(); };
    const cli = estado.checkout;
    if (cli.nome) $("#ag-tutor").value = cli.nome;
    if (cli.fone) $("#ag-fone").value = cli.fone;
    renderTudo();
    rotear();
})();
