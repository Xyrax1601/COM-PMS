"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.resetPassword = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_js_1 = require("../models/User.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const getUsers = async (req, res) => {
    try {
        const users = await User_js_1.User.find().select('-password').sort({ created_at: -1 });
        res.json({ success: true, users });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    try {
        const { name, email, password, role = 'viewer' } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
            return;
        }
        const cleanEmail = String(email).toLowerCase().trim();
        const existing = await User_js_1.User.findOne({ email: cleanEmail });
        if (existing) {
            res.status(400).json({ success: false, message: 'A user with this email already exists.' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await User_js_1.User.create({
            name: String(name).trim(),
            email: cleanEmail,
            password: hashedPassword,
            role: role,
            status: 'active',
        });
        await (0, auditLogger_js_1.logActivity)(req.user, 'CREATE_USER', 'User', user._id.toString(), { name: user.name, email: user.email, role: user.role }, req);
        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, status } = req.body;
        const user = await User_js_1.User.findById(id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        if (name)
            user.name = String(name).trim();
        if (role)
            user.role = role;
        if (status)
            user.status = status;
        await user.save();
        await (0, auditLogger_js_1.logActivity)(req.user, 'UPDATE_USER', 'User', user._id.toString(), { role: user.role, status: user.status }, req);
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateUser = updateUser;
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
            return;
        }
        const user = await User_js_1.User.findById(id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        user.password = await bcryptjs_1.default.hash(newPassword, 10);
        await user.save();
        await (0, auditLogger_js_1.logActivity)(req.user, 'RESET_PASSWORD', 'User', user._id.toString(), { email: user.email }, req);
        res.json({ success: true, message: 'Password reset successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.resetPassword = resetPassword;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user?.userId === id) {
            res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
            return;
        }
        const user = await User_js_1.User.findByIdAndDelete(id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        await (0, auditLogger_js_1.logActivity)(req.user, 'DELETE_USER', 'User', String(id), { email: user.email }, req);
        res.json({ success: true, message: 'User deleted successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteUser = deleteUser;
