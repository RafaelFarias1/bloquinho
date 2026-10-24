---
name: Bloquinho
description: Caderno de treino que se comporta como uma caderneta escolar de capa de papelão, carimbada série a série.
colors:
  cover: "#1f3c88"
  cover-deep: "#172e6c"
  on-cover: "#eef2fb"
  paper: "#f2f4ec"
  paper-band: "#e6eadd"
  print: "#283044"
  print-faint: "#59647c"
  rule: "#b0bcd3"
  rule-fine: "#d2d9e5"
  pen: "#2348c4"
  stamp: "#6b3fa6"
  ok: "#1e7f49"
  red: "#cf3528"
  orange: "#b0560f"
  postit: "#ffe36e"
  postit-fold: "#e5c43f"
  on-postit: "#2b2510"
  star: "#f4b81e"
  desk: "#cdd3c6"
  go: "#1f3c88"
typography:
  hero:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  timer:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "6.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.08
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.08
  body:
    fontFamily: "Barlow, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
  stamp:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.04em"
  pen-title:
    fontFamily: "Nanum Pen Script, Bradley Hand, Segoe Print, cursive"
    fontSize: "calc(2rem * 1.36)"
    fontWeight: 400
    lineHeight: 1
  pen-card:
    fontFamily: "Nanum Pen Script, Bradley Hand, Segoe Print, cursive"
    fontSize: "calc(1.5rem * 1.36)"
    fontWeight: 400
    lineHeight: 1
  pen-field:
    fontFamily: "Nanum Pen Script, Bradley Hand, Segoe Print, cursive"
    fontSize: "calc(1.25rem * 1.36)"
    fontWeight: 400
    lineHeight: 1.15
  pen-line:
    fontFamily: "Nanum Pen Script, Bradley Hand, Segoe Print, cursive"
    fontSize: "calc(1rem * 1.36)"
    fontWeight: 400
    lineHeight: "28px"
rounded:
  box: "3px"
  stamp: "5px"
  cover: "12px"
  tab: "9px"            # --r-tab
  sticker: "16px"
  pill: "999px"
  round: "50%"
spacing:
  sp-1: "4px"
  sp-2: "8px"
  sp-3: "12px"
  sp-4: "16px"
  sp-5: "24px"
  sp-6: "32px"
  sp-7: "48px"
  line: "28px"
  gutter: "18px"
  spine: "14px"
  tabbar-h: "64px"
components:
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
    typography: "{typography.title}"
    rounded: "{rounded.box}"
    padding: "8px 16px"
    height: "52px"
  button-go:
    backgroundColor: "{colors.go}"
    textColor: "{colors.on-cover}"
    typography: "{typography.title}"
    rounded: "{rounded.box}"
    padding: "8px 16px"
    height: "52px"
  button-xl:
    backgroundColor: "{colors.go}"
    textColor: "{colors.on-cover}"
    rounded: "{rounded.box}"
    height: "62px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.print}"
    typography: "{typography.title}"
    rounded: "{rounded.box}"
    padding: "8px 16px"
    height: "52px"
  button-round:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
    rounded: "{rounded.round}"
    size: "46px"
  key:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
    rounded: "{rounded.box}"
    size: "48px"
  link:
    textColor: "{colors.pen}"
    typography: "{typography.label}"
    padding: "8px 2px"
  link-danger:
    textColor: "{colors.red}"
  tab-hanging:
    backgroundColor: "{colors.paper-band}"
    textColor: "{colors.print}"
    rounded: "0 0 9px 9px"
    padding: "12px 14px 10px"
    height: "46px"
  tabbar:
    backgroundColor: "{colors.cover}"
    height: "{spacing.tabbar-h}"
    padding: "8px 10px 6px"
  tab-index:
    backgroundColor: "{colors.paper-band}"
    textColor: "{colors.print-faint}"
    rounded: "9px 9px 3px 3px"
    height: "50px"
  tab-index-open:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.pen}"
  theme-option:
    backgroundColor: "transparent"
    textColor: "{colors.print}"
    rounded: "{rounded.box}"
    padding: "8px 8px 12px"
  theme-option-on:
    textColor: "{colors.pen}"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print-faint}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
    rounded: "{rounded.box}"
    padding: "16px"
  card-head-band:
    backgroundColor: "{colors.paper-band}"
    textColor: "{colors.print-faint}"
    padding: "8px 12px 4px"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.pen}"
    typography: "{typography.pen-field}"
    rounded: "0"
  date-stamp:
    textColor: "{colors.stamp}"
    rounded: "{rounded.round}"
    size: "44px"
  verdict-stamp:
    textColor: "{colors.ok}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
  postit:
    backgroundColor: "{colors.postit}"
    textColor: "{colors.on-postit}"
    typography: "{typography.pen-title}"
  toast:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.stamp}"
    rounded: "{rounded.stamp}"
    padding: "8px 16px"
  field-lined:
    backgroundColor: "transparent"
    textColor: "{colors.pen}"
    typography: "{typography.pen-line}"
    rounded: "0"
  cal-caption:
    backgroundColor: "{colors.paper-band}"
    textColor: "{colors.print}"
    rounded: "3px 3px 0 0"
    padding: "6px 12px 5px"
  ident:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
    rounded: "{rounded.box}"
    padding: "28px 26px 16px"
  folio:
    textColor: "{colors.print-faint}"
    padding: "8px 0 0"
