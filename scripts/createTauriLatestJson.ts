import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

interface TauriConfig {
  version: string;
}

const repoRoot = process.cwd();
const tauriDir = join(repoRoot, 'apps', 'ui', 'src-tauri');
const bundleDir = join(tauriDir, 'target', 'release', 'bundle', 'nsis');
const configPath = join(tauriDir, 'tauri.conf.json');

const config = JSON.parse(readFileSync(configPath, 'utf8')) as TauriConfig;
const version = config.version;
const releaseTag = process.env.TAURI_UPDATE_TAG || `v${version}`;
const repository = process.env.TAURI_UPDATE_REPO || 'NegrOlivares/anfpes-engine';
const notes = process.env.TAURI_UPDATE_NOTES || `Cesante Manager ${version}`;

const installer = readdirSync(bundleDir)
  .filter((file) => file.endsWith('_x64-setup.exe'))
  .sort()
  .at(-1);

if (!installer) {
  throw new Error(`No NSIS installer found in ${bundleDir}`);
}

const signaturePath = join(bundleDir, `${installer}.sig`);
if (!existsSync(signaturePath)) {
  throw new Error(`Missing updater signature: ${signaturePath}`);
}

// GitHub release uploads from the web UI normalize spaces in asset names to dots.
// Keep this overrideable in case we publish assets through another channel later.
const publishedInstallerName =
  process.env.TAURI_UPDATE_ASSET_NAME || installer.replaceAll(' ', '.');
const encodedInstaller = encodeURIComponent(publishedInstallerName);
const url =
  process.env.TAURI_UPDATE_URL ||
  `https://github.com/${repository}/releases/download/${releaseTag}/${encodedInstaller}`;

const manifest = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature: readFileSync(signaturePath, 'utf8').trim(),
      url,
    },
  },
};

const outputPath = join(bundleDir, 'latest.json');
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Wrote ${outputPath}`);
console.log(`Installer: ${basename(installer)}`);
console.log(`Published asset: ${publishedInstallerName}`);
console.log(`URL: ${url}`);
