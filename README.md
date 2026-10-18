# Bloquinho

Caderno de técnicas avançadas de musculação, com cara de caderno de papel.

- **Muscle Round**: 6 blocos de 4 reps com 10 s de descanso. Você toca no post-it a cada bloco, o app conta o descanso com bipe e voz e, no fim, diz se sobe, mantém ou baixa a carga.
- **Cluster set** e **Rest-pause**, com blocos, reps e descanso ajustáveis.
- Histórico por exercício e plano de carga pro próximo treino.
- Funciona offline e pode ser instalado na tela do celular (PWA).

Os dados ficam salvos no próprio aparelho (localStorage).

## Rodar localmente

É um site estático, sem build:

```bash
python3 -m http.server 8080
```

## Deploy

Hospedado na Vercel como site estático (`vercel --prod`).
