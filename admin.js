// ─────────────────────────────────────────────────────────────────────────────
// PET LIFE — PAINEL DA LOJA
// Início (resumo e gráficos) · Agenda de banho e tosa · Estoque · Serviços · Ajustes
// ─────────────────────────────────────────────────────────────────────────────
(() => {
    let db = PetDB.carregar();
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const CHAVE_SESSAO = "petlife_painel_sessao";
    const salvar = () => { PetDB.salvar(db); atualizarContadores(); };
    const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("mostra"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("mostra"), 2300); };
    const cfg = () => db.config;
    const hojeISO = () => plDataISO(new Date());
    const nomeLoja = (id) => (cfg().lojas.find((l) => l.id === id) || { nome: "—" }).nome;
    const servico = (id) => db.servicos.find((s) => s.id === id) || { nome: "Serviço", precos: {} };
    const porteNome = (id) => (PL_PORTES.find((p) => p.id === id) || { nome: id }).nome;
    const valorAg = (a) => plValorAgendamento(a, db.servicos, db.adicionais);
    const categoria = (id) => db.categorias.find((c) => c.id === id) || { nome: "", icone: "fa-paw", cor: "#2AA3AD" };
    const estoqueBaixo = (p) => p.ativo && plEstoqueTotal(p) <= (Number(p.estoqueMin) || 0);
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // ─── LOGIN ──────────────────────────────────────────────────────────────
    const entrar = () => { $("#tela-login").hidden = true; $("#app").hidden = false; irPara(location.hash.slice(1) || "inicio"); };
    $("#form-login").addEventListener("submit", (e) => {
        e.preventDefault();
        if ($("#senha").value === cfg().senhaPainel) { sessionStorage.setItem(CHAVE_SESSAO, "1"); entrar(); }
        else { $("#erro-login").hidden = false; $("#senha").select(); }
    });
    $("#sair").onclick = () => { sessionStorage.removeItem(CHAVE_SESSAO); location.reload(); };

    // ─── NAVEGAÇÃO ──────────────────────────────────────────────────────────
    const TELAS = {
        inicio: { titulo: "Início", sub: () => cap(new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })), render: () => renderInicio() },
        agenda: { titulo: "Agenda de banho e tosa", sub: () => "Toque num dia para ver e organizar os atendimentos", render: () => renderAgenda() },
        estoque: { titulo: "Estoque", sub: () => "Preços, quantidades e o que aparece na loja", render: () => renderEstoque() },
        servicos: { titulo: "Serviços de banho e tosa", sub: () => "Valores por porte e adicionais", render: () => renderServicos() },
        config: { titulo: "Ajustes", sub: () => "Dados da loja, entrega e horários da agenda", render: () => renderConfig() },
    };
    let telaAtual = "inicio";
    const irPara = (tela) => {
        if (!TELAS[tela]) tela = "inicio";
        telaAtual = tela;
        Object.keys(TELAS).forEach((t) => { $(`#tela-${t}`).hidden = t !== tela; });
        $$("#menu button").forEach((b) => b.classList.toggle("ativo", b.dataset.tela === tela));
        $("#titulo-tela").textContent = TELAS[tela].titulo;
        $("#sub-tela").textContent = TELAS[tela].sub();
        $("#topo-acoes").innerHTML = acoesTopo(tela);
        history.replaceState(null, "", `#${tela}`);
        TELAS[tela].render();
        window.scrollTo({ top: 0 });
    };
    const acoesTopo = (tela) => {
        const sair = `<a class="btn btn-claro btn-sm topo-mobile-sair" href="index.html" target="_blank"><i class="fa-solid fa-store"></i> Loja</a>`;
        if (tela === "agenda" || tela === "inicio") return `${sair}<button class="btn btn-teal btn-sm" data-acao="novo-ag"><i class="fa-solid fa-plus"></i> Novo agendamento</button>`;
        if (tela === "estoque") return `${sair}<button class="btn btn-teal btn-sm" data-acao="novo-prod"><i class="fa-solid fa-plus"></i> Novo produto</button>`;
        return sair;
    };
    $("#menu").addEventListener("click", (e) => { const b = e.target.closest("button[data-tela]"); if (b) irPara(b.dataset.tela); });

    const atualizarContadores = () => {
        const pend = db.agendamentos.filter((a) => a.status === "pendente" && a.data >= hojeISO()).length;
        const baixo = db.produtos.filter(estoqueBaixo).length;
        $("#cont-pendentes").textContent = pend; $("#cont-pendentes").hidden = !pend;
        $("#cont-baixo").textContent = baixo; $("#cont-baixo").hidden = !baixo;
    };

    // ─── GRÁFICOS SIMPLES (uma série, uma cor, dica ao passar o dedo/mouse) ─
    const dica = $("#dica");
    document.addEventListener("pointerover", (e) => {
        const alvo = e.target.closest("[data-dica]");
        if (!alvo) { dica.hidden = true; return; }
        dica.innerHTML = alvo.dataset.dica; dica.hidden = false;
        const r = alvo.getBoundingClientRect();
        const w = dica.offsetWidth;
        dica.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
        dica.style.top = `${Math.max(8, r.top - dica.offsetHeight - 8)}px`;
    });
    document.addEventListener("scroll", () => { dica.hidden = true; }, { passive: true });

    const graficoColunas = (el, dados) => {
        // dados: [{ rotulo, valor, dica, classe }]
        const max = Math.max(1, ...dados.map((d) => d.valor));
        const passo = max <= 5 ? 1 : max <= 12 ? 2 : max <= 30 ? 5 : 10;
        const topo = Math.ceil(max / passo) * passo;
        const guias = [];
        for (let v = passo; v <= topo; v += passo) guias.push(v);
        const passoR = Math.ceil(dados.length / 7), ult = dados.length - 1;
        const mostrarRotulo = (i) => dados.length <= 10 || i === ult || (i % passoR === 0 && ult - i >= passoR);
        el.innerHTML = `
            <div class="graf-area">
                ${guias.map((v) => `<div class="graf-linha-guia" style="bottom:${(v / topo) * 100}%"><span>${v}</span></div>`).join("")}
                ${dados.map((d) => `<div class="graf-col" data-dica="${plEsc(d.dica)}"><div class="graf-barra ${d.classe || ""}" style="height:${(d.valor / topo) * 100}%"></div></div>`).join("")}
            </div>
            <div class="graf-eixo">${dados.map((d, i) => `<span>${mostrarRotulo(i) ? d.rotulo : ""}</span>`).join("")}</div>`;
    };
    const barrasHorizontais = (el, dados, formato = (v) => v) => {
        if (!dados.length) { el.innerHTML = `<p class="vazio-peq">Ainda sem dados.</p>`; return; }
        const max = Math.max(...dados.map((d) => d.valor));
        el.innerHTML = dados.map((d) => `
            <div class="bh" data-dica="${plEsc(d.dica || `${d.nome}: ${formato(d.valor)}`)}">
                <span class="bh-nome">${plEsc(d.nome)}</span>
                <span class="bh-trilho"><span class="bh-barra" style="width:${(d.valor / max) * 100}%;display:block"></span></span>
                <b>${formato(d.valor)}</b>
            </div>`).join("");
    };

    // ─── INÍCIO ─────────────────────────────────────────────────────────────
    const renderInicio = () => {
        const hoje = hojeISO();
        const agHoje = db.agendamentos.filter((a) => a.data === hoje && !["cancelado"].includes(a.status));
        const d7 = new Date(); d7.setDate(d7.getDate() + 7);
        const prox7 = db.agendamentos.filter((a) => a.data > hoje && a.data <= plDataISO(d7) && ["pendente", "confirmado"].includes(a.status));
        const pendentes = db.agendamentos.filter((a) => a.status === "pendente" && a.data >= hoje);
        const d30 = new Date(); d30.setDate(d30.getDate() - 29); d30.setHours(0, 0, 0, 0);
        const ped30 = db.pedidos.filter((p) => new Date(p.data) >= d30);
        const baixo = db.produtos.filter(estoqueBaixo);
        const previstoHoje = agHoje.filter((a) => a.status !== "faltou").reduce((s, a) => s + valorAg(a), 0);

        $("#kpis").innerHTML = `
            <button class="kpi" data-ir="agenda" style="--c:var(--teal)"><span><i class="fa-solid fa-shower"></i> Banhos hoje</span><strong>${agHoje.length}</strong><small>${plMoeda(previstoHoje)} previstos</small></button>
            <button class="kpi" data-ir="agenda" style="--c:var(--amarelo-700)"><span><i class="fa-solid fa-hourglass-half"></i> A confirmar</span><strong>${pendentes.length}</strong><small>pedidos de horário pelo site</small></button>
            <button class="kpi" data-ir="agenda" style="--c:var(--teal-700)"><span><i class="fa-solid fa-calendar-week"></i> Próximos 7 dias</span><strong>${prox7.length}</strong><small>agendamentos</small></button>
            <div class="kpi" style="--c:var(--verde)"><span><i class="fa-brands fa-whatsapp"></i> Pedidos pelo site</span><strong>${ped30.length}</strong><small>${plMoeda(ped30.reduce((s, p) => s + p.total, 0))} em 30 dias</small></div>
            <button class="kpi" data-ir="estoque" data-filtro="baixo" style="--c:var(--rosa)"><span><i class="fa-solid fa-box-open"></i> Estoque baixo</span><strong>${baixo.length}</strong><small>produtos para repor</small></button>`;

        // Atendimentos por dia (últimos 30 dias)
        const dias = [];
        for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dias.push(d); }
        graficoColunas($("#graf-banhos"), dias.map((d) => {
            const iso = plDataISO(d);
            const lista = db.agendamentos.filter((a) => a.data === iso && ["concluido", "confirmado"].includes(a.status));
            const fat = lista.reduce((s, a) => s + valorAg(a), 0);
            return { rotulo: `${d.getDate()}/${d.getMonth() + 1}`, valor: lista.length, classe: iso === hoje ? "hoje" : "", dica: `<b>${DIAS_CURTO[d.getDay()]} ${d.toLocaleDateString("pt-BR")}</b><br>${lista.length} atendimentos · ${plMoeda(fat)}` };
        }));
        graficoColunas($("#graf-pedidos"), dias.map((d) => {
            const iso = plDataISO(d);
            const lista = db.pedidos.filter((p) => plDataISO(new Date(p.data)) === iso);
            return { rotulo: `${d.getDate()}/${d.getMonth() + 1}`, valor: lista.length, classe: iso === hoje ? "hoje" : "", dica: `<b>${DIAS_CURTO[d.getDay()]} ${d.toLocaleDateString("pt-BR")}</b><br>${lista.length} pedidos · ${plMoeda(lista.reduce((s, p) => s + p.total, 0))}` };
        }));

        // Serviços mais pedidos no mês
        const mes = hoje.slice(0, 7);
        const contServ = {};
        db.agendamentos.filter((a) => a.data.startsWith(mes) && a.status !== "cancelado").forEach((a) => { contServ[a.servico] = (contServ[a.servico] || 0) + 1; });
        barrasHorizontais($("#graf-servicos"), Object.entries(contServ).map(([id, v]) => ({ nome: servico(id).nome, valor: v })).sort((a, b) => b.valor - a.valor), (v) => v);

        // Produtos mais pedidos no site
        const contProd = {};
        ped30.forEach((p) => p.itens.forEach((it) => { const n = (db.produtos.find((x) => x.id === it.id) || { nome: it.nome }).nome; contProd[n] = (contProd[n] || 0) + it.qtd; }));
        barrasHorizontais($("#graf-produtos"), Object.entries(contProd).map(([nome, v]) => ({ nome, valor: v, dica: `${nome}: ${v} unidades` })).sort((a, b) => b.valor - a.valor).slice(0, 6), (v) => v);

        // Agenda de hoje
        const ordenados = agHoje.sort((a, b) => a.hora.localeCompare(b.hora));
        $("#lista-hoje").innerHTML = ordenados.length ? ordenados.map((a) => {
            const st = PL_STATUS_AG[a.status];
            return `<div class="linha-lista"><span class="hora-tag">${a.hora}</span><div class="info"><strong>${plEsc(a.nomePet)} <small>· ${plEsc(a.raca || a.especie)} ${porteNome(a.porte).toLowerCase()}</small></strong><small>${plEsc(servico(a.servico).nome)} · ${plEsc(nomeLoja(a.loja))}</small></div><span class="status" style="--c:${st.cor}">${st.curto}</span></div>`;
        }).join("") + `<button class="btn btn-claro btn-sm" data-ir="agenda" style="margin-top:10px">Abrir agenda</button>` : `<p class="vazio-peq">Nenhum atendimento hoje.</p>`;

        // Estoque baixo
        $("#lista-baixo").innerHTML = baixo.length ? baixo.slice(0, 6).map((p) => {
            const c = categoria(p.categoria);
            return `<div class="linha-lista">${p.imagem ? `<img class="mini" src="${plEsc(p.imagem)}" alt="">` : `<span class="mini" style="color:${c.cor}"><i class="fa-solid ${c.icone}"></i></span>`}<div class="info"><strong>${plEsc(p.nome)}</strong><small>Mínimo: ${p.estoqueMin}</small></div><span class="status" style="--c:${plEstoqueTotal(p) <= 0 ? "#B9505A" : "#C98A00"}">${plEstoqueTotal(p) <= 0 ? "Esgotado" : `${plEstoqueTotal(p)} un.`}</span></div>`;
        }).join("") + `<button class="btn btn-claro btn-sm" data-ir="estoque" data-filtro="baixo" style="margin-top:10px">Ver todos</button>` : `<p class="vazio-peq"><i class="fa-solid fa-circle-check" style="color:var(--verde)"></i> Estoque em dia!</p>`;
    };

    // ─── AGENDA ─────────────────────────────────────────────────────────────
    const agState = { mes: new Date(), dia: hojeISO(), loja: "" };
    agState.mes.setDate(1);

    const agsDoDia = (iso) => db.agendamentos.filter((a) => a.data === iso && (!agState.loja || a.loja === agState.loja));
    const diaFechado = (iso) => !cfg().agenda.diasSemana.includes(plParseData(iso).getDay()) || (cfg().agenda.diasFechados || []).includes(iso);

    const renderAgenda = () => {
        const m = agState.mes;
        $("#mes-titulo").textContent = cap(m.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
        $("#filtro-lojas").innerHTML = `<button class="pilula ${!agState.loja ? "ativo" : ""}" data-flj="">Todas as lojas</button>` +
            cfg().lojas.filter((l) => cfg().agenda.lojasComBanho.includes(l.id)).map((l) => `<button class="pilula ${agState.loja === l.id ? "ativo" : ""}" data-flj="${l.id}">${plEsc(l.nome)}</button>`).join("");
        const inicio = new Date(m.getFullYear(), m.getMonth(), 1);
        inicio.setDate(1 - inicio.getDay());
        const hoje = hojeISO();
        let html = "";
        for (let i = 0; i < 42; i++) {
            const d = new Date(inicio); d.setDate(inicio.getDate() + i);
            if (i >= 35 && d.getMonth() !== m.getMonth()) break;
            const iso = plDataISO(d);
            const lista = agsDoDia(iso).filter((a) => a.status !== "cancelado");
            const pend = lista.filter((a) => a.status === "pendente").length;
            const cls = [d.getMonth() !== m.getMonth() ? "fora" : "", iso === hoje ? "hoje" : "", iso === agState.dia ? "selecionado" : "", diaFechado(iso) ? "fechado" : ""].join(" ");
            html += `<button class="cal-dia ${cls}" data-dia="${iso}" data-dica="${lista.length ? `${lista.length} agendamentos${pend ? ` · ${pend} a confirmar` : ""}` : diaFechado(iso) ? "Fechado" : "Livre"}">
                <span class="num">${d.getDate()}</span>
                ${lista.length ? `<span class="cal-qtd">${lista.length} <small>pets</small></span>` : ""}
                ${pend ? `<span class="cal-pend">${pend} a confirmar</span>` : ""}
                <span class="cal-pontos">${lista.slice(0, 10).map((a) => `<i style="--c:${PL_STATUS_AG[a.status].cor}"></i>`).join("")}</span>
            </button>`;
        }
        $("#calendario").innerHTML = html;
        $("#legenda").innerHTML = Object.values(PL_STATUS_AG).map((s) => `<span><i style="--c:${s.cor}"></i>${s.curto}</span>`).join("") + `<span><i style="--c:#d9d4ca"></i>Fechado</span>`;
        renderDia();
    };

    const renderDia = () => {
        const iso = agState.dia;
        const d = plParseData(iso);
        const lista = agsDoDia(iso).sort((a, b) => a.hora.localeCompare(b.hora) || a.loja.localeCompare(b.loja));
        const ativos = lista.filter((a) => !["cancelado", "faltou"].includes(a.status));
        const fechado = diaFechado(iso);
        const porSemana = !cfg().agenda.diasSemana.includes(d.getDay());
        const total = ativos.reduce((s, a) => s + valorAg(a), 0);
        const vagasTotais = fechado ? 0 : plHorariosDoDia(cfg().agenda).length * cfg().agenda.vagasPorHorario * (agState.loja ? 1 : cfg().agenda.lojasComBanho.length);
        $("#dia-painel").innerHTML = `
            <div class="dia-topo">
                <div><h2>${cap(d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }))}</h2></div>
                <button class="btn btn-teal btn-sm" data-acao="novo-ag" data-data="${iso}"><i class="fa-solid fa-plus"></i> Agendar</button>
            </div>
            <div class="dia-resumo">
                <span><b>${ativos.length}</b> pets</span>
                <span>Previsto <b>${plMoeda(total)}</b></span>
                <span>Vagas livres <b>${Math.max(0, vagasTotais - ativos.length)}</b></span>
                ${porSemana ? `<span>Loja não abre neste dia da semana</span>` : `<label class="check" style="font-size:.8rem"><input type="checkbox" data-fechar-dia="${iso}" ${fechado ? "checked" : ""}> Fechar o dia para agendamentos</label>`}
            </div>
            ${lista.length ? lista.map(cardAgendamento).join("") : `<p class="vazio-peq"><i class="fa-regular fa-calendar"></i> ${fechado ? "Dia fechado." : "Nenhum agendamento neste dia."}</p>`}`;
    };

    const cardAgendamento = (a) => {
        const st = PL_STATUS_AG[a.status];
        const adic = db.adicionais.filter((x) => (a.adicionais || []).includes(x.id)).map((x) => x.nome);
        const acoes = [];
        if (a.status === "pendente") acoes.push(`<button class="btn btn-whats" data-ag="${a.id}" data-st="confirmado"><i class="fa-brands fa-whatsapp"></i> Confirmar</button>`);
        if (["pendente", "confirmado"].includes(a.status)) acoes.push(`<button class="btn btn-teal" data-ag="${a.id}" data-st="concluido"><i class="fa-solid fa-paw"></i> Pet pronto</button>`);
        if (a.status === "confirmado") acoes.push(`<button class="btn btn-claro" data-ag="${a.id}" data-st="faltou">Faltou</button>`);
        if (["pendente", "confirmado"].includes(a.status)) acoes.push(`<button class="btn btn-perigo" data-ag="${a.id}" data-st="cancelado">Cancelar</button>`);
        if (["concluido", "faltou", "cancelado"].includes(a.status)) acoes.push(`<button class="btn btn-claro" data-ag="${a.id}" data-st="confirmado"><i class="fa-solid fa-rotate-left"></i> Reabrir</button>`);
        acoes.push(`<a class="btn btn-claro" href="${plLinkWhats("55" + plSoNumeros(a.telefone), `Olá, ${a.tutor.split(" ")[0]}! Aqui é da Pet Life 🐾`)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Conversar</a>`);
        acoes.push(`<button class="btn btn-claro" data-editar-ag="${a.id}"><i class="fa-solid fa-pen"></i> Editar</button>`);
        return `
        <div class="ag-card" style="--c:${st.cor}">
            <div class="ag-card-topo">
                <span class="ag-hora">${a.hora}</span>
                <div class="info">
                    <div class="ag-pet">${plEsc(a.nomePet)} <small>· ${plEsc(a.raca || a.especie)} · ${porteNome(a.porte).toLowerCase()}</small></div>
                    <div class="ag-serv">${plEsc(servico(a.servico).nome)}${adic.length ? ` + ${plEsc(adic.join(", "))}` : ""}</div>
                </div>
                <div style="text-align:right"><span class="status" style="--c:${st.cor}"><i class="fa-solid ${st.icone}"></i> ${st.curto}</span><div class="ag-valor">${plMoeda(valorAg(a))}</div></div>
            </div>
            <div class="ag-det">
                <span><i class="fa-solid fa-user"></i> ${plEsc(a.tutor)} · ${plEsc(a.telefone)}</span>
                <span><i class="fa-solid fa-store"></i> ${plEsc(nomeLoja(a.loja))}</span>
                <span><i class="fa-solid ${a.origem === "site" ? "fa-globe" : "fa-phone"}"></i> ${a.origem === "site" ? "Pelo site" : "Balcão/telefone"}</span>
            </div>
            ${a.observacoes ? `<div class="ag-obs"><i class="fa-solid fa-note-sticky"></i> ${plEsc(a.observacoes)}</div>` : ""}
            <div class="ag-acoes">${acoes.join("")}</div>
        </div>`;
    };

    const mudarStatus = (id, status) => {
        const a = db.agendamentos.find((x) => x.id === id);
        if (!a) return;
        if (status === "cancelado" && !confirm(`Cancelar o horário de ${a.nomePet}?`)) return;
        a.status = status;
        salvar(); renderAgenda();
        const primeiro = a.tutor.split(" ")[0];
        const dataTxt = plParseData(a.data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
        const loja = cfg().lojas.find((l) => l.id === a.loja);
        let msg = "";
        if (status === "confirmado") msg = `Olá, ${primeiro}! 🐾 Confirmamos o ${servico(a.servico).nome.toLowerCase()} do(a) ${a.nomePet} para ${dataTxt} às ${a.hora}, na ${loja.nome} (${loja.endereco}). Valor: ${plMoeda(valorAg(a))}. Até lá!`;
        if (status === "concluido") msg = `Olá, ${primeiro}! O(a) ${a.nomePet} já está prontinho(a) e cheiroso(a) 🛁✨ Pode vir buscar na ${loja.nome}. Total: ${plMoeda(valorAg(a))}.`;
        if (status === "cancelado") msg = `Olá, ${primeiro}. O horário do(a) ${a.nomePet} em ${dataTxt} às ${a.hora} foi cancelado. Quer remarcar para outro dia?`;
        if (msg && plSoNumeros(a.telefone).length >= 10) {
            const url = plLinkWhats("55" + plSoNumeros(a.telefone), msg);
            if (confirm("Status atualizado! Quer avisar o cliente pelo WhatsApp?")) window.open(url, "_blank", "noopener");
        } else toast("Status atualizado.");
    };

    // Modal de agendamento (novo ou edição)
    const modalAgendamento = (a = null, dataInicial = null) => {
        const novo = !a;
        const ag = a ? { ...a, adicionais: [...(a.adicionais || [])] } : {
            data: dataInicial || agState.dia || hojeISO(), hora: "", loja: agState.loja || cfg().agenda.lojasComBanho[0], nomePet: "", especie: "Cão", raca: "", porte: "P",
            servico: "banho", adicionais: [], tutor: "", telefone: "", observacoes: "", origem: "balcao", status: "confirmado",
        };
        const opcoesHora = () => plHorariosDoDia(cfg().agenda).map((h) => {
            const usados = db.agendamentos.filter((x) => x.data === ag.data && x.hora === h && x.loja === ag.loja && x.id !== ag.id && !["cancelado", "faltou"].includes(x.status)).length;
            const livres = cfg().agenda.vagasPorHorario - usados;
            return `<option value="${h}" ${ag.hora === h ? "selected" : ""}>${h} — ${livres > 0 ? `${livres} vaga${livres > 1 ? "s" : ""}` : "lotado (encaixe)"}</option>`;
        }).join("");
        abrirModal(`
            <h2>${novo ? "Novo agendamento" : `Editar · ${plEsc(a.nomePet)}`}</h2>
            <form id="form-ag">
                <div class="linha-2">
                    <label class="campo">Nome do pet<input name="nomePet" required value="${plEsc(ag.nomePet)}"></label>
                    <label class="campo">Raça<input name="raca" value="${plEsc(ag.raca)}"></label>
                    <label class="campo">Espécie<select name="especie"><option ${ag.especie === "Cão" ? "selected" : ""}>Cão</option><option ${ag.especie === "Gato" ? "selected" : ""}>Gato</option></select></label>
                    <label class="campo">Porte<select name="porte">${PL_PORTES.map((p) => `<option value="${p.id}" ${ag.porte === p.id ? "selected" : ""}>${p.nome} (${p.dica})</option>`).join("")}</select></label>
                    <label class="campo">Serviço<select name="servico">${db.servicos.map((s) => `<option value="${s.id}" ${ag.servico === s.id ? "selected" : ""}>${plEsc(s.nome)}</option>`).join("")}</select></label>
                    <label class="campo">Loja<select name="loja">${cfg().lojas.filter((l) => cfg().agenda.lojasComBanho.includes(l.id)).map((l) => `<option value="${l.id}" ${ag.loja === l.id ? "selected" : ""}>${plEsc(l.nome)}</option>`).join("")}</select></label>
                    <label class="campo">Dia<input type="date" name="data" required value="${ag.data}"></label>
                    <label class="campo">Horário<select name="hora" required>${opcoesHora()}</select></label>
                </div>
                <p class="campo" style="margin-bottom:6px">Adicionais</p>
                <div class="dias-semana">${db.adicionais.map((x) => `<label><input type="checkbox" name="adic" value="${x.id}" ${ag.adicionais.includes(x.id) ? "checked" : ""}>${plEsc(x.nome)} +${plMoeda(x.preco)}</label>`).join("")}</div>
                <div class="linha-2">
                    <label class="campo">Tutor<input name="tutor" required value="${plEsc(ag.tutor)}"></label>
                    <label class="campo">WhatsApp<input name="telefone" inputmode="tel" value="${plEsc(ag.telefone)}"></label>
                    <label class="campo">Situação<select name="status">${Object.entries(PL_STATUS_AG).map(([k, s]) => `<option value="${k}" ${ag.status === k ? "selected" : ""}>${s.nome}</option>`).join("")}</select></label>
                    <label class="campo">Valor<input disabled id="ag-valor-prev" value="${plMoeda(valorAg(ag))}"></label>
                </div>
                <label class="campo">Observações<textarea name="observacoes" rows="2">${plEsc(ag.observacoes)}</textarea></label>
                <div class="modal-rodape">
                    ${novo ? "" : `<button type="button" class="btn btn-perigo" id="excluir-ag"><i class="fa-solid fa-trash"></i> Excluir</button>`}
                    <div class="dir"><button type="button" class="btn btn-claro" data-fechar>Cancelar</button><button class="btn btn-teal"><i class="fa-solid fa-check"></i> Salvar</button></div>
                </div>
            </form>`);
        const f = $("#form-ag");
        const ler = () => {
            const fd = new FormData(f);
            ["nomePet", "raca", "especie", "porte", "servico", "loja", "data", "hora", "tutor", "telefone", "status", "observacoes"].forEach((k) => { ag[k] = String(fd.get(k) ?? "").trim(); });
            ag.adicionais = fd.getAll("adic");
        };
        f.addEventListener("change", (e) => {
            ler();
            if (["data", "loja"].includes(e.target.name)) f.hora.innerHTML = opcoesHora();
            $("#ag-valor-prev").value = plMoeda(valorAg(ag));
        });
        f.addEventListener("submit", (e) => {
            e.preventDefault(); ler();
            if (!ag.nomePet || !ag.tutor || !ag.data || !ag.hora) { toast("Preencha pet, tutor, dia e horário."); return; }
            if (novo) { ag.id = Math.max(0, ...db.agendamentos.map((x) => x.id)) + 1; ag.criadoEm = new Date().toISOString(); db.agendamentos.push(ag); }
            else Object.assign(db.agendamentos.find((x) => x.id === a.id), ag);
            salvar(); fecharModal();
            agState.dia = ag.data; agState.mes = plParseData(ag.data); agState.mes.setDate(1);
            if (telaAtual !== "agenda") irPara("agenda"); else renderAgenda();
            toast(novo ? "Agendamento criado!" : "Agendamento salvo.");
        });
        if (!novo) $("#excluir-ag").onclick = () => {
            if (!confirm("Excluir este agendamento? (para manter o histórico, prefira Cancelar)")) return;
            db.agendamentos = db.agendamentos.filter((x) => x.id !== a.id); salvar(); fecharModal(); renderAgenda();
        };
    };

    $("#mes-ant").onclick = () => { agState.mes.setMonth(agState.mes.getMonth() - 1); renderAgenda(); };
    $("#mes-prox").onclick = () => { agState.mes.setMonth(agState.mes.getMonth() + 1); renderAgenda(); };
    $("#mes-hoje").onclick = () => { agState.mes = new Date(); agState.mes.setDate(1); agState.dia = hojeISO(); renderAgenda(); };

    // ─── ESTOQUE ────────────────────────────────────────────────────────────
    const estState = { busca: "", cat: "", filtro: "" };
    const renderEstoque = () => {
        $("#est-cat").innerHTML = `<option value="">Todas as categorias</option>` + db.categorias.map((c) => `<option value="${c.id}" ${estState.cat === c.id ? "selected" : ""}>${plEsc(c.nome)}</option>`).join("");
        $("#est-filtro").value = estState.filtro;
        const ativos = db.produtos.filter((p) => p.ativo);
        const unidades = ativos.reduce((s, p) => s + plEstoqueTotal(p), 0);
        const valor = ativos.reduce((s, p) => s + (p.variacoes && p.variacoes.length ? p.variacoes.reduce((a, v) => a + v.preco * v.estoque, 0) : p.preco * p.estoque), 0);
        const baixo = db.produtos.filter(estoqueBaixo).length;
        $("#kpis-estoque").innerHTML = `
            <div class="kpi"><span>Produtos na loja</span><strong>${ativos.length}</strong><small>${db.produtos.length - ativos.length} ocultos</small></div>
            <div class="kpi" style="--c:var(--teal-700)"><span>Unidades em estoque</span><strong>${unidades}</strong><small>somando tudo</small></div>
            <div class="kpi" style="--c:var(--verde)"><span>Valor em estoque</span><strong style="font-size:1.35rem">${plMoeda(valor)}</strong><small>pelo preço de venda</small></div>
            <button class="kpi" data-filtro-est="baixo" style="--c:var(--rosa)"><span>Para repor</span><strong>${baixo}</strong><small>no mínimo ou abaixo</small></button>`;
        renderListaEstoque();
    };
    const renderListaEstoque = () => {
        const n = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        let lista = db.produtos.slice();
        if (estState.busca) lista = lista.filter((p) => n(p.nome + " " + p.unidade).includes(n(estState.busca)));
        if (estState.cat) lista = lista.filter((p) => p.categoria === estState.cat);
        if (estState.filtro === "baixo") lista = lista.filter(estoqueBaixo);
        if (estState.filtro === "zerado") lista = lista.filter((p) => plEstoqueTotal(p) <= 0);
        if (estState.filtro === "oculto") lista = lista.filter((p) => !p.ativo);
        lista.sort((a, b) => (estoqueBaixo(b) ? 1 : 0) - (estoqueBaixo(a) ? 1 : 0) || a.nome.localeCompare(b.nome));
        const passo = (attrs, valor) => `<span class="passo"><button type="button" data-d="-1" ${attrs} aria-label="Menos">−</button><input type="number" min="0" value="${valor}" ${attrs} aria-label="Quantidade"><button type="button" data-d="1" ${attrs} aria-label="Mais">+</button></span>`;
        $("#lista-estoque").innerHTML = lista.length ? lista.map((p) => {
            const c = categoria(p.categoria);
            const tot = plEstoqueTotal(p);
            const st = !p.ativo ? ["Oculto", "#8A8F98"] : tot <= 0 ? ["Esgotado", "#B9505A"] : estoqueBaixo(p) ? ["Repor", "#C98A00"] : ["OK", "#3C8D5A"];
            const varios = p.variacoes && p.variacoes.length;
            return `
            <div class="prod-linha ${p.ativo ? "" : "oculto"}">
                ${p.imagem ? `<img class="prod-foto" src="${plEsc(p.imagem)}" alt="">` : `<span class="prod-foto" style="--c:${c.cor}"><i class="fa-solid ${c.icone}"></i></span>`}
                <div class="prod-nome"><strong>${plEsc(p.nome)}</strong><small>${plEsc(c.nome)} · ${plEsc(p.unidade)} · mín. ${p.estoqueMin}</small></div>
                <div class="prod-preco">${varios ? `<span style="font-size:.78rem;color:var(--suave)">a partir de</span> ` : ""}${plMoeda(plPrecoMin(p))}${p.precoAntigo && !varios ? `<small>${plMoeda(p.precoAntigo)}</small>` : ""}</div>
                <div class="prod-est">${varios ? `<div class="var-lista">${p.variacoes.map((v, i) => `<span class="var-item">${plEsc(v.nome)} ${passo(`data-pid="${p.id}" data-vi="${i}"`, v.estoque)}</span>`).join("")}</div>` : passo(`data-pid="${p.id}"`, p.estoque)}</div>
                <span class="status prod-status" style="--c:${st[1]}">${st[0]}${varios ? ` · ${tot}` : ""}</span>
                <div class="prod-acoes"><button class="btn-ico" data-editar-prod="${p.id}" aria-label="Editar" data-dica="Editar"><i class="fa-solid fa-pen"></i></button><button class="btn-ico" data-visivel="${p.id}" aria-label="${p.ativo ? "Ocultar" : "Mostrar"} na loja" data-dica="${p.ativo ? "Ocultar da loja" : "Mostrar na loja"}"><i class="fa-solid ${p.ativo ? "fa-eye" : "fa-eye-slash"}"></i></button></div>
            </div>`;
        }).join("") : `<p class="vazio-peq">Nenhum produto encontrado.</p>`;
    };
    const ajustarEstoque = (pid, vi, novo) => {
        const p = db.produtos.find((x) => x.id === pid);
        const alvo = vi !== undefined && vi !== "" ? p.variacoes[Number(vi)] : p;
        alvo.estoque = Math.max(0, Math.round(Number(novo) || 0));
        salvar();
    };
    $("#lista-estoque").addEventListener("click", (e) => {
        const b = e.target.closest("button[data-d]");
        if (b) {
            const inp = b.parentElement.querySelector("input");
            inp.value = Math.max(0, Number(inp.value) + Number(b.dataset.d));
            ajustarEstoque(Number(b.dataset.pid), b.dataset.vi, inp.value);
            clearTimeout(renderListaEstoque.t); renderListaEstoque.t = setTimeout(renderEstoque, 900);
        }
    });
    $("#lista-estoque").addEventListener("change", (e) => {
        if (e.target.matches("input[data-pid]")) { ajustarEstoque(Number(e.target.dataset.pid), e.target.dataset.vi, e.target.value); renderEstoque(); toast("Estoque atualizado."); }
    });
    $("#est-busca").addEventListener("input", (e) => { estState.busca = e.target.value; renderListaEstoque(); });
    $("#est-cat").addEventListener("change", (e) => { estState.cat = e.target.value; renderListaEstoque(); });
    $("#est-filtro").addEventListener("change", (e) => { estState.filtro = e.target.value; renderListaEstoque(); });

    // Foto: reduz no navegador antes de salvar (mantém a arte inteira)
    const reduzirFoto = (arquivo) => new Promise((ok, erro) => {
        const leitor = new FileReader();
        leitor.onload = () => {
            const img = new Image();
            img.onload = () => {
                const max = 700, esc = Math.min(1, max / Math.max(img.width, img.height));
                const cv = document.createElement("canvas");
                cv.width = Math.round(img.width * esc); cv.height = Math.round(img.height * esc);
                cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
                ok(cv.toDataURL("image/jpeg", .82));
            };
            img.onerror = erro; img.src = leitor.result;
        };
        leitor.onerror = erro; leitor.readAsDataURL(arquivo);
    });

    const modalProduto = (p = null) => {
        const novo = !p;
        const prod = p ? JSON.parse(JSON.stringify(p)) : { id: Math.max(0, ...db.produtos.map((x) => x.id)) + 1, nome: "", unidade: "", categoria: db.categorias[0].id, preco: 0, precoAntigo: null, estoque: 0, estoqueMin: 2, imagem: "", ativo: true, destaque: false, selo: "", variacoes: null, descricao: "" };
        let vars = prod.variacoes ? prod.variacoes.map((v) => ({ ...v })) : [];
        const desenharVars = () => {
            $("#vars").innerHTML = vars.length ? `<div class="var-edit var-cab"><span>Opção (tamanho/peso)</span><span>Preço</span><span>Estoque</span><span></span></div>` + vars.map((v, i) => `
                <div class="var-edit"><input data-v="${i}" data-k="nome" value="${plEsc(v.nome)}" placeholder="Ex.: 10 kg"><input data-v="${i}" data-k="preco" type="number" step="0.01" min="0" value="${v.preco}"><input data-v="${i}" data-k="estoque" type="number" min="0" value="${v.estoque}"><button type="button" class="btn-ico" data-remover-var="${i}" aria-label="Remover"><i class="fa-solid fa-xmark"></i></button></div>`).join("") : "";
            $("#campos-simples").hidden = vars.length > 0;
        };
        abrirModal(`
            <h2>${novo ? "Novo produto" : "Editar produto"}</h2>
            <form id="form-prod">
                <div class="foto-edit">
                    ${prod.imagem ? `<img class="prod-foto" id="foto-prev" src="${plEsc(prod.imagem)}" alt="">` : `<span class="prod-foto" id="foto-prev"><i class="fa-solid fa-image"></i></span>`}
                    <div><label class="btn btn-claro btn-sm"><i class="fa-solid fa-camera"></i> ${prod.imagem ? "Trocar foto" : "Enviar foto"}<input type="file" accept="image/*" id="foto-arq" hidden></label>
                    <p class="painel-sub" style="margin-top:6px">A foto aparece inteira na loja (sem cortar preço ou arte).</p></div>
                </div>
                <label class="campo">Nome<input name="nome" required value="${plEsc(prod.nome)}"></label>
                <div class="linha-2">
                    <label class="campo">Detalhe / embalagem<input name="unidade" value="${plEsc(prod.unidade)}" placeholder="Ex.: 15 kg"></label>
                    <label class="campo">Categoria<select name="categoria">${db.categorias.map((c) => `<option value="${c.id}" ${prod.categoria === c.id ? "selected" : ""}>${plEsc(c.nome)}</option>`).join("")}</select></label>
                </div>
                <div id="campos-simples" class="linha-2">
                    <label class="campo">Preço (R$)<input name="preco" type="number" step="0.01" min="0" value="${prod.preco}"></label>
                    <label class="campo">Preço "de" (riscado) <small>opcional</small><input name="precoAntigo" type="number" step="0.01" min="0" value="${prod.precoAntigo || ""}"></label>
                    <label class="campo">Estoque<input name="estoque" type="number" min="0" value="${prod.estoque}"></label>
                </div>
                <div class="linha-2">
                    <label class="campo">Avisar quando chegar a<input name="estoqueMin" type="number" min="0" value="${prod.estoqueMin}"></label>
                    <label class="campo">Selo no card <small>opcional</small><input name="selo" value="${plEsc(prod.selo)}" list="selos" placeholder="Ex.: Promoção"><datalist id="selos"><option>Black Friday</option><option>Promoção</option><option>Novidade</option><option>Oferta</option></datalist></label>
                </div>
                <p class="campo" style="margin:4px 0 6px">Opções de tamanho/peso <small>(cada uma com preço e estoque)</small></p>
                <div id="vars"></div>
                <button type="button" class="btn btn-claro btn-sm" id="add-var" style="margin-bottom:12px"><i class="fa-solid fa-plus"></i> Adicionar opção</button>
                <label class="campo">Descrição<textarea name="descricao" rows="2">${plEsc(prod.descricao)}</textarea></label>
                <div style="display:flex;gap:18px;flex-wrap:wrap">
                    <label class="check"><input type="checkbox" name="ativo" ${prod.ativo ? "checked" : ""}> Mostrar na loja</label>
                    <label class="check"><input type="checkbox" name="destaque" ${prod.destaque ? "checked" : ""}> Destaque</label>
                </div>
                <div class="modal-rodape">
                    ${novo ? "" : `<button type="button" class="btn btn-perigo" id="excluir-prod"><i class="fa-solid fa-trash"></i> Excluir</button>`}
                    <div class="dir"><button type="button" class="btn btn-claro" data-fechar>Cancelar</button><button class="btn btn-teal"><i class="fa-solid fa-check"></i> Salvar</button></div>
                </div>
            </form>`);
        desenharVars();
        $("#add-var").onclick = () => { vars.push({ nome: "", preco: Number($("#form-prod").preco.value) || 0, estoque: 0 }); desenharVars(); };
        $("#vars").addEventListener("input", (e) => { const t = e.target; if (t.dataset.v !== undefined) vars[Number(t.dataset.v)][t.dataset.k] = t.dataset.k === "nome" ? t.value : Number(t.value); });
        $("#vars").addEventListener("click", (e) => { const b = e.target.closest("[data-remover-var]"); if (b) { vars.splice(Number(b.dataset.removerVar), 1); desenharVars(); } });
        $("#foto-arq").onchange = async (e) => {
            const arq = e.target.files[0]; if (!arq) return;
            try { prod.imagem = await reduzirFoto(arq); $("#foto-prev").outerHTML = `<img class="prod-foto" id="foto-prev" src="${prod.imagem}" alt="">`; }
            catch (er) { toast("Não consegui abrir essa foto."); }
        };
        $("#form-prod").addEventListener("submit", (e) => {
            e.preventDefault();
            const f = e.target;
            Object.assign(prod, {
                nome: f.nome.value.trim(), unidade: f.unidade.value.trim(), categoria: f.categoria.value, estoqueMin: Number(f.estoqueMin.value) || 0,
                selo: f.selo.value.trim(), descricao: f.descricao.value.trim(), ativo: f.ativo.checked, destaque: f.destaque.checked,
            });
            const vv = vars.filter((v) => v.nome.trim());
            if (vv.length) { prod.variacoes = vv.map((v) => ({ nome: v.nome.trim(), preco: Number(v.preco) || 0, estoque: Number(v.estoque) || 0 })); prod.preco = Math.min(...prod.variacoes.map((v) => v.preco)); prod.precoAntigo = null; prod.estoque = 0; }
            else { prod.variacoes = null; prod.preco = Number(f.preco.value) || 0; prod.precoAntigo = Number(f.precoAntigo.value) || null; prod.estoque = Number(f.estoque.value) || 0; }
            if (!prod.nome) { toast("Dê um nome ao produto."); return; }
            if (novo) db.produtos.push(prod); else db.produtos[db.produtos.findIndex((x) => x.id === prod.id)] = prod;
            salvar(); fecharModal(); renderEstoque(); toast("Produto salvo!");
        });
        if (!novo) $("#excluir-prod").onclick = () => {
            if (!confirm(`Excluir "${prod.nome}"? Se quiser só tirar da loja por um tempo, use o olhinho.`)) return;
            db.produtos = db.produtos.filter((x) => x.id !== prod.id); salvar(); fecharModal(); renderEstoque();
        };
    };

    // ─── SERVIÇOS ───────────────────────────────────────────────────────────
    const renderServicos = () => {
        $("#tab-servicos").innerHTML = `
            <thead><tr><th>Ativo</th><th>Serviço</th>${PL_PORTES.map((p) => `<th class="num">${p.nome}</th>`).join("")}</tr></thead>
            <tbody>${db.servicos.map((s, i) => `<tr>
                <td><input type="checkbox" data-si="${i}" data-k="ativo" ${s.ativo ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--teal)"></td>
                <td><input data-si="${i}" data-k="nome" value="${plEsc(s.nome)}"><input data-si="${i}" data-k="descricao" value="${plEsc(s.descricao)}" style="margin-top:4px;font-size:.8rem"></td>
                ${PL_PORTES.map((p) => `<td class="num"><input type="number" step="0.01" min="0" data-si="${i}" data-porte="${p.id}" value="${s.precos[p.id]}"></td>`).join("")}
            </tr>`).join("")}</tbody>`;
        $("#lista-adicionais").innerHTML = db.adicionais.map((a, i) => `
            <div class="adic-linha"><input type="checkbox" data-ai="${i}" data-k="ativo" ${a.ativo ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--teal)">
            <input type="text" data-ai="${i}" data-k="nome" value="${plEsc(a.nome)}"><input type="number" step="0.01" min="0" data-ai="${i}" data-k="preco" value="${a.preco}">
            <button class="btn-ico" data-remover-adic="${i}" aria-label="Remover"><i class="fa-solid fa-trash"></i></button></div>`).join("");
    };
    $("#tela-servicos").addEventListener("input", (e) => {
        const t = e.target;
        if (t.dataset.si !== undefined) { const s = db.servicos[Number(t.dataset.si)]; if (t.dataset.porte) s.precos[t.dataset.porte] = Number(t.value) || 0; else s[t.dataset.k] = t.type === "checkbox" ? t.checked : t.value; }
        if (t.dataset.ai !== undefined) { const a = db.adicionais[Number(t.dataset.ai)]; a[t.dataset.k] = t.type === "checkbox" ? t.checked : t.dataset.k === "preco" ? Number(t.value) || 0 : t.value; }
    });
    $("#tela-servicos").addEventListener("change", (e) => { if (e.target.type === "checkbox") e.target.dispatchEvent(new Event("input", { bubbles: true })); });
    $("#tela-servicos").addEventListener("click", (e) => {
        const r = e.target.closest("[data-remover-adic]");
        if (r) { db.adicionais.splice(Number(r.dataset.removerAdic), 1); renderServicos(); }
    });
    $("#add-adicional").onclick = () => { db.adicionais.push({ id: "ad" + Date.now(), nome: "Novo adicional", preco: 10, ativo: true }); renderServicos(); };
    $("#salvar-servicos").onclick = () => { salvar(); toast("Serviços salvos! A loja já mostra os novos valores."); };

    // ─── AJUSTES ────────────────────────────────────────────────────────────
    const renderConfig = () => {
        const c = cfg(), a = c.agenda;
        $("#form-config").innerHTML = `
            <div>
                <fieldset class="painel"><legend>Loja</legend>
                    <div class="linha-2">
                        <label class="campo">WhatsApp que recebe os pedidos <small>com DDI e DDD</small><input name="whatsapp" value="${plEsc(c.whatsapp)}"></label>
                        <label class="campo">Telefone exibido<input name="telefoneExibicao" value="${plEsc(c.telefoneExibicao)}"></label>
                        <label class="campo">Horário de funcionamento<input name="horarioTexto" value="${plEsc(c.horarioTexto)}"></label>
                        <label class="campo">Instagram<input name="instagram" value="${plEsc(c.instagram)}"></label>
                    </div>
                    <label class="campo">Aviso no topo do site<input name="avisoTopo" value="${plEsc(c.avisoTopo)}"></label>
                    ${c.lojas.map((l, i) => `<div class="linha-2"><label class="campo">Nome da loja ${i + 1}<input name="loja-nome-${i}" value="${plEsc(l.nome)}"></label><label class="campo">Endereço<input name="loja-end-${i}" value="${plEsc(l.endereco)}"></label></div>`).join("")}
                </fieldset>
                <fieldset class="painel"><legend>Tele-entrega</legend>
                    <div class="linha-2">
                        <label class="campo">Grátis acima de (R$)<input name="freteGratisAcima" type="number" step="0.01" min="0" value="${c.freteGratisAcima}"></label>
                        <label class="campo">Taxa abaixo disso (R$)<input name="taxaEntrega" type="number" step="0.01" min="0" value="${c.taxaEntrega}"></label>
                    </div>
                </fieldset>
            </div>
            <div>
                <fieldset class="painel"><legend>Agenda de banho e tosa</legend>
                    <p class="campo" style="margin-bottom:6px">Dias de atendimento</p>
                    <div class="dias-semana">${DIAS_CURTO.map((d, i) => `<label><input type="checkbox" name="dia" value="${i}" ${a.diasSemana.includes(i) ? "checked" : ""}>${d}</label>`).join("")}</div>
                    <div class="linha-2">
                        <label class="campo">Primeiro horário<input name="inicio" type="time" value="${a.inicio}"></label>
                        <label class="campo">Último horário<input name="fim" type="time" value="${a.fim}"></label>
                        <label class="campo">Intervalo entre horários<select name="intervaloMin">${[30, 45, 60, 90, 120].map((m) => `<option value="${m}" ${Number(a.intervaloMin) === m ? "selected" : ""}>${m} minutos</option>`).join("")}</select></label>
                        <label class="campo">Pets ao mesmo tempo (por loja)<input name="vagasPorHorario" type="number" min="1" max="10" value="${a.vagasPorHorario}"></label>
                        <label class="campo">Cliente pode marcar até<select name="diasAntecedencia">${[7, 14, 21, 30, 60].map((n) => `<option value="${n}" ${Number(a.diasAntecedencia) === n ? "selected" : ""}>${n} dias à frente</option>`).join("")}</select></label>
                    </div>
                    <p class="campo" style="margin-bottom:6px">Lojas que fazem banho e tosa</p>
                    <div class="dias-semana">${c.lojas.map((l) => `<label><input type="checkbox" name="lojaBanho" value="${l.id}" ${a.lojasComBanho.includes(l.id) ? "checked" : ""}>${plEsc(l.nome)}</label>`).join("")}</div>
                    <p class="painel-sub">Para fechar um dia específico (feriado), abra o dia na Agenda e marque "Fechar o dia".</p>
                </fieldset>
                <fieldset class="painel"><legend>Acesso e cópia de segurança</legend>
                    <label class="campo">Nova senha do painel <small>deixe em branco para manter</small><input name="senha" type="password" autocomplete="new-password"></label>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <button type="button" class="btn btn-claro btn-sm" id="baixar-backup"><i class="fa-solid fa-download"></i> Baixar cópia</button>
                        <label class="btn btn-claro btn-sm"><i class="fa-solid fa-upload"></i> Restaurar cópia<input type="file" accept=".json" id="restaurar-backup" hidden></label>
                        <button type="button" class="btn btn-perigo btn-sm" id="restaurar-exemplo"><i class="fa-solid fa-rotate"></i> Voltar dados de exemplo</button>
                    </div>
                </fieldset>
                <div class="salvar-fixo"><button class="btn btn-teal"><i class="fa-solid fa-floppy-disk"></i> Salvar ajustes</button></div>
            </div>`;
    };
    $("#form-config").addEventListener("submit", (e) => {
        e.preventDefault();
        const f = e.target, c = cfg(), fd = new FormData(f);
        ["whatsapp", "telefoneExibicao", "horarioTexto", "instagram", "avisoTopo"].forEach((k) => { c[k] = String(fd.get(k)).trim(); });
        c.whatsapp = plSoNumeros(c.whatsapp);
        c.lojas.forEach((l, i) => { l.nome = String(fd.get(`loja-nome-${i}`)).trim() || l.nome; l.endereco = String(fd.get(`loja-end-${i}`)).trim(); });
        c.freteGratisAcima = Number(fd.get("freteGratisAcima")) || 0;
        c.taxaEntrega = Number(fd.get("taxaEntrega")) || 0;
        const dias = fd.getAll("dia").map(Number);
        const lojasB = fd.getAll("lojaBanho");
        if (!dias.length || !lojasB.length) { toast("Marque pelo menos um dia e uma loja para a agenda."); return; }
        if (plMin(String(fd.get("fim"))) < plMin(String(fd.get("inicio")))) { toast("O último horário precisa ser depois do primeiro."); return; }
        Object.assign(c.agenda, { diasSemana: dias, inicio: fd.get("inicio"), fim: fd.get("fim"), intervaloMin: Number(fd.get("intervaloMin")), vagasPorHorario: Math.max(1, Number(fd.get("vagasPorHorario")) || 1), diasAntecedencia: Number(fd.get("diasAntecedencia")), lojasComBanho: lojasB });
        const senha = String(fd.get("senha") || "");
        if (senha) { if (senha.length < 6) { toast("A senha precisa ter pelo menos 6 caracteres."); return; } c.senhaPainel = senha; }
        salvar(); renderConfig(); toast("Ajustes salvos!");
    });
    $("#form-config").addEventListener("click", (e) => {
        if (e.target.closest("#baixar-backup")) {
            const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `petlife-copia-${hojeISO()}.json`; a.click();
        }
        if (e.target.closest("#restaurar-exemplo") && confirm("Apagar tudo e voltar aos dados de exemplo?")) { db = PetDB.restaurarExemplo(); atualizarContadores(); renderConfig(); toast("Dados de exemplo restaurados."); }
    });
    $("#form-config").addEventListener("change", async (e) => {
        if (e.target.id !== "restaurar-backup" || !e.target.files[0]) return;
        try { db = PetDB.importar(await e.target.files[0].text()); atualizarContadores(); renderConfig(); toast("Cópia restaurada!"); }
        catch (er) { toast("Arquivo inválido."); }
    });

    // ─── MODAL E CLIQUES GERAIS ─────────────────────────────────────────────
    const abrirModal = (html) => { $("#modal-conteudo").innerHTML = html; $("#modal").hidden = false; };
    const fecharModal = () => { $("#modal").hidden = true; $("#modal-conteudo").innerHTML = ""; };
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal").hidden) fecharModal(); });

    document.addEventListener("click", (e) => {
        const t = e.target.closest("button, [data-ir], a");
        if (!t) return;
        if (t.hasAttribute("data-fechar")) { fecharModal(); return; }
        if (t.dataset.ir) { if (t.dataset.filtro) estState.filtro = t.dataset.filtro; irPara(t.dataset.ir); return; }
        if (t.dataset.acao === "novo-ag") { modalAgendamento(null, t.dataset.data); return; }
        if (t.dataset.acao === "novo-prod") { modalProduto(); return; }
        if (t.dataset.dia) { agState.dia = t.dataset.dia; renderAgenda(); if (window.innerWidth < 1100) $("#dia-painel").scrollIntoView({ behavior: "smooth" }); return; }
        if (t.dataset.flj !== undefined) { agState.loja = t.dataset.flj; renderAgenda(); return; }
        if (t.dataset.ag && t.dataset.st) { mudarStatus(Number(t.dataset.ag), t.dataset.st); return; }
        if (t.dataset.editarAg) { modalAgendamento(db.agendamentos.find((a) => a.id === Number(t.dataset.editarAg))); return; }
        if (t.dataset.editarProd) { modalProduto(db.produtos.find((p) => p.id === Number(t.dataset.editarProd))); return; }
        if (t.dataset.visivel) { const p = db.produtos.find((x) => x.id === Number(t.dataset.visivel)); p.ativo = !p.ativo; salvar(); renderEstoque(); toast(p.ativo ? "Produto visível na loja." : "Produto escondido da loja."); return; }
        if (t.dataset.filtroEst) { estState.filtro = t.dataset.filtroEst; renderListaEstoque(); $("#est-filtro").value = estState.filtro; return; }
    });
    document.addEventListener("change", (e) => {
        if (e.target.dataset.fecharDia) {
            const iso = e.target.dataset.fecharDia, a = cfg().agenda;
            a.diasFechados = e.target.checked ? [...new Set([...(a.diasFechados || []), iso])] : (a.diasFechados || []).filter((d) => d !== iso);
            salvar(); renderAgenda(); toast(e.target.checked ? "Dia fechado: o site não oferece mais horários nele." : "Dia reaberto para agendamentos.");
        }
    });

    // Novos agendamentos feitos no site (mesmo navegador, outra aba) aparecem na hora
    PetDB.aoMudarEmOutraAba((novo) => {
        const antes = db.agendamentos.length;
        db = novo; atualizarContadores();
        if (!$("#app").hidden && $("#modal").hidden) TELAS[telaAtual].render();
        if (db.agendamentos.length > antes) toast("Novo agendamento recebido pelo site!");
    });

    atualizarContadores();
    if (sessionStorage.getItem(CHAVE_SESSAO)) entrar();
})();
