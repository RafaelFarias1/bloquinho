# Bloquinho

Caderno de treino com cara de caderno de papel: séries normais, técnicas avançadas, cardio e um calendário dos dias treinados. Cada pessoa tem a própria conta.

**No ar:** https://bloquinho-kappa.vercel.app

- **Séries normais**: séries × reps com descanso contado. Dá pra mudar a carga de uma série pra outra; no fim ele diz se sobe, mantém ou baixa a carga.
- **Técnicas**: Muscle Round (6 blocos de 4 reps com 10 s de descanso), Cluster set e Rest-pause, com blocos, reps e descanso ajustáveis.
- **Tempo (cardio)**: cronômetro com meta em minutos e distância opcional. Serve pra esteira, bike, corrida, prancha.
- **Só anotar**: "já fiz, só quero anotar" abre a conferência preenchida, sem cronômetro.
- **Calendário**: a semana na capa e o mês inteiro numa tela, com os dias treinados circulados e a cor do resultado (progrediu, manteve, abaixo do normal). Dá pra anotar outra atividade num dia (jiu-jitsu, futebol, corrida…).
- **Abaixo do normal**: quando o treino fecha com volume menor que o anterior, ou é encerrado antes de terminar, o app pergunta o motivo (sono, comida, cansaço, dor, pouco tempo…) e guarda junto do treino.
- **Progresso**: no fim de cada exercício e de cada treino, mostra quanto você progrediu em relação ao treino anterior.
- **Conta**: criar conta com e-mail, celular e senha; entrar com e-mail e senha; "esqueci a senha" manda um link.
- Funciona offline e pode ser instalado na tela do celular (PWA). O que você anota sem internet fica no aparelho e sobe quando conectar.

## Conta e banco (Supabase)

Projeto `bloquinho` no Supabase (ref `adwdrlpcxdxyuzicrdrw`, São Paulo). O esquema fica em `supabase/migrations/`:

- **Multitenant**: cada conta nova ganha um caderno (`tenants`) e entra nele como dona (`tenant_members`). Todo dado tem `tenant_id`, e o RLS só deixa ler e escrever nos cadernos de que a pessoa é membro.
- `profiles`: e-mail, celular (do cadastro) e preferências.
- `workouts` e `exercises`: os treinos montados.
- `sessions`: cada vez que um treino é feito (com o motivo, se ficou abaixo do normal) e as atividades avulsas do calendário.
- `exercise_logs`: cada exercício anotado (carga, cargas por série, reps, minutos, km, veredito).

O app guarda tudo no aparelho e sincroniza com a conta (`js/cloud.js`): o que mudou desde a última vez sobe; o que mudou em outro aparelho desce. Se dois aparelhos mexem na mesma coisa, vale o último que subiu. O caderno de antes do login vai pra primeira conta que entrar no aparelho.

Mudou o banco? Cria uma migration nova e sobe:

```bash
supabase migration new nome-da-mudanca
```

```bash
supabase db push --linked
```

A senha do banco fica em `.env.supabase` (fora do git). Configurações de login (sem confirmação de e-mail, endereços de volta do "esqueci a senha") ficam em `supabase/config.toml`, em `[remotes.producao]`, e sobem com `supabase config push`.

## Estrutura

```
index.html            casca da página
css/tokens.css        design tokens (cor, tipo, espaço, forma, movimento)
css/app.css           base, componentes e telas
js/app.js             telas, dados e regras do treino
js/cloud.js           conta e sincronização com o Supabase
js/config.js          endereço e chave publicável do Supabase
js/vendor/supabase.js supabase-js 2.118.0 (UMD), pra funcionar sem build e offline
js/fx.js              animações (lápis, borracha, carimbo, post-it, folha)
sw.js                 cache offline
manifest.webmanifest  instalação no celular
icons/, logo.svg      ícones e logo
supabase/             config e migrations do banco
DESIGN.md             padrão de design
```

Ao mudar CSS ou JS, troque o `?v=` em `index.html` e o `VERSION` em `sw.js` pra quem já tem o app instalado receber a versão nova.

## Rodar localmente

É um site estático, sem build. Ele usa a mesma conta da nuvem:

```bash
python3 -m http.server 8080
```

## Deploy

A Vercel está ligada a este repositório: cada push na `main` publica sozinho.