---

# Design System: Bloquinho

## Overview

**Creative North Star: "A Caderneta Carimbada"**

O Bloquinho é uma caderneta escolar (ou de vacinação) de capa de papelão azul, com páginas branco-esverdeadas de gráfica presas por dois grampos na lombada. A página é um formulário impresso: quadros retos, linhas finas de preencher, faixas de cabeçalho. Em cima dele acontecem só três tipos de marca, e cada uma tem dono: **o caderno fala em letra impressa** (Barlow e Barlow Condensed, em grafite), **o que você escreve sai de caneta azul** (Nanum Pen Script) e **o que acontece vira carimbo violeta** de tinta falhada (a data no quadrinho da série, o descanso, o veredito, o "MUITO BEM!" da professora). Estrela dourada e post-it amarelo são os únicos papéis colados; vermelho é a caneta da correção.

A densidade é de formulário: muita informação em quadros pequenos, mas legível num olhar de poucos segundos, com dedo suado e luz forte. Os alvos de toque têm 46 a 62px, a tela da série é dominada pelo post-it gigante, e o descanso é um carimbo redondo que ocupa a largura.

O mundo recusa o app de academia de cards escuros, anel neon e gradiente. Profundidade vem do papel (a folha sobre a capa, o post-it descolando), não de interface flutuante.

**Key Characteristics:**
- Três vozes fixas: impresso (o caderno), caneta (você), carimbo (o que aconteceu).
- Formulário reto: quadros de 3px de raio, linhas de 1 a 1,5px em azul-acinzentado.
- Carimbos sempre tortos, com tinta irregular (filtros SVG `#ink` e `#ink-big`) e opacidade abaixo de 100%.
- Capa de papelão azul em volta de tudo; em tela larga, a caderneta fica sobre uma mesa.
- Três temas (automático, claro, escuro), e o escuro é a mesma caderneta: capa marinho, página grafite, tintas claras. Nenhum componente define cor só para um tema.
- Abas de papel: as seções saem da borda de baixo da capa, as ações da página pendem da borda de cima da folha.

## Colors

Uma capa azul, uma página quase branca, grafite para o impresso e quatro tintas com papel fixo: caneta azul, carimbo violeta, carimbo verde/laranja para resultado e caneta vermelha para corrigir.

### Primary
- **Azul Caderneta** (`cover`): a capa de papelão (com a textura `--cardboard` por cima), a faixa da capa no topo da tela inicial, a tela de entrar inteira a barra de abas embaixo e as miniaturas de tema. `go` é o botão da ação principal, "um pedaço da capa com a costura em volta": no claro é o mesmo azul da capa; no escuro sobe para um azul mais aceso (`#2b4db0`), porque a capa marinho some sobre a página grafite. `cover-deep` é a dobra: borda do botão principal, véu da folha de baixo, contorno da capa em tela larga. `on-cover` é a letra impressa sobre a capa.

### Secondary
- **Caneta Esferográfica** (`pen`): tudo que o usuário escreve ou escolhe. Nome do treino, exercícios, valores digitados, reps, risquinhos de contagem, círculo em volta da série atual, opção marcada (circulada de caneta), links, foco do teclado, cursor e o dia de hoje.

### Tertiary
- **Carimbo Violeta** (`stamp`): o que aconteceu. Carimbo de data no quadrinho da série e na semana, número grande da série, anel do descanso, dia treinado no calendário, aviso (toast), carimbo da professora, numeração da lista "como funciona", e o veredito "mantém".

### Tintas de resultado (semântica fixa)
| Token | Significa | Tinta |
|---|---|---|
| `--up` | sobe a carga / progrediu | `ok`, carimbo verde |
| `--keep` | mantém / igual | `stamp`, carimbo violeta |
| `--down` | baixa a carga / caiu / abaixo do normal / série que falhou | `orange`, carimbo laranja |
| `--free` | outra atividade, fora dos treinos | `pen`, caneta azul |

O descanso também muda de tinta: violeta correndo, laranja (`.hot`) nos últimos segundos, verde (`.met`) quando o tempo mínimo foi cumprido.

- **Caneta Vermelha** (`red`): só correção e perigo. Link "descartar/apagar", o botão "×" de remover série, o estado armado de confirmação (fundo vermelho), mensagem de erro de conta.

