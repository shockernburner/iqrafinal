import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { clearIqraRetrievalCaches } from "@/lib/iqra-retrieval";

export type AdminMaintenanceAction = "refresh-knowledge-index" | "refresh-training-dataset" | "refresh-all";

type AdminMaintenanceJob = {
  id: string;
  action: AdminMaintenanceAction;
  status: "running" | "succeeded" | "failed";
  requestedBy: string;
  startedAt: string;
  finishedAt: string | null;
  logs: string[];
  error: string | null;
};

type Store = {
  activeJob: AdminMaintenanceJob | null;
  history: AdminMaintenanceJob[];
};

const globalStore = globalThis as typeof globalThis & { iqraAdminMaintenance?: Store };

function getStore() {
  globalStore.iqraAdminMaintenance ??= {
    activeJob: null,
    history: [],
  };
  return globalStore.iqraAdminMaintenance;
}

function scriptsForAction(action: AdminMaintenanceAction) {
  if (action === "refresh-knowledge-index") {
    return ["build:index"];
  }

  if (action === "refresh-training-dataset") {
    return ["prepare:training"];
  }

  return ["ingest:once", "prepare:training", "build:index"];
}

function appendLog(job: AdminMaintenanceJob, line: string) {
  job.logs.push(`[${new Date().toISOString()}] ${line}`);
  if (job.logs.length > 120) {
    job.logs = job.logs.slice(-120);
  }
}

function runNpmScript(script: string, job: AdminMaintenanceJob) {
  return new Promise<void>((resolve, reject) => {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    appendLog(job, `Starting npm run ${script}`);

    const child = spawn(npmCommand, ["run", script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (data) => {
      const value = String(data).trim();
      if (value) appendLog(job, value);
    });

    child.stderr.on("data", (data) => {
      const value = String(data).trim();
      if (value) appendLog(job, value);
    });

    child.on("error", (error) => {
      appendLog(job, `Failed to start npm run ${script}: ${error.message}`);
      reject(error);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        appendLog(job, `Completed npm run ${script}`);
        resolve();
        return;
      }

      const error = new Error(`npm run ${script} failed with exit code ${code ?? "unknown"}`);
      appendLog(job, error.message);
      reject(error);
    });
  });
}

async function executeJob(job: AdminMaintenanceJob) {
  const store = getStore();

  try {
    for (const script of scriptsForAction(job.action)) {
      // Scripts must run in sequence to keep index and dataset generation consistent.
      await runNpmScript(script, job);
    }

    clearIqraRetrievalCaches();
    appendLog(job, "Cleared retrieval caches.");
    job.status = "succeeded";
    job.finishedAt = new Date().toISOString();
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Maintenance failed.";
    job.finishedAt = new Date().toISOString();
  } finally {
    store.activeJob = null;
    store.history = [job, ...store.history].slice(0, 10);
  }
}

export function getAdminMaintenanceStatus() {
  const store = getStore();
  return {
    activeJob: store.activeJob,
    history: store.history,
  };
}

export function startAdminMaintenance(action: AdminMaintenanceAction, requestedBy: string) {
  const store = getStore();

  if (store.activeJob) {
    return { started: false, activeJob: store.activeJob };
  }

  const job: AdminMaintenanceJob = {
    id: randomUUID(),
    action,
    status: "running",
    requestedBy,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    logs: [],
    error: null,
  };

  store.activeJob = job;
  void executeJob(job);

  return { started: true, activeJob: job };
}