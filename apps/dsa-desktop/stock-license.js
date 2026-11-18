const os = require('os');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/** 与 Middle-Platform config.STOCK_OPEN_TOKEN 保持一致 */
const STOCK_OPEN_TOKEN = 'v1_stock_open_7Rk4WmN2pQ9xY6cH3dJ8sU1aV5zE0bF4qM2tX9nP6kY3';
const DEFAULT_STOCK_API_BASE = 'https://real-api.yunfm.cn';

function resolveStockApiBase(sourceEnv = process.env) {
  const raw = String(
    sourceEnv.DSA_STOCK_API_BASE || sourceEnv.STOCK_LICENSE_API_BASE || DEFAULT_STOCK_API_BASE
  )
    .trim()
    .replace(/\/+$/, '');
  return raw || DEFAULT_STOCK_API_BASE;
}

function getPrimaryMacAddress() {
  const ifaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(ifaces || {})) {
    for (const iface of ifaces[name] || []) {
      if (!iface || iface.internal) continue;
      const mac = String(iface.mac || '')
        .trim()
        .toUpperCase();
      if (!mac || mac === '00:00:00:00:00:00') continue;
      candidates.push(mac);
    }
  }
  return candidates[0] || '';
}

function requestJson(urlString, { method = 'GET', headers = {}, body = null, timeoutMs = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let url;
    try {
      url = new URL(urlString);
    } catch (error) {
      reject(error);
      return;
    }

    const transport = url.protocol === 'http:' ? http : https;
    const payload = body == null ? null : Buffer.from(JSON.stringify(body), 'utf8');
    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'http:' ? 80 : 443),
        path: `${url.pathname}${url.search}`,
        method,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'lotus-daily-stock-desktop',
          ...(payload
            ? {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': String(payload.length),
              }
            : {}),
          ...headers,
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          if (settled) return;
          settled = true;
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch (_error) {
            reject(new Error(`授权服务返回非 JSON（HTTP ${res.statusCode}）`));
            return;
          }
          resolve({ statusCode: res.statusCode || 0, data: json });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      if (!settled) {
        settled = true;
        reject(new Error('授权服务请求超时'));
      }
    });
    req.on('error', (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    if (payload) req.write(payload);
    req.end();
  });
}

async function stockOpenApi(pathname, { method = 'GET', body = null, query = null } = {}) {
  const base = resolveStockApiBase();
  const url = new URL(`${base}/api${pathname}`);
  if (query && typeof query === 'object') {
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  const response = await requestJson(url.toString(), {
    method,
    body,
    headers: {
      Authorization: `Bearer ${STOCK_OPEN_TOKEN}`,
      'X-Stock-Open-Token': STOCK_OPEN_TOKEN,
    },
  });
  const payload = response.data || {};
  if (payload.code !== 1) {
    throw new Error(payload.msg || `授权接口失败（HTTP ${response.statusCode}）`);
  }
  return payload.data || {};
}

function upsertEnvValues(envPath, updates) {
  const entries = Object.entries(updates || {}).filter(([key]) => key);
  if (!entries.length) return;
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }
  const lines = content.length ? content.split(/\r?\n/) : [];
  const pending = new Map(entries.map(([key, value]) => [key, value == null ? '' : String(value)]));
  const next = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return line;
    const key = match[1];
    if (!pending.has(key)) return line;
    const value = pending.get(key);
    pending.delete(key);
    return `${key}=${value}`;
  });
  for (const [key, value] of pending.entries()) {
    next.push(`${key}=${value}`);
  }
  while (next.length && next[next.length - 1] === '') next.pop();
  fs.writeFileSync(envPath, `${next.join('\n')}\n`, 'utf8');
}

const DEFAULT_REALAPI_MODELS = 'deepseek-v4.1-flash';

function resolveRealApiModels(license) {
  const raw = String(license?.real_api_models || DEFAULT_REALAPI_MODELS).trim();
  const models = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      // deepseek-chat / reasoner 已弃用；线上授权未升级前本地强制切到 flash
      if (item === 'deepseek-chat' || item === 'deepseek-reasoner') {
        return DEFAULT_REALAPI_MODELS;
      }
      return item;
    });
  return models.length ? [...new Set(models)].join(',') : DEFAULT_REALAPI_MODELS;
}

function applyRealApiCredentials(envPath, license) {
  const apiKey = String(license?.real_api_api_key || '').trim();
  const baseUrl = String(license?.real_api_base_url || `${resolveStockApiBase()}/v1`).trim();
  const models = resolveRealApiModels(license);
  if (!apiKey) {
    throw new Error('授权服务未返回 RealAPI 密钥');
  }
  upsertEnvValues(envPath, {
    LLM_CHANNELS: 'realapi',
    LLM_REALAPI_PROTOCOL: 'openai',
    LLM_REALAPI_API_SURFACE: 'chat_completions',
    LLM_REALAPI_BASE_URL: baseUrl,
    LLM_REALAPI_ENABLED: 'true',
    LLM_REALAPI_API_KEY: apiKey,
    LLM_REALAPI_API_KEYS: apiKey,
    LLM_REALAPI_MODELS: models,
  });
}

async function bootstrapStockLicense(envPath, { mac = getPrimaryMacAddress() } = {}) {
  if (!mac) {
    throw new Error('无法读取本机 MAC 地址，无法完成设备绑定');
  }
  const license = await stockOpenApi('/lotus/stock/open/bootstrap', {
    method: 'POST',
    body: { mac },
  });
  applyRealApiCredentials(envPath, license);
  return {
    ...license,
    mac_address: license.mac_address || mac,
  };
}

async function checkStockLicense({ mac = getPrimaryMacAddress() } = {}) {
  if (!mac) {
    throw new Error('无法读取本机 MAC 地址');
  }
  return stockOpenApi('/lotus/stock/open/license', {
    method: 'GET',
    query: { mac },
  });
}

async function createStockRenewSession({ mac = getPrimaryMacAddress() } = {}) {
  if (!mac) {
    throw new Error('无法读取本机 MAC 地址');
  }
  return stockOpenApi('/lotus/stock/open/renew-session', {
    method: 'POST',
    body: { mac },
  });
}

module.exports = {
  STOCK_OPEN_TOKEN,
  applyRealApiCredentials,
  bootstrapStockLicense,
  checkStockLicense,
  createStockRenewSession,
  getPrimaryMacAddress,
  resolveStockApiBase,
  upsertEnvValues,
};
