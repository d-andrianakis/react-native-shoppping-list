import { Router } from 'express';
import * as listsController from '../controllers/listsController';
import { authenticateToken } from '../middleware/auth';
import { createListValidation, updateListValidation } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', listsController.getLists);
router.post('/', createListValidation, listsController.createList);
router.get('/:id', listsController.getListById);
router.put('/:id', updateListValidation, listsController.updateList);
router.delete('/:id', listsController.deleteList);
router.patch('/:id/archive', listsController.archiveList);

export default router;
