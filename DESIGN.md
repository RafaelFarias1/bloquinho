# Padrão de design do Bloquinho

O Bloquinho é um **caderno de academia**: folha pautada, margem vermelha, espiral em cima, caneta azul, canetão preto, marca-texto e post-it. Tudo que aparece na tela tem que parecer algo que você faria num caderno de papel.

Os valores ficam em [`css/tokens.css`](css/tokens.css). Os componentes ficam em [`css/app.css`](css/app.css). Nenhuma regra de componente usa cor, tamanho ou espaço solto: tudo sai de um token.

## 1. Cor

Cada cor tem um papel e só aparece nesse papel.

| Token | Papel | Exemplo |
|---|---|---|
| `--paper` | a folha | fundo da página |
| `--card` | cartão colado na folha | cartões de treino, carimbo, folha de baixo |
| `--rule` / `--margin` / `--wire` | pauta, margem e espiral | só na folha |
| `--ink` | caneta azul: texto corrido | descrições, valores |
| `--marker` | canetão: títulos, contornos, números grandes | títulos, bordas, cronômetro |
| `--pencil` | lápis: legendas e notas | rótulos em caixa alta, datas |
| `--red` | caneta vermelha: correção, perigo, destaque | "apagar", falha no bloco, círculo em volta do progresso |
| `--hl-y` `--hl-g` `--hl-p` | marca-texto | botões, etiquetas de resultado |
| `--postit` | post-it | botão gigante da série, avisos |

**Semântica fixa (veredito e progresso):**

| Token | Significa | Cor |
|---|---|---|
| `--up` | sobe a carga / progrediu | marca-texto verde |
| `--keep` | mantém / igual | marca-texto amarelo |
| `--down` | baixa a carga / caiu | marca-texto rosa |

Texto em cima de marca-texto ou post-it é sempre `--on-hl`, nos dois temas.

O modo escuro é um "caderno preto com caneta gel": os mesmos tokens com outros valores. Nenhum componente define cor só para um tema.

## 2. Tipografia

Duas famílias, cada uma com uma função:

- **Permanent Marker** (`--font-display`) é o canetão. Serve para títulos, números grandes (cronômetro, bloco, carga) e o texto do post-it. Nunca vai em texto corrido.
- **Kalam** (`--font-hand`) é a letra de mão. Serve para todo o resto.

Escala (base 18px):

| Token | Tamanho | Uso |
|---|---|---|
| `--fs-xs` | 13px | rótulo em caixa alta (`.t-label`), etiquetas |
| `--fs-sm` | 15,5px | notas de lápis (`.t-note`) |
| `--fs-md` | 18px | texto corrido |
| `--fs-lg` | 21,6px | título de seção (`.t-section`), campos |
| `--fs-xl` | 27px | título de cartão (`.t-card`), carimbo |
| `--fs-2xl` | 34px | título da página (`.t-title`), carga, post-it |
| `--fs-3xl` | 45px | nome do app (`.t-hero`) |
| `--fs-hero` | 65px | número do bloco |
| `--fs-timer` | 100px | cronômetro do descanso |

Classes prontas: `.t-hero`, `.t-title`, `.t-section`, `.t-card`, `.t-label`, `.t-note`, `.t-muted`.

## 3. Espaço e forma

- **Espaço:** `--sp-1` a `--sp-7` (4, 8, 12, 16, 24, 32 e 48px). A pauta (`--line`, 32px) é a unidade maior. Espaço entre irmãos sai de `gap`, não de margem solta.
- **Contorno à mão:** `--r-a` e `--r-b` são os dois raios "tortos" que fazem a borda parecer desenhada. Elementos vizinhos alternam entre os dois.
- **Inclinação:** `--tilt-a` (−0,6°) e `--tilt-b` (0,5°) para cartões, e `--tilt-label` (−2°) para títulos e carimbos. É pouca coisa: o suficiente pra não parecer régua.
- **Sombra de desenho animado:** `--sh-1`, `--sh-2` e `--sh-3`. São deslocadas e sem desfoque. Ao apertar, o elemento desce 2px e a sombra diminui.
- **Bordas:** `--bw-thin` (1,5px), `--bw` (2px) e `--bw-thick` (2,5px), sempre em `--marker`.
- **Feito à mão:** nada é igual a nada. `FX.hand(chave, força)` sorteia contorno, inclinação, deslocamento e sombra a partir do id de cada coisa, então o mesmo treino sempre sai com a mesma cara e dois treinos nunca saem iguais. `FX.tapes(chave)` sorteia a fita adesiva: no meio, num canto ou nos dois, com largura, ângulo, transparência e pontas rasgadas diferentes. Força 1 nos cartões de treino, 0,7 nos quadradinhos dos blocos, 0,4 nos cartões do editor e 1,4 nas caixinhas de marcar.