### Neutral
- **Papel de Gráfica** (`paper`): a página e o fundo de todo quadro, botão e campo.
- **Faixa de Formulário** (`paper-band`, `--paper-2`): cabeçalho de quadro (ficha do treino, dias da semana, tabela, aba ativa) e o estado pressionado.
- **Grafite de Impressão** (`print`): texto do formulário, títulos de seção, borda de botão.
- **Impressão Fraca** (`print-faint`, `--print-2`): rótulos, notas, número do quadrinho, metadados.
- **Linha Impressa** (`rule`) e **Linha de Preencher** (`rule-fine`, `--rule-2`): bordas de quadro e linhas entre itens.
- **Post-it** (`postit`, dobra `postit-fold`, letra `on-postit`): o botão gigante "Terminei a série" e nada mais.
- **Estrelinha** (`star`): miolo da estrela do carimbo da professora.
- **Mesa** (`desk`): fundo atrás da caderneta a partir de 600px.

O tema é escolhido na tela Conta (automático, claro ou escuro) e vai junto com a conta. Escolhido, ele vira `data-theme="light"` ou `"dark"` no `<html>`; no automático o atributo sai e vale `prefers-color-scheme`. `js/theme.js` aplica a última escolha (guardada no aparelho) antes da primeira pintura, e as metas `theme-color` acompanham (`#172e6c` claro, `#0a1229` escuro). No escuro os mesmos tokens viram capa `#101b3b`, página `#1a2030`, impressão `#dfe4ef`, caneta `#93acff`, carimbo `#bd9cf5`, verde `#68d69a`, laranja `#f3a660`, vermelho `#ff8475`, botão principal `#2b4db0`, e os grampos ficam a 55%.

### Named Rules
**A Regra do Vermelho que Corrige.** Vermelho é só caneta de correção: apagar, descartar, remover, erro. "Baixo", "caiu" e "abaixo do normal" são laranja (`--down` → `--orange`), nunca vermelho; uma série fraca não é um erro.

**A Regra do Tema por Pedaço.** As cores de cada tema moram no seletor `[data-theme]`, não só no `:root`: qualquer pedaço da página com `data-theme` se pinta naquele tema. É assim que as miniaturas da tela Conta mostram claro e escuro lado a lado. Componente novo usa só tokens e herda isso de graça; nunca escreva `@media (prefers-color-scheme)` num componente.

**A Regra da Tinta com Dono.** Caneta azul é só do usuário; violeta é só do que aconteceu. Se um texto não foi escrito nem carimbado, ele é impresso em grafite.

## Typography

**Impresso:** Barlow Condensed (com Arial Narrow, Roboto Condensed) para títulos, rótulos, botões, números e carimbos.
**Texto:** Barlow (com system-ui) para frases corridas.
**Caneta:** Nanum Pen Script (com Bradley Hand, Segoe Print) para tudo que o usuário escreve.

**Character:** um formulário condensado e sério, de gráfica, preenchido com letra de mão solta. O contraste entre o impresso reto e a caneta é a hierarquia: o que é seu salta da página.

A base é `html{font-size:18px}`, então 1rem = 18px.

### Hierarchy
- **Hero** (Barlow Condensed 700, 2.75rem, 0.95): só o nome "Bloquinho" na capa (130% maior na tela de entrar).
- **Timer** (Barlow Condensed 800, 6.25rem, tabular): o número do descanso; `--fs-hero` (4.5rem) é o número da série e o cronômetro progressivo. Sempre em tinta de carimbo com `#ink-big`.
- **Headline** (Barlow Condensed 700, 1.5rem): título de folha de baixo, total.
- **Title** (Barlow Condensed 700, 1.25rem, com linha de 2px em grafite embaixo): títulos de seção ("Esta semana", "Meus treinos") e texto de botão.
- **Body** (Barlow 400, 1rem, 1.45): frases, notas (0.875rem em `print-faint`), parágrafos da cola até 46ch.
- **Label** (Barlow Condensed 600, 0.875rem, +0.01em, caixa normal): rótulos de campo, cabeçalhos de tabela, "nº 1", "S1". Rótulo nunca vai em caixa alta; caixa alta é exclusividade de carimbo.
- **Stamp** (Barlow Condensed 800, caixa alta, +0.04em): vereditos e destaques carimbados.
- **Caneta** (Nanum Pen Script 400, sempre `tamanho × --hand-k`): título da tela (2rem), nome do treino (1.5rem), campos e valores (1.25rem, também o nome na linha "Nome" da capa e da identificação), o mês do calendário (1rem × 1.1), o e-mail da identificação (1rem, um tamanho abaixo do nome), linhas de exercício e o "O que aprendi hoje" (1rem na entrelinha de 28px).
- **Rodapé de folha** (Barlow Condensed 600, 0.75rem, +0.02em, números tabulares, `print-faint`): "Bloquinho" e "folha N de 3".

