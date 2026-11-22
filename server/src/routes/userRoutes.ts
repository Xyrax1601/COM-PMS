import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
} from '../controllers/userController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetPassword);
router.delete('/:id', deleteUser);

export default router;
