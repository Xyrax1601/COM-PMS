"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongodInstance = null;
const connectDB = async () => {
    const customUri = process.env.MONGODB_URI;
    if (customUri) {
        try {
            console.log(`[Database] Attempting connection to custom MONGODB_URI: ${customUri.replace(/\/\/.*@/, '//***@')}`);
            await mongoose_1.default.connect(customUri, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log('[Database] Connected successfully to custom MongoDB cluster');
            return customUri;
        }
        catch (err) {
            console.warn(`[Database] Custom MONGODB_URI failed (${err.message}). Falling back to local MongoDB engine.`);
        }
    }
    // Try standard local MongoDB server at mongodb://127.0.0.1:27017/compms
    try {
        const localUri = 'mongodb://127.0.0.1:27017/com_pms';
        await mongoose_1.default.connect(localUri, {
            serverSelectionTimeoutMS: 2000,
        });
        console.log('[Database] Connected to local MongoDB daemon (mongodb://127.0.0.1:27017/com_pms)');
        return localUri;
    }
    catch (err) {
        // Local daemon not running, spin up auto-provisioned MongoDB engine
        console.log('[Database] Local mongod daemon not detected. Auto-provisioning MongoDB engine...');
        const dataDir = path_1.default.resolve(process.cwd(), '../data/db_pms');
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        try {
            mongodInstance = await mongodb_memory_server_1.MongoMemoryServer.create({
                instance: {
                    dbName: 'com_pms',
                    storageEngine: 'wiredTiger',
                    dbPath: dataDir,
                },
            });
        }
        catch (storageErr) {
            console.warn('[Database] Persistent storage engine initialization note, falling back to embedded memory instance:', storageErr);
            mongodInstance = await mongodb_memory_server_1.MongoMemoryServer.create({
                instance: {
                    dbName: 'com_pms',
                },
            });
        }
        const uri = mongodInstance.getUri();
        await mongoose_1.default.connect(uri);
        console.log(`[Database] Auto-provisioned MongoDB running successfully at ${uri}`);
        return uri;
    }
};
exports.connectDB = connectDB;
const closeDB = async () => {
    try {
        await mongoose_1.default.disconnect();
    }
    catch { }
    if (mongodInstance) {
        try {
            await mongodInstance.stop();
        }
        catch (e) {
            // In case mongod process is still around, kill it
            try {
                const instanceProcess = mongodInstance.instanceInfo?.childProcess;
                if (instanceProcess && !instanceProcess.killed) {
                    instanceProcess.kill('SIGKILL');
                }
            }
            catch { }
        }
        mongodInstance = null;
    }
};
exports.closeDB = closeDB;
process.on('SIGINT', async () => {
    await (0, exports.closeDB)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.closeDB)();
    process.exit(0);
});