Faixa de reps: na célula planejada vai com meia-risca ("8–12"), na frase vai por extenso ("8 a 12 reps"). Carga que mudou entre séries também usa meia-risca ("40–45").

### Named Rules
**A Regra do `--hand-k`.** A Nanum Pen Script tem olho pequeno, então todo tamanho de caneta é multiplicado por `--hand-k` (1.36) para ler igual ao impresso ao lado. Nunca use a fonte de caneta num tamanho cru da escala.

**A Regra das Três Vozes.** Impresso fala, caneta escreve, carimbo marca. Botões, rótulos e mensagens do app são impressos; o que o usuário digitou é de caneta onde quer que reapareça; resultado é carimbo.

**A Regra do Campo de Preencher.** Dado que pertence ao usuário e aparece como informação (não como campo editável) é um campo do formulário já preenchido: rótulo impresso em caixa normal à esquerda ("Nome", "E-mail", "Mês") e o valor em caneta sobre uma linha de 1px `rule`. Vale para a etiqueta da capa (`.cover-label`), o mês do calendário (`.cal-title`) e a identificação da Conta (`.ident-line`). Nunca vira título impresso solto.

## Layout

Uma coluna só: a folha tem no máximo 600px, centrada. A margem esquerda soma a lombada (`--spine`, 14px) e o respiro (`--gutter`, 18px); a direita é só o respiro. A partir de 600px, respiro 28px, lombada 20px, os grampos aparecem e a folha ganha 48px de margem vertical sobre a mesa, com a capa de 12px aparecendo em volta. Abaixo de 600px, a folha fica a 7px das bordas e a capa de papelão aparece nas laterais.

Espaço sai de `--sp-1` a `--sp-7` (4 a 48px), sempre via `gap` entre irmãos. Títulos de seção abrem com 32px acima e 12px abaixo; listas de fichas usam 24px entre elas. A entrelinha da caderneta (`--line`, 28px) é a altura das linhas de exercício e do pautado do gráfico.

Nas três telas principais (Caderno, Calendário, Conta) a barra de abas fica presa embaixo (`--tabbar-h`, 64px, mais a área segura), com no máximo 624px de largura, centrada sob a folha. Com ela na tela, o `body` ganha `data-tabs`: a folha soma a altura da barra ao respiro de baixo e o aviso sobe junto. Nas telas de dentro (treino, editor, série, histórico) não há barra; a linha de cima (`.crumbs`) prende as abas penduradas no topo, com o cabeçalho corrido (ex.: "treino nº 2 de 4") centrado entre elas. Camadas: desenho 3, abas 40, folha de baixo 50, aviso 60.

Cada uma das três telas principais termina com o rodapé de folha (`.folio`): 48px abaixo do último conteúdo, um filete de 1px `rule`, "Bloquinho" impresso à esquerda e "folha N de 3" à direita, na ordem das abas (Caderno 1, Calendário 2, Conta 3). É mobília da página, não informação: fica escondido do leitor de tela. As telas de dentro não têm rodapé.

Grades de quadrinhos (semana com 7 dias, séries com `--n` colunas, calendário 7×n) dividem a largura em partes iguais com linhas de 1px, como um formulário.

## Elevation & Depth

A página é plana; profundidade é só de papel. A folha inteira tem uma sombra (`--sh-page`) sobre a capa, botões e fichas tocáveis levantam um milímetro (`--sh-lift`) e, ao apertar, afundam 1px com sombra interna (`--sh-press`). O post-it tem sombra de papel solto (drop-shadow de 10px). A capa tem sombra interna para parecer papelão grosso. Carimbos e molduras impressas (como a da identificação) não têm sombra: são tinta. Toda sombra de material é um token `--sh-*` em `css/tokens.css`.

