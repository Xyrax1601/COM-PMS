"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patient = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PatientSchema = new mongoose_1.Schema({
    patient_id: { type: String, required: true, unique: true, index: true },
    complete_name: { type: String, required: true, trim: true, index: true },
    philhealth_number: { type: String, trim: true, default: '', index: true },
    date_registered: { type: Date, default: null },
    birthday: { type: Date, default: null },
    age: { type: Number, default: null },
    sex: { type: String, enum: ['M', 'F', 'Other', ''], default: '' },
    address: { type: String, trim: true, default: '' },
    contact_number: { type: String, trim: true, default: '' },
    patient_status: {
        type: String,
        enum: [
            'Registered and Completed FPE and Consultation',
            'Registered but No FPE',
            'Completed FPE but No Consultation',
            'Completed FPE but Not Registered',
            'FPE and Consultation but not registered',
            'Pending Follow-up',
            'Archived',
        ],
        default: 'Registered but No FPE',
        index: true,
    },
    is_archived: { type: Boolean, default: false, index: true },
    archive_reason: { type: String, default: '' },
    historical_notes: { type: String, default: '' },
    created_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
PatientSchema.index({ complete_name: 'text', philhealth_number: 'text', address: 'text' });
exports.Patient = mongoose_1.default.model('Patient', PatientSchema);
