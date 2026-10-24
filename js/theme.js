/* Bloquinho: aplica o tema escolhido (claro ou escuro) antes da página aparecer, pra não piscar. */
(() => { try { const t = localStorage.getItem('bloquinho:theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch (e) {} })();
