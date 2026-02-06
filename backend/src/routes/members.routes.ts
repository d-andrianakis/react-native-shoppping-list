import { Router } from 'express';
import * as membersController from '../controllers/membersController';
import { authenticateToken } from '../middleware/auth';
import { addMemberValidation } from '../utils/validators';

const router = Router({ mergeParams: true }); // mergeParams to access :listId from parent router

// All routes require authentication
router.use(authenticateToken);

router.get('/', membersController.getMembers);
router.post('/', addMemberValidation, membersController.addMember);
router.delete('/:userId', membersController.removeMember);
router.put('/:userId', membersController.updateMemberRole);

export default router;
