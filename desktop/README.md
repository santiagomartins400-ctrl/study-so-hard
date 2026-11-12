# Lumen Study para Windows

Aplicação Electron que abre a versão online do Lumen Study e instala-se no Windows como uma aplicação normal.

Versão atual: 1.0.0

## Desenvolvimento

```bash
cd desktop
npm install
npm start
```

## Gerar o instalador

```bash
npm run build:win
```

O instalador (NSIS) fica em `desktop/dist/`. Em produção, o workflow `.github/workflows/build-windows.yml` gera-o e publica-o numa release.

## Estrutura

- `main.js`: abre `https://santiagomartins400-ctrl.github.io/study-so-hard/app.html`. Se não houver Internet, abre a cópia em `app/`.
- `app/`: cópia da aplicação (atualizada pelo workflow a partir de `app.html`).
