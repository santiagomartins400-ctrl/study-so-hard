'use strict';
const path = require('path');
const { app, BrowserWindow, Menu, dialog, net, shell } = require('electron');

// Endereço publicado no GitHub Pages. A aplicação carrega sempre a versão mais recente.
const APP_URL = 'https://santiagomartins400-ctrl.github.io/study-so-hard/app.html';
// Cópia local da aplicação, usada se não houver ligação à Internet.
const COPIA_LOCAL = path.join(__dirname, 'app', 'app.html');

let janela = null;

function criarJanela() {
  janela = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 360,
    minHeight: 540,
    title: 'Lumen Study',
    backgroundColor: '#f3f4f8',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Links externos abrem no navegador predefinido, não dentro da aplicação.
  janela.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  janela.webContents.on('will-navigate', (evento, url) => {
    if (!url.startsWith(APP_URL.split('/app.html')[0]) && !url.startsWith('file:')) {
      evento.preventDefault();
      shell.openExternal(url);
    }
  });

  let voltouParaCopia = false;
  janela.webContents.on('did-fail-load', (_e, codigo, descricao, url, principal) => {
    if (!principal || voltouParaCopia || url.startsWith('file:')) return;
    voltouParaCopia = true;
    dialog.showMessageBox(janela, {
      type: 'warning',
      title: 'Sem ligação',
      message: 'Não consegui ligar-me ao serviço online.',
      detail: 'A abrir a cópia guardada no computador. Algumas funcionalidades, como as respostas da IA, precisam de Internet.'
    });
    janela.loadFile(COPIA_LOCAL).catch(() => {
      janela.webContents.loadURL(
        'data:text/html;charset=utf-8,' +
        encodeURIComponent('<h1>Lumen Study</h1><p>Não foi possível abrir a aplicação. Verifica a ligação à Internet e reinicia.</p>')
      );
    });
    console.error('Falha ao carregar', codigo, descricao);
  });

  janela.on('closed', () => { janela = null; });
  carregarAplicacao();
}

// Se o endereço online não responder com sucesso (sem Internet, ou GitHub Pages
// ainda não ativo), abre a cópia local em vez de mostrar uma página de erro.
async function carregarAplicacao() {
  let online = false;
  try {
    const resposta = await net.fetch(APP_URL, { method: 'HEAD' });
    online = resposta.ok;
  } catch (e) {
    online = false;
  }

  if (online) {
    janela.loadURL(APP_URL);
  } else {
    janela.loadFile(COPIA_LOCAL).catch(() => {
      janela.webContents.loadURL(
        'data:text/html;charset=utf-8,' +
        encodeURIComponent('<h1>Lumen Study</h1><p>Não foi possível abrir a aplicação. Reinstala a versão mais recente.</p>')
      );
    });
  }
}

// Instância única: se o utilizador abrir de novo, foca a janela existente.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (janela) {
      if (janela.isMinimized()) janela.restore();
      janela.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    criarJanela();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) criarJanela();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
