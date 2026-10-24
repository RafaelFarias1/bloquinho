# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

O dono do app e pessoas próximas a ele (amigos, parceiros de treino), cada um com a própria conta. Usam no celular e no tablet, na academia, entre uma série e outra: com pressa, com a mão suada, olhando a tela por poucos segundos antes de voltar pro aparelho.

## Product Purpose

O Bloquinho é um caderno de treino. Ele conta as séries e o descanso, diz no fim de cada exercício se a carga sobe, mantém ou baixa, mostra quanto você progrediu em relação ao treino anterior e marca no calendário os dias treinados. Sucesso é a pessoa anotar o treino inteiro sem pensar no app e sair sabendo o que fazer na próxima vez.

## Positioning

Ele funciona e fala como um caderno de papel de academia, não como um app de fitness: você anota, risca, carimba e vira a folha. As regras das técnicas (Muscle Round, Cluster set, Rest-pause) ficam embutidas, então o caderno sabe dizer "sobe a carga" sem o usuário fazer conta.

## Operating Context

- Uso principal: celular ou tablet em pé, na academia, entre séries. Luz de academia, às vezes sol. Interação de poucos segundos.
- Tela de execução: cronômetro de descanso, post-it gigante pra tocar a cada bloco, voz e bipe avisando o fim do descanso, tela sempre acesa.
- Fora do treino: montar treinos e exercícios, ver o histórico e o calendário do mês.
- Funciona offline (academia com sinal ruim) e é instalado na tela inicial (PWA).

## Capabilities and Constraints

- Técnicas: Séries normais, Muscle Round, Cluster set, Rest-pause e Tempo (cardio). Cada uma com blocos, reps, descanso e meta ajustáveis.
- "Só anotar": registrar um treino já feito sem cronômetro.
- Veredito por exercício (sobe / mantém / baixa a carga) e comparação com o treino anterior.
- "Abaixo do normal": pergunta o motivo (sono, comida, cansaço, dor, pouco tempo…) e guarda junto do treino.
- Calendário: semana na capa e mês inteiro, com o resultado de cada dia e outras atividades (jiu-jitsu, corrida…).
- Conta com e-mail, celular e senha (Supabase), sincronização entre aparelhos, dados no aparelho quando offline.
- Site estático sem build: HTML, CSS e JS puros, deploy na Vercel. Animações próprias em `js/fx.js`.
- Termos: treino, exercício, série (feminino), bloco (masculino), carga, reps, descanso, veredito.

## Brand Commitments

- Nome **Bloquinho** e o logo atual (`logo.svg`): bloquinho de espiral com risquinhos de contagem em caneta azul, num quadrado amarelo.
- Tem que parecer um caderno/bloco de papel.
- O jeito de falar: português do dia a dia, segunda pessoa, tom de parceiro de treino ("Toca no post-it", "Bola pra frente").
- As animações de papel continuam: lápis desenhando, borracha apagando, carimbo batendo, post-it descolando, folha virando.
- Não pode ficar sério demais: frio ou corporativo, perdendo a graça e a personalidade.

## Evidence on Hand

- Logo e ícones em `logo.svg` e `icons/`.
- Textos reais de todas as telas em `js/app.js`.
- Não há depoimentos, números de usuários ou métricas; nada disso deve ser inventado.

## Product Principles

1. Um olhar basta: na academia, a informação da vez (descanso, bloco, carga) se lê de longe e em segundos.
2. O papel é a interface: cada ação é um gesto de caderno (anotar, riscar, carimbar, apagar, virar a folha).
3. O caderno decide a conta: o app aplica a regra da técnica e diz o que fazer, sem o usuário calcular.
4. Parceiro, não juiz: queda vem com contexto e acolhimento, nunca com bronca.
5. Funciona sem sinal: nada depende de internet pra anotar.

## Accessibility & Inclusion

Toque com dedo suado e olhar rápido: alvos grandes, números grandes, contraste alto sob luz forte. Respeitar "reduzir movimento" do aparelho.
