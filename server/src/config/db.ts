import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodInstance: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<string> => {
  const customUri = process.env.MONGODB_URI;

  if (customUri) {
    try {
      console.log(`[Database] Attempting connection to custom MONGODB_URI: ${customUri.replace(/\/\/.*@/, '//***@')}`);
      await mongoose.connect(customUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('[Database] Connected successfully to custom MongoDB cluster');
      return customUri;
    } catch (err: any) {
      console.warn(`[Database] Custom MONGODB_URI failed (${err.message}). Falling back to local MongoDB engine.`);
    }
  }

  // Try standard local MongoDB server at mongodb://127.0.0.1:27017/compms
  try {
    const localUri = 'mongodb://127.0.0.1:27017/com_pms';
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('[Database] Connected to local MongoDB daemon (mongodb://127.0.0.1:27017/com_pms)');
    return localUri;
  } catch (err) {
    // Local daemon not running, spin up auto-provisioned MongoDB engine
    console.log('[Database] Local mongod daemon not detected. Auto-provisioning MongoDB engine...');
    const dataDir = path.resolve(process.cwd(), '../data/db_pms');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'com_pms',
          storageEngine: 'wiredTiger',
          dbPath: dataDir,
        },
      });
    } catch (storageErr) {
      console.warn('[Database] Persistent storage engine initialization note, falling back to embedded memory instance:', storageErr);
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'com_pms',
        },
      });
    }

    const uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    console.log(`[Database] Auto-provisioned MongoDB running successfully at ${uri}`);
    return uri;
  }
};

export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
  } catch {}
  if (mongodInstance) {
    try {
      await mongodInstance.stop();
    } catch (e) {
      // In case mongod process is still around, kill it
      try {
        const instanceProcess = (mongodInstance as any).instanceInfo?.childProcess;
        if (instanceProcess && !instanceProcess.killed) {
          instanceProcess.kill('SIGKILL');
        }
      } catch {}
    }
    mongodInstance = null;
  }
};

process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});