### Shadow Vocabulary
- **Folha** (`box-shadow: 0 1px 2px rgba(18,30,68,.18), 0 18px 34px -14px rgba(18,30,68,.45)`): a página sobre a capa e a folha de baixo.
- **Levantado** (`box-shadow: 0 1px 1px rgba(18,30,68,.14), 0 6px 14px -6px var(--shade)`): botões e fichas de treino em repouso.
- **Apertado** (`box-shadow: inset 0 2px 5px rgba(10,20,50,.28)`): estado `:active` de botão, tecla, ficha.
- **Aba pendurada** (`--sh-tab-hang`: `0 4px 6px -5px var(--shade)`): a orelha de papel que desce da borda de cima da folha.
- **Capa embaixo** (`--sh-tabbar`: `0 -1px 0 rgba(0,0,0,.22), 0 -12px 18px -14px rgba(10,18,40,.6)`): a barra de abas, um pedaço de papelão por cima do fim da folha.
- **Aba aberta** (`--sh-tab-open`: `0 4px 7px -4px rgba(0,0,0,.4)`, somada ao filete de caneta `inset 0 3px 0 var(--pen)`): a aba da barra que está à frente.
- **Papelão grosso** (`--sh-cover-band`: brilho de 1px em cima, sombra interna embaixo e em volta): a faixa da capa no topo da tela inicial.
- **Capa gasta** (`--sh-cover-wear`: `inset 0 0 70px rgba(0,0,0,.32)`): a capa inteira na tela de entrar.
- **Relevo** (`--sh-emboss`): o contorno prensado em volta da capa na tela de entrar.
- **Caderneta na mesa** (`--sh-desk`: `0 34px 60px -22px rgba(10,18,40,.55)`): a caderneta inteira sobre a mesa, a partir de 600px.
- **Adesivo** (`--sh-sticker`: `0 1px 2px rgba(0,0,0,.35)`): o adesivo do logo e a etiqueta "Nome" colados na capa.
- **Etiqueta** (`--sh-label`: `0 1px 2px rgba(0,0,0,.4), 0 2px 0 rgba(0,0,0,.08)`): a etiqueta de papel do formulário de entrar, colada na capa.
- **Grampo** (`--staple-metal` de fundo, `--sh-staple`): os dois grampos de metal na lombada; a lombada em si é `--spine-shade` com o vinco `--spine-crease`.

### Named Rules
**A Regra do Papel.** Só levanta o que é papel tocável ou solto: folha, botão, ficha, post-it, aviso. Quadro de formulário fica rente à página. A aba aberta sobe 5px da barra porque é a folha que está à frente; as outras ficam baixas.

## Shapes

O formulário é reto. Quadros, botões, teclas, campos e tabelas usam 3px de raio (`--r-box`); campos de escrever nem caixa têm, só a linha embaixo. Curvam apenas: a capa (12px, na tela de entrar e no contorno em tela larga), as abas de índice (9px no canto que fica para fora da folha: em cima nas abas da barra, `9px 9px 3px 3px`; embaixo nas abas penduradas, `0 0 9px 9px`, sem borda de cima, como se saíssem de trás da página), as etiquetas em pílula (técnica, "próximo", opção marcada circulada de caneta), e os carimbos redondos (data, descanso, professora, botões − + e de som). Carimbos retangulares (veredito, destaque `.hl`, variação, aviso) usam `--r-stamp` (5px) e borda dupla (contorno, filete de papel, contorno). O adesivo do logo na capa usa `--r-sticker` (16px) com a borda de papel `--sticker-edge`. Não existe raio de 2px nem 4px: o que era 2px virou `--r-box`, o que era 4 ou 5px virou `--r-stamp`.

A moldura impressa (a da identificação, `.ident`, e a da etiqueta de entrar, `.auth`) é a borda dupla que não é carimbo: linha de 2px na cor da capa (70%) com o raio do quadro e, 4px por dentro, um filete de 1px (45% da capa). Na identificação ela é impressa direto na página: sem sombra e sem rotação, porque é impressão de gráfica, não tinta batida (na etiqueta de entrar quem levanta e entorta é o papel colado, não a moldura).

Linhas: 1px (`--bw-hair`) entre itens, 1.5px (`--bw`) em quadros e botões, 2 a 2.5px em carimbos e títulos de seção. Tracejado é sempre "secundário ou ainda não escolhido": botão fantasma, opção não marcada (inclusive tema), separador interno do carimbo, costura do botão principal.

### Named Rules
**A Regra do Carimbo Torto.** Todo carimbo sai girado, deslocado e com tinta desigual. `FX.hand(chave, força)` sorteia a partir do id de cada coisa a inclinação (3 a 11° para um lado ou outro), o deslocamento (até ±2.5px) e a força da tinta (`--stamp-a` entre 0.64 e 0.94); o mesmo dia sai sempre igual, dois dias nunca. Carimbo reto ou a 100% de tinta não existe.

## Components

### Buttons
Impressos, retos, firmes.
- **Shape:** reto (3px), altura mínima 52px (62px no `--xl`), texto Barlow Condensed 700 a 1.25rem.
- **Padrão:** papel com borda de 1.5px em grafite e sombra levantada.
- **Principal (`--go`):** pedaço da capa: fundo `go`, borda com 30% de preto misturado no próprio `go`, letra `on-cover` e uma costura tracejada a 4px por dentro. Uma por tela ("Anotar no caderno", "Entrar").
- **Fantasma (`--ghost`):** sem fundo, borda tracejada em impressão fraca, sem sombra ("+ novo treino", "desfazer série 1").
- **Aviso (`--warn`):** borda e texto em `--down` (laranja).
- **Pressionado:** desce 1px e troca a sombra pela interna (120ms).
- **Redondo:** 46px, borda grafite, para − +, som e escolha de reps (a escolha de reps falhadas usa `--down`).
- **Tecla:** 48px reta com borda `rule`, números tabulares, para −2,5 / −1 / +1 / +2,5.
- **Link:** Barlow Condensed 600 em caneta, sublinhado de 1px a 4px. `--danger` em vermelho; armado para confirmar vira bloco vermelho.

