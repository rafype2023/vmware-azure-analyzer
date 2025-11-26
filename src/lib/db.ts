import Database from 'better-sqlite3';
import { Server, MaintenanceWindow } from './types';
import path from 'path';

interface DBServerRow {
    id: string;
    hostname: string;
    ip_address: string;
    os: string;
    cores: number;
    memory_gb: number;
    storage_gb: number;
    migration_phase: string;
    migration_group: string;
    azure_config: string | null;
}

interface DBMaintenanceWindowRow {
    id: string;
    label: string;
    resource_groups: string;
    vnets: string;
    subnets: string;
    nsgs: string;
}

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'analyzer.db');
let dbInstance: Database.Database | null = null;

function getDb() {
    if (!dbInstance) {
        dbInstance = new Database(dbPath);
        // Initialize tables
        dbInstance.exec(`
          CREATE TABLE IF NOT EXISTS servers (
            id TEXT PRIMARY KEY,
            hostname TEXT,
            ip_address TEXT,
            os TEXT,
            cores INTEGER,
            memory_gb INTEGER,
            storage_gb INTEGER,
            ip_address TEXT,
            migration_phase TEXT,
            migration_group TEXT,
            azure_config TEXT
          );

          CREATE TABLE IF NOT EXISTS maintenance_windows (
            id TEXT PRIMARY KEY,
            label TEXT,
            resource_groups TEXT,
            vnets TEXT,
            subnets TEXT,
            nsgs TEXT
          );
        `);

        // Add migration_phase column if it doesn't exist (for existing DBs)
        try {
            dbInstance.exec('ALTER TABLE servers ADD COLUMN migration_phase TEXT');
        } catch {
            // Column likely already exists, ignore
        }

        // Add migration_group column if it doesn't exist (for existing DBs)
        try {
            dbInstance.exec('ALTER TABLE servers ADD COLUMN migration_group TEXT');
        } catch {
            // Column likely already exists, ignore
        }
    }
    return dbInstance;
}

export function getServers(): Server[] {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM servers');
    const rows = stmt.all() as DBServerRow[];
    return rows.map((row) => ({
        id: row.id,
        name: row.hostname, // Mapping hostname to name for frontend
        ipAddress: row.ip_address,
        migrationPhase: row.migration_phase,
        migrationGroup: row.migration_group,
        os: row.os,
        cores: row.cores,
        memoryGB: row.memory_gb,
        storageGB: row.storage_gb,
        azureConfig: row.azure_config ? JSON.parse(row.azure_config) : undefined,
    }));
}

export function upsertServer(server: Server) {
    const db = getDb();
    const stmt = db.prepare(`
    INSERT INTO servers (id, hostname, ip_address, migration_phase, migration_group, os, cores, memory_gb, storage_gb, azure_config)
    VALUES (@id, @name, @ipAddress, @migrationPhase, @migrationGroup, @os, @cores, @memoryGB, @storageGB, @azureConfig)
    ON CONFLICT(id) DO UPDATE SET
        hostname=excluded.hostname,
        ip_address=excluded.ip_address,
        migration_phase=excluded.migration_phase,
        migration_group=excluded.migration_group,
        os=excluded.os,
        cores=excluded.cores,
        memory_gb=excluded.memory_gb,
        storage_gb=excluded.storage_gb,
        azure_config=excluded.azure_config
    `);

    stmt.run({
        ...server,
        ipAddress: server.ipAddress || null,
        migrationPhase: server.migrationPhase || null,
        migrationGroup: server.migrationGroup || null,
        azureConfig: server.azureConfig ? JSON.stringify(server.azureConfig) : null
    });
}

export function getMaintenanceWindows(): MaintenanceWindow[] {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM maintenance_windows');
    const rows = stmt.all() as DBMaintenanceWindowRow[];
    return rows.map((row) => ({
        id: row.id,
        label: row.label,
        resourceGroups: JSON.parse(row.resource_groups || '[]'),
        vnets: JSON.parse(row.vnets || '[]'),
        subnets: JSON.parse(row.subnets || '[]'),
        nsgs: JSON.parse(row.nsgs || '[]'),
    }));
}

export function saveMaintenanceWindows(windows: MaintenanceWindow[]) {
    const db = getDb();
    const deleteStmt = db.prepare('DELETE FROM maintenance_windows');
    const insertStmt = db.prepare(`
    INSERT INTO maintenance_windows (id, label, resource_groups, vnets, subnets, nsgs)
    VALUES (@id, @label, @resourceGroups, @vnets, @subnets, @nsgs)
  `);

    const transaction = db.transaction((windows: MaintenanceWindow[]) => {
        deleteStmt.run();
        for (const w of windows) {
            insertStmt.run({
                id: w.id,
                label: w.label,
                resourceGroups: JSON.stringify(w.resourceGroups),
                vnets: JSON.stringify(w.vnets),
                subnets: JSON.stringify(w.subnets),
                nsgs: JSON.stringify(w.nsgs),
            });
        }
    });

    transaction(windows);
}
