import { Router } from 'express';
import * as itemsController from '../controllers/itemsController';
import { authenticateToken } from '../middleware/auth';
import { createItemValidation, updateItemValidation } from '../utils/validators';

const router = Router({ mergeParams: true }); // mergeParams to access :listId from parent router

// All routes require authentication
router.use(authenticateToken);

router.get('/', itemsController.getItems);
router.post('/', createItemValidation, itemsController.addItem);
router.put('/:itemId', updateItemValidation, itemsController.updateItem);
router.delete('/:itemId', itemsController.deleteItem);
router.patch('/:itemId/check', itemsController.toggleCheck);
router.post('/clear-checked', itemsController.clearChecked);
router.post('/reorder', itemsController.reorderItems);

export default router;
