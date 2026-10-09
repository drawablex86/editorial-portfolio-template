import fs from 'fs';
import path from 'path';

export interface PipelineConfig {
  vaultPath?: string;
  autoDetectT7?: boolean;
  enableLocalFallback?: boolean;
  archiveOriginalsDefault?: boolean;
  lastSetupAt?: number;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  vaultPath: '',
  autoDetectT7: true,
  enableLocalFallback: true,
  archiveOriginalsDefault: true,
};

const ROOT_DIR = process.cwd();
const SETTINGS_PATH = path.join(ROOT_DIR, 'content', 'settings', 'pipeline.json');
const DEFAULT_LOCAL_VAULT = path.join(ROOT_DIR, '.pipeline-vault');

export const KNOWN_T7_CANDIDATES = [
  '/Volumes/T7/code/ai-deterrence',
  '/Volumes/Samsung_T7/code/ai-deterrence',
  '/Volumes/T7',
  '/Volumes/Samsung_T7',
];

export function getPipelineConfig(): PipelineConfig {
  if (!fs.existsSync(SETTINGS_PATH)) {
    return { ...DEFAULT_PIPELINE_CONFIG };
  }
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PIPELINE_CONFIG, ...parsed };
  } catch (err) {
    console.error('Failed to read content/settings/pipeline.json:', err);
    return { ...DEFAULT_PIPELINE_CONFIG };
  }
}

export function savePipelineConfig(config: Partial<PipelineConfig>): { success: boolean; error?: string } {
  try {
    const current = getPipelineConfig();
    const updated = { ...current, ...config };
    const dir = path.dirname(SETTINGS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export type VaultSource = 'configured' | 'env' | 'auto_t7' | 'local_fallback' | 'unmounted';

export interface ResolvedVault {
  path: string | null;
  source: VaultSource;
  isReady: boolean;
  label: string;
}

/**
 * Resolves the active pipeline vault directory.
 * Priority:
 * 1. Configured vaultPath in content/settings/pipeline.json (if directory exists or can be resolved)
 * 2. PIPELINE_STORAGE_DIR or T7_STORAGE_DIR environment variables
 * 3. Auto-detected external drive mount (if autoDetectT7 is enabled)
 * 4. Local workspace vault (.pipeline-vault) if it exists
 */
export function resolveVaultDir(): ResolvedVault {
  const config = getPipelineConfig();

  // 1. Explicitly configured path
  if (config.vaultPath && config.vaultPath.trim().length > 0) {
    let resolved = config.vaultPath.trim();
    if (resolved.startsWith('.')) {
      resolved = path.resolve(ROOT_DIR, resolved);
    }
    if (fs.existsSync(resolved)) {
      return {
        path: resolved,
        source: 'configured',
        isReady: true,
        label: 'Configured Custom Vault',
      };
    }
    // Path was configured but is currently not mounted / missing
    return {
      path: resolved,
      source: 'configured',
      isReady: false,
      label: 'Configured Vault (Offline / Unmounted)',
    };
  }

  // 2. Environment variable overrides
  const envPath = process.env.PIPELINE_STORAGE_DIR || process.env.T7_STORAGE_DIR;
  if (envPath) {
    let resolved = envPath.trim();
    if (resolved.startsWith('.')) {
      resolved = path.resolve(ROOT_DIR, resolved);
    }
    if (fs.existsSync(resolved)) {
      return {
        path: resolved,
        source: 'env',
        isReady: true,
        label: 'Environment Override',
      };
    }
  }

  // 3. Auto-detect mounted external drives (e.g. /Volumes/T7, etc.)
  if (config.autoDetectT7 !== false) {
    for (const c of KNOWN_T7_CANDIDATES) {
      try {
        if (fs.existsSync(c)) {
          if (c.endsWith('ai-deterrence')) {
            return {
              path: c,
              source: 'auto_t7',
              isReady: true,
              label: 'External Vault (Auto-detected)',
            };
          }
          const sub = path.join(c, 'ai-deterrence');
          if (fs.existsSync(sub)) {
            return {
              path: sub,
              source: 'auto_t7',
              isReady: true,
              label: 'External Vault (Auto-detected)',
            };
          }
          return {
            path: c,
            source: 'auto_t7',
            isReady: true,
            label: 'External Vault (Auto-detected)',
          };
        }
      } catch {
        // volume permission error or unmounted
      }
    }
  }

  // 4. Local workspace vault fallback
  if (fs.existsSync(DEFAULT_LOCAL_VAULT)) {
    return {
      path: DEFAULT_LOCAL_VAULT,
      source: 'local_fallback',
      isReady: true,
      label: 'Local Workspace Vault (.pipeline-vault)',
    };
  }

  return {
    path: null,
    source: 'unmounted',
    isReady: false,
    label: 'No Vault Connected',
  };
}

/**
 * Initializes the directory structure required for the deterrence & media pipeline:
 * - stage-in/ (for Glaze / Nightshade input)
 * - stage-out/ (for Glaze / Nightshade outputs)
 * - masters-archive/ (for archiving raw high-res master assets)
 * - zines/ (for zine raw master PDFs and hi-res spreads)
 */
export function initVaultStructure(targetPath: string): {
  success: boolean;
  createdDirs: string[];
  error?: string;
} {
  try {
    let resolved = targetPath.trim();
    if (resolved.startsWith('.')) {
      resolved = path.resolve(ROOT_DIR, resolved);
    }

    const subdirs = [
      'stage-in',
      'stage-out',
      'masters-archive',
      path.join('zines', 'raw-masters'),
    ];

    const createdDirs: string[] = [];

    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
      createdDirs.push(resolved);
    }

    for (const sub of subdirs) {
      const full = path.join(resolved, sub);
      if (!fs.existsSync(full)) {
        fs.mkdirSync(full, { recursive: true });
        createdDirs.push(full);
      }
    }

    // Write a README.md inside the vault to explain directory roles
    const readmePath = path.join(resolved, 'README.md');
    if (!fs.existsSync(readmePath)) {
      const readmeContent = `# Portfolio AI Deterrence & Media Pipeline Vault\n
This directory acts as the offline / hardware vault for your portfolio assets.

## Directory Structure
- **\`stage-in/\`**: Place raw uncloaked artwork images here before feeding to Glaze / Nightshade.
- **\`stage-out/\`**: Place adversarial protected / perturbed output images here. When running the pipeline, images from here will automatically replace raw versions with high-DPI WebP.
- **\`masters-archive/\`**: When optimizing images, raw multi-megabyte master PNGs/JPEGs are moved here to keep your Git repository slim.
- **\`zines/\`**: Stores master PDF publications and high-res print spreads.
`;
      fs.writeFileSync(readmePath, readmeContent, 'utf-8');
    }

    return { success: true, createdDirs };
  } catch (err: any) {
    return { success: false, createdDirs: [], error: err.message };
  }
}
