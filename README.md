# Pet Life Canoas — demonstração

Catálogo online da **Pet Life** (agropecuária e pet shop, 2 lojas em Canoas/RS) com sacolinha, tele-entrega ou retirada, pedido finalizado no WhatsApp da loja, **aba de agendamento de banho e tosa** e um painel simples para a loja.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html`, `style.css`, `app.js` | A loja que o cliente usa (abas **Loja** e **Banho e Tosa**) |
| `admin.html`, `admin.css`, `admin.js` | Painel da loja (link "Área da loja" no rodapé) |
| `dados.js` | Produtos, serviços, configurações e o armazenamento |
| `assets/` | Logo, ícones, prévia do link (1200×630) e fotos dos produtos (recortadas dos posts do Instagram) |

## Loja
- Esquenta Black Friday (06/11 a 30/11) com as ofertas dos stories.
- Categorias, busca, filtros, produtos com opções (ex.: Defenza por peso, guias por número, areia 2 kg/4 kg).
- Link próprio de cada produto: `#produto/nome-do-produto`.
- Sacolinha → tele-entrega (grátis acima de R$ 100) ou retirada numa das lojas → pagamento → **Finalizar no WhatsApp**.

## Banho e tosa (`#banho-e-tosa`)
1. Pet (nome, cão/gato, porte) → 2. Serviço + adicionais (preço muda pelo porte) → 3. Loja, dia e horário (só mostra o que está livre) → 4. Dados do tutor.
O horário fica reservado como **pendente** e a mensagem vai pronta para o WhatsApp da loja.

## Painel (`admin.html`) — senha de demonstração: `petlife123`
- **Início**: banhos de hoje, a confirmar, próximos 7 dias, pedidos pelo site, estoque baixo + 4 gráficos simples.
- **Agenda**: calendário do mês por loja, lista do dia com Confirmar / Pet pronto / Faltou / Cancelar (cada um já abre a mensagem para o cliente no WhatsApp), agendamento manual (balcão/telefone) e "Fechar o dia" para feriados.
- **Estoque**: + / − rápido (também por opção de tamanho), aviso de reposição, mostrar/ocultar na loja, cadastro com foto.
- **Serviços**: preços por porte e adicionais.
- **Ajustes**: WhatsApp, lojas, tele-entrega, dias/horários/vagas da agenda, senha e cópia de segurança.

## Importante
- Nesta demonstração tudo fica salvo **no navegador** (localStorage). Para usar de verdade (cliente agenda no celular dele e a loja vê no painel), ligar ao Firebase seguindo o padrão TF (lista `admins`, inscrição desativada).
- **Conferir com a loja antes de publicar**: endereços (o destaque do Instagram mostra Av. Boqueirão 3221 e Av. do Nazário 1361; alguns posts mostram 3197 e 1721), preços de banho e tosa, horários e vagas, e os preços que não estavam nos posts (Seresto, Beneflora, Macrogard, produtos agro).
- Os selos "Black Friday" vencem em 30/11 e a promoção Mandala em 17/12: tirar pelo painel (campo "Selo" e "Preço de").
- Antes de publicar, trocar o endereço das tags `og:image` e `og:url` no `index.html` pelo endereço final.

---
Site desenvolvido por **TF Solutions**.
