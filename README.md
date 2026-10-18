# Bloquinho

Caderno de técnicas avançadas de musculação, com cara de caderno de papel.

**No ar:** https://bloquinho-kappa.vercel.app

- **Muscle Round**: 6 blocos de 4 reps com 10 s de descanso. Você toca no post-it a cada bloco, o app conta o descanso com bipe e voz e, no fim, diz se sobe, mantém ou baixa a carga.
- **Cluster set** e **Rest-pause**, com blocos, reps e descanso ajustáveis.
- **Progresso**: no fim de cada série e de cada treino, mostra quanto você progrediu em relação ao treino anterior (carga, reps e volume).
- Histórico por exercício e plano de carga pro próximo treino.
- Funciona offline e pode ser instalado na tela do celular (PWA).

Os dados ficam salvos no próprio aparelho (localStorage).

## Estrutura

```
index.html            casca da página
css/tokens.css        design tokens (cor, tipo, espaço, forma, movimento)
css/app.css           base, componentes e telas
js/app.js             o app inteiro, sem build
sw.js                 cache offline
manifest.webmanifest  instalação no celular
icons/, logo.svg      ícones e logo
DESIGN.md             padrão de design
```

Ao mudar CSS ou JS, troque o `?v=` em `index.html` e o `VERSION` em `sw.js` pra quem já tem o app instalado receber a versão nova.

## Rodar localmente

É um site estático, sem build:

```bash
python3 -m http.server 8080
```

## Deploy

A Vercel está ligada a este repositório: cada push na `main` publica sozinho.
