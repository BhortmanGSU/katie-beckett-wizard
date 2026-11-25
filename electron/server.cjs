// Built-in local HTTP server for Katie Beckett Helper.
// Serves the app to both the Electron desktop window and any phone/tablet on
// the family's home Wi-Fi or VPN, with a 4-digit Family PIN and live SSE sync.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');

const FIREWALL_RULE = 'Katie Beckett Helper (Phone Sync)';
const DEFAULT_PORT = 8421;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.gz': 'application/gzip',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function checkWindowsFirewall(port) {
  if (process.platform !== 'win32') return Promise.resolve({ supported: false, allowed: true });
  return new Promise((resolve) => {
    execFile('netsh', ['advfirewall', 'firewall', 'show', 'rule', `name=${FIREWALL_RULE}`], (err, stdout) => {
      if (err) return resolve({ supported: true, allowed: false });
      const text = String(stdout || '');
      const hasPort = !port || text.includes(String(port)) || text.includes('Any');
      resolve({ supported: true, allowed: hasPort });
    });
  });
}

function allowWindowsFirewall(port) {
  if (process.platform !== 'win32') return Promise.resolve({ supported: false, allowed: true });
  const safePort = Number(port) || DEFAULT_PORT;
  const cmd = [
    `netsh advfirewall firewall delete rule name="${FIREWALL_RULE}"`,
    `netsh advfirewall firewall add rule name="${FIREWALL_RULE}" dir=in action=allow protocol=TCP localport=${safePort} profile=private,public`,
  ].join(' & ');
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-WindowStyle',
        'Hidden',
        '-Command',
        `Start-Process -FilePath 'cmd.exe' -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '/c ${cmd}'`,
      ],
      async () => {
        resolve(await checkWindowsFirewall(safePort));
      },
    );
  });
}

function getLanAddresses(port, pin) {
  const nets = os.networkInterfaces();
  const list = [];
  for (const [name, addrs] of Object.entries(nets)) {
    for (const a of addrs || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      if (a.address.startsWith('169.254.')) continue;
      let label = name;
      if (/^100\./.test(a.address) || /tailscale/i.test(name)) label = `VPN / Tailscale (${name})`;
      else if (/zerotier/i.test(name)) label = `VPN / ZeroTier (${name})`;
      else if (/wireguard|wg/i.test(name)) label = `VPN / WireGuard (${name})`;
      else if (/wi-?fi|wlan|wireless/i.test(name)) label = `Home Wi-Fi (${name})`;
      else if (/ethernet/i.test(name)) label = `Home Network (${name})`;
      list.push({
        label,
        ip: a.address,
        url: `http://${a.address}:${port}`,
        pairUrl: `http://${a.address}:${port}/?pin=${pin}`,
      });
    }
  }
  list.sort((a, b) => {
    const score = (x) => (x.ip.startsWith('192.168.') ? 0 : x.ip.startsWith('10.') ? 1 : x.ip.startsWith('100.') ? 2 : 3);
    return score(a) - score(b);
  });
  return list;
}