## 4. Componentes

| Componente | Classe | Quando usar |
|---|---|---|
| Cartão | `.card` (+ `--flat`, `--b`, `--tilt-a`, `--tilt-b`) | qualquer bloco que "cola" na folha. `--flat` é o do dia a dia (sombra curta); o padrão, com sombra cheia, fica pro que se toca |
| Cartão de treino | `.card.hand.wcard` + `FX.hand()` + `FX.tapes()` | o único com fita adesiva; cada um com formato e fita próprios |
| Botão | `.btn` (+ `--go`, `--warn`, `--ghost`, `--wide`, `--xl`) | ação. Amarelo é o padrão, verde é a ação principal da tela, rosa é falha, tracejado é secundária |
| Botão redondo | `.btn-round` | contadores (− +), som, escolha de reps |
| Tecla | `.key` | ajuste rápido de carga (−2,5, −1, +1, +2,5) |
| Link | `.link` (+ `--danger`) | navegação e ações leves. Sublinhado ondulado de caneta |
| Etiqueta | `.chip` | nome da técnica |
| Variação | `.delta` (+ `--up`, `--keep`, `--down`) | qualquer comparação: +19%, +4 reps, "igual" |
| Marca-texto | `.hl` com `--c` | destaque curto ("Fim da série!", "Treino fechado!") |
| Grifo | `.under` | só em títulos de seção |
| Campo | `.field-wrap` + `.field` (+ `--display`) | texto. A linha embaixo é a pauta, e um lápis acompanha o que você escreve |
| Contador | `.stepper` | reps por bloco |
| Caixinha | `.toggle` + `.toggle-box` | liga/desliga |
| Carimbo | `.card.stamp` com `--c` | veredito da série |
| Tabela de comparação | `.compare-t` | antes × hoje |
| Círculo à mão | `.circled` | um único número que merece atenção (o progresso) |
| Risquinhos | `tally()` | contagem de reps: 4 riscos e o 5º cortando |
| Folha de baixo | `.backdrop` + `.card.bsheet` | perguntas rápidas e instruções |
| Aviso | `.toast` | confirmação depois de uma ação ("Anotado!") |

## 5. Movimento

O movimento conta que alguém está **mexendo num caderno de verdade**. Tudo fica em [`js/fx.js`](js/fx.js):

| O que acontece | Animação | Função |
|---|---|---|
| Criar treino ou exercício | um lápis contorna o cartão novo e o conteúdo aparece escrito | `drawIn` |
| Digitar um nome | o lápis do campo acompanha o texto e rabisca a cada letra | `penFollow` |
| Voltar do editor | os exercícios novos aparecem escritos, um depois do outro | `writeIn` |
| Apagar exercício, treino, registro, bloco ou série | a borracha bicolor de escola esfrega, solta farelo e o espaço fecha | `eraseOut` |
| Trocar de tela | a folha vira pra cima ao entrar e volta ao sair; a espiral fica parada | `flipPage` (View Transitions) |
| Terminar um bloco | o post-it descola e voa; no próximo bloco, um novo cola | `peelOff` + `.postit--in` |
| Fim da série | o veredito bate como carimbo e o destaque é pintado com marca-texto | `.stamp.is-new`, `.hl--swipe` |
| Exercício anotado | a caneta vermelha risca o nome e desenha o visto | `.ex.just-done` |
| Treino fechado com progresso | círculo vermelho no percentual e carimbo de professora "MUITO BEM!" | `.circled`, `teacherStamp` |
| Contar reps | cada risquinho é traçado na hora | `tally` |

Movimento desacelera suave, sem quicar: um carimbo bate e para. Durações: `--dur-fast` (120ms) para toque, `--dur` (250ms) para transições e `--dur-draw` (750ms) para desenho. Com "reduzir movimento" ligado no aparelho, nada anima e tudo aparece pronto.

## 6. Escrita

- Português do dia a dia, em segunda pessoa e no tom de um parceiro de treino: "Toca no post-it", "Bola pra frente", "Tá na zona certa".
- O botão diz exatamente o que acontece: "Anotar no caderno", "Começar a série".
- Comparação sempre com referência: "Você progrediu +19% em relação ao treino de 11/10". Queda vem acompanhada de contexto, nunca de bronca.
- Números em formato brasileiro: `22,5 kg`, `1.240`.
