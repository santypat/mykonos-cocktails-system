import { createReadStream } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const token = process.env.NETLIFY_AUTH_TOKEN;
const siteName = process.env.NETLIFY_SITE_NAME || 'mykonos-cocktails';

if (!token) {
  throw new Error('Missing NETLIFY_AUTH_TOKEN');
}

const api = 'https://api.netlify.com/api/v1';
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function request(pathname, options = {}) {
  const response = await fetch(`${api}${pathname}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    const detail = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(`${options.method || 'GET'} ${pathname} failed: ${response.status} ${detail}`);
  }
  return payload;
}

async function getOrCreateSite() {
  const sites = await request('/sites');
  const existing = sites.find((site) => site.name === siteName);
  if (existing) return existing;
  return request('/sites', {
    method: 'POST',
    body: JSON.stringify({ name: siteName })
  });
}

async function walk(dir, root = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath, root));
    } else if (entry.isFile()) {
      const relative = `/${path.relative(root, fullPath).replaceAll(path.sep, '/')}`;
      files.push({ fullPath, relative });
    }
  }

  return files;
}

async function sha1File(fullPath) {
  const buffer = await readFile(fullPath);
  return createHash('sha1').update(buffer).digest('hex');
}

async function uploadDeployFile(deployId, file) {
  const fileStat = await stat(file.fullPath);
  const response = await fetch(`${api}/deploys/${deployId}/files${file.relative}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(fileStat.size)
    },
    body: createReadStream(file.fullPath),
    duplex: 'half'
  });

  if (!response.ok) {
    throw new Error(`upload ${file.relative} failed: ${response.status} ${await response.text()}`);
  }
}

async function deploy(siteId) {
  const localFiles = await walk('dist');
  const files = {};
  const filesBySha = new Map();

  for (const file of localFiles) {
    const sha = await sha1File(file.fullPath);
    files[file.relative] = sha;
    filesBySha.set(sha, file);
  }

  const created = await request(`/sites/${siteId}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ files })
  });

  const required = created.required || [];
  for (const requiredItem of required) {
    const file = localFiles.find((candidate) => candidate.relative === requiredItem) || filesBySha.get(requiredItem);
    if (!file) throw new Error(`Netlify requested missing file ${requiredItem}`);
    await uploadDeployFile(created.id, file);
  }

  return request(`/deploys/${created.id}`);
}

const site = await getOrCreateSite();
const deployed = await deploy(site.id);

console.log(JSON.stringify({
  site_id: site.id,
  site_name: site.name,
  url: site.ssl_url || site.url,
  deploy_id: deployed.id,
  deploy_state: deployed.state
}, null, 2));