### Chips e etiquetas
- **Técnica (`.chip`):** pílula de 1px em `rule`, texto impressão fraca. Exemplo usa borda tracejada violeta.
- **Escolha (`.tag`, `.tp`):** não marcada é retângulo tracejado; marcada é circulada de caneta (pílula de 2px em `pen`, fundo com 8% de caneta). Vale para técnica e para "reps fixas / faixa de reps" nas séries normais (em 0.875rem); escolhida a faixa, aparecem os campos de caneta "reps, de" e "até".
- **Variação (`.delta`):** carimbinho retangular na tinta do resultado, girado −3°, com `#ink`.

### Cards / Containers
- **Quadro (`.card`):** papel, borda 1.5px `rule`, 3px de raio, 16px por dentro, sem sombra.
- **Ficha do treino:** quadro sem padding com faixa de cabeçalho (`paper-band`) onde fica "nº 1" impresso e o nome de caneta; exercícios de caneta em linhas de 28px com filete `rule-fine`; rodapé com técnicas e o delta. Levantada, porque é tocável.
- **Folha de baixo:** papel com a fileira de furos de picote no topo (pontos de `cover-deep`), sombra de folha, sobe 30px em 250ms sobre um véu da capa a 62%.

### Inputs / Fields
- **Estilo:** sem caixa e sem raio; texto de caneta sobre uma linha de 1px `rule`. Rótulo impresso em cima.
- **Foco:** a linha engrossa para 2px e vira caneta; um lápis desenhado acompanha o texto e rabisca a cada letra (`penFollow`). Placeholder em impressão fraca a 60%.
- **Erro:** mensagem impressa em vermelho abaixo do formulário.
- **Área pautada (`textarea.lined`):** para texto corrido do usuário. Sem caixa nem raio, caneta a 1rem × `--hand-k` com entrelinha `--line` (28px) sobre um pautado de 1px `rule` desenhado no fundo que rola junto com o texto; no mínimo quatro linhas. No foco, em vez da linha engrossar, uma barra de caneta de 3px aparece por dentro à esquerda.

### Navigation
Navegar é usar as abas da caderneta e virar a folha. A troca de tela gira a página na lombada com View Transitions (folha vai a −96° em 460ms; a lombada, os grampos e a barra de abas não se movem). Cada tela tem uma profundidade na caderneta (`depthOf`: entrar e Caderno 0, Calendário 0.4, Conta 0.8, treino 1, editor 1.5, as demais 2): indo mais fundo a folha vira para a frente, voltando ela vira para trás, e só entre telas de mesma profundidade não há virada. Assim toda troca de aba vira a página, para a frente rumo à aba da direita e para trás rumo à da esquerda. Foco do teclado: contorno de 2.5px em caneta, 3px afastado.
- **Gestos:** nas três telas principais, arrastar o dedo na horizontal passa para a aba ao lado (para a esquerda vai à próxima, para a direita volta), igual a folhear. Conta como gesto só o arraste de pelo menos 60px, quase horizontal (o vertical não passa de 60% do horizontal) e em menos de 700ms; não vale começando em campo, área de escrever ou tabela rolável (`.table-wrap`), nem com folha de baixo aberta. Nas telas de dentro, o arraste para a direita que começa a até 48px da borda esquerda aperta a aba pendurada "voltar".
- **Abas de índice (barra embaixo):** Caderno, Calendário, Conta, só nessas três telas. Uma faixa de papelão da capa (`cover` com `--cardboard`) de onde sobem três abas de papel `paper-band` com ícone de 22px e rótulo impresso (Barlow Condensed 700, 0.875rem) em impressão fraca. A aba aberta é papel (`paper`), sobe 5px, fica em caneta e ganha um filete de caneta de 3px no alto. Ao apertar, desce 1px.
- **Abas penduradas (topo da folha):** "voltar" à esquerda (ícone de seta) e a ação da página à direita ("editar", ícone de caneta), em `paper-band`, borda `rule` de 1.5px sem a de cima, 46px de altura no mínimo, texto impresso grafite e ícone em caneta. Ao apertar, viram papel e sobem 2px. Usadas no treino, editor, série e histórico; o Calendário não tem "voltar" porque a barra navega.
- **Link de seguir:** link de caneta com a seta para frente no fim ("abrir o treino ›" desenhado).

### Ícones
Desenhados num só traço: grade de 24, linha de 2 a 2.4 com pontas e cantos redondos, cor `currentColor` (livro, calendário, pessoa, caneta, voltar, ×, anterior, próximo, play, telefone, gráfico). Abrir e fechar a regra da técnica usa uma divisa feita em CSS (dois filetes de 2px girados), não um caractere.

