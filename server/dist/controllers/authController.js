"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = require("../models/User.js");
const auth_js_1 = require("../middleware/auth.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required.' });
            return;
        }
        const user = await User_js_1.User.findOne({ email: String(email).toLowerCase().trim() });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid email or password.' });
            return;
        }
        if (user.status !== 'active') {
            res.status(403).json({ success: false, message: 'Account is deactivated. Contact an administrator.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid email or password.' });
            return;
        }
        user.last_login = new Date();
        await user.save();
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
        };
        const token = jsonwebtoken_1.default.sign(payload, auth_js_1.JWT_SECRET, { expiresIn: '24h' });
        await (0, auditLogger_js_1.logActivity)(payload, 'USER_LOGIN', 'User', user._id.toString(), { email: user.email, role: user.role }, req);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                last_login: user.last_login,
            },
        });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during login: ' + (err?.message || err) });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated.' });
            return;
        }
        const user = await User_js_1.User.findById(req.user.userId).select('-password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        res.json({ success: true, user });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getMe = getMe;
