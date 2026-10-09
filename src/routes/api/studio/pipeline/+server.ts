import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
  getPipelineStatus,
  stageForAI,
  optimizeImages,
  resolveT7Dir,
} from '$lib/server/pipeline';
import {
  getPipelineConfig,
  savePipelineConfig,
  resolveVaultDir,
  initVaultStructure,
} from '$lib/server/pipelineSettings';

export async function GET() {
  if (!dev && !process.env.STUDIO_ENABLED) {
    throw error(403, 'Pipeline status inspection is restricted in production.');
  }

  try {
    const status = getPipelineStatus();
    const config = getPipelineConfig();
    const resolvedVault = resolveVaultDir();
    return json({
      success: true,
      status,
      config,
      resolvedVault,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    throw error(500, err.message || 'Failed to inspect pipeline status');
  }
}

export async function POST({ request }) {
  if (!dev && !process.env.STUDIO_ENABLED) {
    throw error(403, 'Studio pipeline execution is restricted in production.');
  }

  let body: {
    action?: 'dry-run' | 'stage-ai' | 'optimize' | 'full' | 'setup-vault' | 'save-config';
    archiveOriginals?: boolean;
    stageAiFirst?: boolean;
    vaultPath?: string;
    autoDetectT7?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = body.action || 'dry-run';
  const archiveOriginals = body.archiveOriginals !== false;
  const stageAiFirst = !!body.stageAiFirst;

  const logs: string[] = [];
  const captureLog = (msg: string) => {
    logs.push(msg);
    console.log(`[Studio Pipeline] ${msg}`);
  };

  try {
    // 1. Vault Configuration Action
    if (action === 'save-config') {
      captureLog('Saving pipeline vault configuration...');
      const res = savePipelineConfig({
        vaultPath: body.vaultPath !== undefined ? body.vaultPath : undefined,
        autoDetectT7: body.autoDetectT7 !== undefined ? body.autoDetectT7 : undefined,
      });
      if (!res.success) {
        throw new Error(res.error || 'Failed to save pipeline configuration');
      }
      captureLog('Configuration successfully updated.');
      return json({
        success: true,
        action,
        logs,
        config: getPipelineConfig(),
        status: getPipelineStatus(),
        resolvedVault: resolveVaultDir(),
      });
    }

    // 2. First-Time Setup Action
    if (action === 'setup-vault') {
      captureLog('Running First-Time Pipeline Vault Setup...');
      let targetPath = body.vaultPath;
      if (!targetPath) {
        const resolved = resolveVaultDir();
        targetPath = resolved.path || '.pipeline-vault';
      }
      captureLog(`Target Vault Path: ${targetPath}`);
      const initRes = initVaultStructure(targetPath);
      if (!initRes.success) {
        throw new Error(initRes.error || 'Failed to scaffold vault directories');
      }
      captureLog(`Scaffolded directories:`);
      for (const d of initRes.createdDirs) {
        captureLog(` + ${d}`);
      }

      savePipelineConfig({
        vaultPath: targetPath,
        lastSetupAt: Date.now(),
      });
      captureLog('Vault setup complete & configuration persisted.');

      return json({
        success: true,
        action,
        logs,
        initResult: initRes,
        config: getPipelineConfig(),
        status: getPipelineStatus(),
        resolvedVault: resolveVaultDir(),
      });
    }

    captureLog(`Initiating pipeline action: ${action.toUpperCase()}`);
    const resolvedVault = resolveVaultDir();
    const t7Dir = resolvedVault.path;
    captureLog(t7Dir ? `Vault located at: ${t7Dir} (${resolvedVault.label})` : `Operating in local-safe mode (Vault not detected)`);

    let stageResult = null;
    let optimizeResult = null;

    if (action === 'stage-ai' || (action === 'full' && stageAiFirst)) {
      captureLog('--- Starting AI Deterrence Staging ---');
      try {
        stageResult = await stageForAI(captureLog);
      } catch (stageErr: any) {
        captureLog(`⚠️ Stage warning/error: ${stageErr.message}`);
        if (action === 'stage-ai') {
          return json(
            {
              success: false,
              action,
              logs,
              error: stageErr.message,
            },
            { status: 400 }
          );
        }
      }
    }

    if (action === 'dry-run') {
      captureLog('--- Running Dry-Run Simulation ---');
      optimizeResult = await optimizeImages(
        {
          dryRun: true,
          archiveOriginals: false,
        },
        captureLog
      );
    } else if (action === 'optimize' || action === 'full') {
      captureLog('--- Running Image Optimization & Conversion ---');
      optimizeResult = await optimizeImages(
        {
          dryRun: false,
          archiveOriginals: archiveOriginals && !!t7Dir,
        },
        captureLog
      );
    }

    const currentStatus = getPipelineStatus();

    return json({
      success: true,
      action,
      logs,
      stageResult,
      optimizeResult,
      currentStatus,
    });
  } catch (err: any) {
    captureLog(`❌ Pipeline Failure: ${err.message}`);
    return json(
      {
        success: false,
        action,
        logs,
        error: err.message || 'Pipeline execution failed',
      },
      { status: 500 }
    );
  }
}