### Tela Conta
A página de identificação e as configurações da caderneta. Abre com a identificação (`.ident`), que substitui o antigo quadro da conta: a moldura dupla impressa (ver Shapes), o título impresso "Esta caderneta pertence a" (Barlow Condensed 700, 1.25rem), as linhas de preencher "Nome" e "E-mail" com o valor em caneta (o e-mail um tamanho abaixo, `.ident-line--mail`), o estado da sincronia impresso e "sair da conta" como link vermelho. Depois, "Aparência" com a escolha de tema; "Avisos na série" com as caixinhas de bipe e voz; botão fantasma para pôr na tela do celular.
- **Escolha de tema:** três opções em grade de colunas iguais (Automático, Claro, Escuro), cada uma um quadro tracejado com miniatura, nome impresso e nota curta. Marcada: borda de 2px em caneta, texto em caneta, fundo com 6% de caneta. A miniatura é um pedacinho da caderneta pintado no próprio tema (`data-theme` na miniatura): faixa da capa em cima, duas linhas de caneta e um carimbo redondo violeta girado. A do automático é cortada na diagonal, claro em cima e escuro embaixo.

### Calendário: página de frequência
O Calendário é a folha de frequência da caderneta. A linha do mês (`.cal-title`) fica entre os botões redondos de anterior e próximo: rótulo impresso "Mês" e o mês e ano escritos em caneta ("outubro de 2026") sobre uma linha de preencher. Logo acima da grade, a faixa impressa "Frequência de outubro" (`.cal-caption`: `paper-band`, Barlow Condensed 700 a 1rem em grafite, borda 1.5px `rule` sem a de baixo, raio só em cima) fica colada no topo da grade, como o cabeçalho de um quadro de chamada.

### Rodapé de folha
Ver Layout: filete, "Bloquinho" e "folha N de 3", no fim das três telas principais.

### Diário de jiu-jitsu
Quando a "outra atividade" do calendário tem nome que bate com jiu ou bjj, a folha de baixo ganha a seção `.bjj` (separada por um filete tracejado), e ela aparece ou some enquanto o nome é escrito:
- "de kimono / sem kimono": escolha circulada de caneta (`.tp`), uma só.
- "Rolas": botões redondos − + com o número e, ao lado, os risquinhos de contagem em caneta (`tally`) que acompanham o valor ao vivo.
- "Golpes que encaixei": etiquetas de escolha múltipla (`.tag`, lista fixa `BJJ_GOLPES`) e um campo de caneta para outro golpe, separado por vírgula.
- "O que aprendi hoje": área de escrever pautada (`textarea.lined`), ver Inputs.
Redesenhar a folha de baixo enquanto ela está aberta usa `.bsheet--still`, que não repete a subida.

No dia do calendário a sessão vira a ficha do diário (`.sess--bjj`): a escolha de kimono escrita de caneta (`.bjj-kimono`), rolas em risquinhos com o número de caneta ao lado, golpes encaixados como carimbinhos verdes pequenos (`.hl` em `--ok`, 0.75rem, cada um girado por `FX.hand`), e "O que aprendi" em caneta sobre linhas pautadas. O rodapé diz "diário de jiu-jitsu" no lugar de "outra atividade". Os dados vão em `session.details` (`tipo: 'bjj'`, kimono, rolas, golpes), gravados como JSON em `below_note` nas sessões `free`; o texto aprendido é a nota da sessão.

### Carimbo datador (signature)
Redondo, violeta, 44px (42 na semana, 30 no quadrinho), borda dupla, número Barlow Condensed 800 com o mês em 9px embaixo, `#ink` e `FX.hand`. Bate no quadrinho da série terminada e no dia treinado da semana e do calendário.

### Quadrinhos das séries
A grade de doses da caderneta de vacina: uma coluna por série, número "S1" impresso no canto, série atual com o valor circulado de caneta, série feita com reps × carga de caneta e o carimbo de data no canto, série que falhou em laranja.

### Post-it da série
Botão gigante que ocupa o resto da tela: amarelo, girado −1.1°, canto inferior direito dobrado (`postit-fold`), "Terminei a série" em caneta e "toca aqui" impresso. Ao terminar o bloco ele descola e voa (`peelOff`); o próximo cola caindo de cima (`postit-in`, 420ms).

### Carimbo do descanso
Anel violeta de 300px: aro grosso que some conforme o tempo passa, filete interno, "DESCANSO" e "SÉRIE 2 DE 3" em arco, duas estrelas e o número a 6.25rem, tudo com tinta irregular.

