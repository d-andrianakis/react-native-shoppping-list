import { Router } from 'express';
import * as suggestionsController from '../controllers/suggestionsController';
import { authenticateToken } from '../middleware/auth';
import { suggestionQueryValidation } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', suggestionQueryValidation, suggestionsController.getSuggestions);
router.get('/common', suggestionsController.getCommonItems);
router.get('/category/:category', suggestionsController.getSuggestionsByCategory);

export default router;
