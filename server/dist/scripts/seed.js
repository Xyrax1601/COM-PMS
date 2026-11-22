"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db_js_1 = require("../config/db.js");
const seedData_js_1 = require("../utils/seedData.js");
async function run() {
    try {
        await (0, db_js_1.connectDB)();
        await (0, seedData_js_1.seedDatabase)(true);
        await (0, db_js_1.closeDB)();
        console.log('[Seed] Database seeded and engine cleanly closed.');
        process.exit(0);
    }
    catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}
run();
