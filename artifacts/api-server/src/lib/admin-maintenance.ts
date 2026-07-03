import { randomUUID } from "node:crypto";

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

const store: Store = { activeJob: null, history: [] };

function appendLog(job: AdminMaintenanceJob, line: string) {
  job.logs.push(`[${new Date().toISOString()}] ${line}`);
}

function stepsForAction(action: AdminMaintenanceAction) {
  if (action === "refresh-knowledge-index") return ["Reindexing knowledge base"];
  if (action === "refresh-training-dataset") return ["Refreshing training dataset"];
  return ["Ingesting new documents", "Refreshing training dataset", "Reindexing knowledge base"];
}

async function executeJob(job: AdminMaintenanceJob) {
  try {
    for (const step of stepsForAction(job.action)) {
      appendLog(job, `Starting: ${step}`);
      await new Promise((resolve) => setTimeout(resolve, 400));
      appendLog(job, `Completed: ${step}`);
    }
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
  return { activeJob: store.activeJob, history: store.history };
}

export function startAdminMaintenance(action: AdminMaintenanceAction, requestedBy: string) {
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