### Carimbo do veredito e da professora
Veredito: caixa alta, borda dupla retangular, girado −3°, na tinta do resultado, batendo (`slam`: entra a 190% e assenta em 420ms). Treino fechado com progresso: o percentual ganha um círculo de caneta verde desenhado e o carimbo redondo "MUITO BEM! •" com estrela dourada bate no canto do quadro.

### Movimento
Tudo em `js/fx.js`, com cara de mão mexendo na caderneta: lápis contorna o quadro novo e o conteúdo aparece escrito (`drawIn`, 750ms); borracha escolar esfrega, solta farelo (`--crumb`) e o espaço fecha (`eraseOut`, 640ms); post-it descola (`peelOff`); a folha vira (`flipPage`); carimbos batem e param, sem quicar (`--ease-stamp`); exercício feito tem o nome riscado em grafite e o carimbo de data no quadradinho; cada risquinho de rep é traçado na hora (`tally`). Toque 120ms, transição 250ms. Folha de baixo redesenhada sem fechar não sobe de novo (`.bsheet--still`). Com "reduzir movimento", nada anima e tudo aparece pronto.

## Do's and Don'ts

### Do:
- **Do** tirar toda cor, tamanho, espaço, raio e sombra de `css/tokens.css`; nenhuma regra de componente usa valor solto. Sombra de material nova vira um token `--sh-*`; raio novo cabe em `--r-box`, `--r-stamp`, `--r-sticker` ou `--r-cover`.
- **Do** fechar cada tela principal com o rodapé de folha (`.folio`) e mostrar dado do usuário como campo já preenchido: rótulo impresso, valor de caneta na linha.
- **Do** escrever em caneta (`--font-hand` × `--hand-k`, cor `--pen`) tudo que veio do usuário, e só isso.
- **Do** carimbar em violeta (`--stamp`, `#ink`, opacidade `--stamp-a`, girado por `FX.hand`) o que aconteceu: datas, descanso, avisos, vereditos.
- **Do** usar `--up` / `--keep` / `--down` / `--free` para qualquer resultado, ponto de gráfico ou bolinha do calendário.
- **Do** manter quadros retos (3px) com linhas `rule`, e cabeçalhos de quadro na faixa `paper-band`.
- **Do** dar a cada tela no máximo um botão principal da capa (`--go`), pintado com o token `--go`, não com `--cover`.
- **Do** pôr "voltar" e a ação da página como abas penduradas no topo da folha, e as seções principais só na barra de abas embaixo.
- **Do** desenhar ícone novo na mesma família de traço (grade de 24, linha 2 a 2.4, pontas redondas, `currentColor`).
- **Do** escrever faixa de reps com meia-risca na célula ("8–12") e por extenso na frase ("8 a 12 reps").
- **Do** manter alvos de toque com pelo menos 46px.
- **Do** escrever em português do dia a dia, em segunda pessoa e no tom de um parceiro de treino: "Toca no post-it", "Bola pra frente", "Tá na zona certa".
- **Do** fazer o botão dizer exatamente o que acontece: "Anotar no caderno", "Começar a 1ª série", "Anotar no calendário".
- **Do** tratar bloco como masculino e série como feminina: "próximo bloco, o último", "próxima série, a última".
- **Do** comparar sempre com referência: "Você progrediu +19% em relação ao treino de 11/10". Queda vem com contexto, nunca com bronca: "O que rolou hoje? … Acontece. Anota o motivo pra lembrar depois." A queda aparece em laranja, não em vermelho.
- **Do** escrever números em formato brasileiro: `22,5 kg`, `1.240`.

### Don't:
- **Don't** usar vermelho para "baixo", "caiu", "abaixo do normal" ou série falhada; isso é `--down` (laranja). Vermelho é só apagar, descartar, remover e erro.
- **Don't** pôr a fonte de caneta em botões, rótulos ou mensagens do app, nem texto impresso no lugar de um valor que o usuário digitou.
- **Don't** fazer carimbo reto, a 100% de tinta ou sem `#ink`.
- **Don't** arredondar quadros, botões ou campos; curva é só da capa, das abas, das pílulas e dos carimbos redondos.
- **Don't** pôr rótulo em caixa alta; caixa alta é da voz de carimbo.
- **Don't** criar cor só para um tema: o modo escuro troca os valores dos mesmos tokens, e os temas moram em `[data-theme]`.
- **Don't** usar caractere como ícone ("?", "←", "›"); ícone é desenho de traço ou forma em CSS.
- **Don't** trazer de volta o mundo anterior (folha inteira pautada com margem vermelha, espiral, canetão, marca-texto, fita adesiva, sombra deslocada de desenho animado) nem cards escuros com anel neon.
- **Don't** colar papel novo na página além do post-it da série e da estrelinha; na capa, só o adesivo do logo e as etiquetas de papel. Linhas de pautado dentro de um campo de escrever (`textarea.lined`, linhas de exercício) são formulário, não a folha pautada do mundo antigo.