function readBody(req, limitBytes = 60 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error('File is too large (over 60 MB).'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function json(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function startLocalServer({ distDir, dataDir, preferredPort = DEFAULT_PORT }) {
  const docsDir = path.join(dataDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });

  const pinFile = path.join(dataDir, 'pin.txt');
  let pin = '';
  if (fs.existsSync(pinFile)) {
    pin = fs.readFileSync(pinFile, 'utf8').trim();
  }
  if (!/^\d{4}$/.test(pin)) {
    pin = String(crypto.randomInt(1000, 10000));
    fs.writeFileSync(pinFile, pin, 'utf8');
  }

  const stateFile = path.join(dataDir, 'state.json');
  const sseClients = new Set();

  function broadcast(event, senderId) {
    const payload = `event: ${event}\ndata: ${JSON.stringify({ senderId, ts: Date.now() })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  function isLocalReq(req) {
    const addr = req.socket?.remoteAddress || '';
    return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
  }

  function checkPin(req, urlObj) {
    const provided = req.headers['x-kb-pin'] || urlObj.searchParams.get('pin') || '';
    return provided === pin;
  }

  const server = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url || '/', 'http://localhost');
    const pathname = decodeURIComponent(urlObj.pathname);

    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/ping' && req.method === 'GET') {
        return json(res, 200, {
          mode: 'local-server',
          unlocked: checkPin(req, urlObj),
          isLocalhost: isLocalReq(req),
        });
      }

      if (!checkPin(req, urlObj)) {
        return json(res, 401, { error: 'Please enter the 4-digit Family PIN shown on your computer.' });
      }

      const senderId = String(req.headers['x-kb-client'] || '');

      if (pathname === '/api/info' && req.method === 'GET') {
        const port = server.address().port;
        return json(res, 200, {
          port,
          pin,
          addresses: getLanAddresses(port, pin),
        });
      }

      if (pathname === '/api/firewall/status' && req.method === 'GET') {
        return json(res, 200, await checkWindowsFirewall(server.address().port));
      }

      if (pathname === '/api/firewall/allow' && req.method === 'POST') {
        if (!isLocalReq(req)) {
          return json(res, 403, { error: 'Please click this button on your computer.' });
        }
        return json(res, 200, await allowWindowsFirewall(server.address().port));
      }

      if (pathname === '/api/events' && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write(`event: connected\ndata: {}\n\n`);
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
        return;
      }

      if (pathname === '/api/state' && req.method === 'GET') {
        if (!fs.existsSync(stateFile)) return json(res, 200, { state: null });
        try {
          return json(res, 200, { state: JSON.parse(fs.readFileSync(stateFile, 'utf8')) });
        } catch {
          return json(res, 200, { state: null });
        }
      }

      if (pathname === '/api/state' && req.method === 'PUT') {
        try {
          const raw = await readBody(req);
          const parsed = JSON.parse(raw.toString('utf8'));
          const tmp = `${stateFile}.tmp`;
          fs.writeFileSync(tmp, JSON.stringify(parsed, null, 2), 'utf8');
          fs.renameSync(tmp, stateFile);
          broadcast('state', senderId);
          return json(res, 200, { ok: true });
        } catch (e) {
          return json(res, 400, { error: e.message });
        }
      }

      if (pathname === '/api/docs' && req.method === 'GET') {
        const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.json'));
        const docs = [];
        for (const f of files) {
          try {
            const meta = JSON.parse(fs.readFileSync(path.join(docsDir, f), 'utf8'));
            const binPath = path.join(docsDir, f.replace(/\.json$/, '.bin'));
            const bytesB64 = fs.existsSync(binPath) ? fs.readFileSync(binPath).toString('base64') : '';
            docs.push({ ...meta, bytesB64 });
          } catch {
            // skip
          }
        }
        return json(res, 200, { docs });
      }

      if (pathname === '/api/docs' && req.method === 'POST') {
        try {
          const raw = await readBody(req);
          const doc = JSON.parse(raw.toString('utf8'));
          const safeId = String(doc.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
          if (!safeId) return json(res, 400, { error: 'Invalid document id' });
          const { bytesB64, ...meta } = doc;
          fs.writeFileSync(path.join(docsDir, `${safeId}.json`), JSON.stringify(meta), 'utf8');
          if (typeof bytesB64 === 'string') {
            fs.writeFileSync(path.join(docsDir, `${safeId}.bin`), Buffer.from(bytesB64, 'base64'));
          }
          broadcast('docs', senderId);
          return json(res, 200, { ok: true });
        } catch (e) {
          return json(res, 400, { error: e.message });
        }
      }

      if (pathname.startsWith('/api/docs/') && req.method === 'DELETE') {
        const safeId = pathname.slice('/api/docs/'.length).replace(/[^a-zA-Z0-9_-]/g, '');
        if (safeId) {
          fs.rmSync(path.join(docsDir, `${safeId}.json`), { force: true });
          fs.rmSync(path.join(docsDir, `${safeId}.bin`), { force: true });
          broadcast('docs', senderId);
        }
        return json(res, 200, { ok: true });
      }

      if (pathname === '/api/clear' && req.method === 'POST') {
        fs.rmSync(stateFile, { force: true });
        for (const f of fs.readdirSync(docsDir)) {
          fs.rmSync(path.join(docsDir, f), { force: true });
        }
        broadcast('clear', senderId);
        return json(res, 200, { ok: true });
      }

      return json(res, 404, { error: 'Not found' });
    }

    // ---- Static files from dist/ with exact Content-Length & clean HEAD support ----
    const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    let target = path.normalize(path.join(distDir, rel));
    if (!target.startsWith(distDir) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      target = path.join(distDir, 'index.html');
    }
    if (!fs.existsSync(target)) {
      res.writeHead(404);
      return res.end('Not found');
    }

    try {
      const data = fs.readFileSync(target);
      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': data.length,
        'Cache-Control': ext === '.html' || path.basename(target) === 'sw.js' ? 'no-cache' : 'public, max-age=3600',
      });
      if (req.method === 'HEAD') return res.end();
      return res.end(data);
    } catch {
      res.writeHead(500);
      return res.end('Server error');
    }
  });

  // Retry preferredPort briefly (e.g. during an update while the old app is still exiting)
  // so the port stays reliably pinned to 8421 instead of jumping to a random port.
  return new Promise((resolve, reject) => {
    let retries = 8;
    const tryListen = (port) => {
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE' && port !== 0) {
          if (retries > 0) {
            retries--;
            setTimeout(() => tryListen(port), 300);
          } else {
            tryListen(0);
          }
        } else {
          reject(err);
        }
      });
      server.listen(port, '0.0.0.0', () => {
        const actualPort = server.address().port;
        resolve({
          port: actualPort,
          pin,
          close: () => server.close(),
        });
      });
    };
    tryListen(preferredPort);
  });
}

module.exports = { startLocalServer, DEFAULT_PORT };
