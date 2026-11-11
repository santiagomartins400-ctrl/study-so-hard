#!/usr/bin/env node
// Uso: node scripts/bump-version.mjs X.Y.Z
// Sobe a versão em desktop/package.json, desktop/README.md, o workflow,
// index.html e sw.js (nome da cache: app-vX-Y).
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const versao = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(versao ?? '')) {
  console.error('Uso: node scripts/bump-version.mjs X.Y.Z');
  process.exit(1);
}

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [major, minor] = versao.split('.');

const alteracoes = [
  {
    ficheiro: 'desktop/package.json',
    trocar: (t) => t.replace(/("version":\s*")\d+\.\d+\.\d+(")/, `$1${versao}$2`)
  },
  {
    ficheiro: 'desktop/README.md',
    trocar: (t) => t.replace(/(Versão\s+)\d+\.\d+\.\d+/g, `$1${versao}`)
  },
  {
    ficheiro: '.github/workflows/build-windows.yml',
    trocar: (t) => t.replace(/(APP_VERSION:\s*")\d+\.\d+\.\d+(")/, `$1${versao}$2`)
  },
  {
    ficheiro: 'index.html',
    trocar: (t) => t.replace(/v\d+\.\d+\.\d+/g, `v${versao}`)
  },
  {
    ficheiro: 'sw.js',
    trocar: (t) => t.replace(/const CACHE = 'app-v\d+-\d+';/, `const CACHE = 'app-v${major}-${minor}';`)
  }
];

for (const { ficheiro, trocar } of alteracoes) {
  const caminho = path.join(raiz, ficheiro);
  const original = await readFile(caminho, 'utf8');
  const novo = trocar(original);
  if (novo === original) {
    console.warn(`Sem alterações em ${ficheiro} (já estava na versão ${versao}, ou o padrão não foi encontrado).`);
    continue;
  }
  await writeFile(caminho, novo, 'utf8');
  console.log(`Atualizado: ${ficheiro}`);
}

console.log(`Versão ${versao} pronta. Cache do service worker: app-v${major}-${minor}.`);
