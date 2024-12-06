import express from 'express';
import TaskController from '../controllers/tasks.js';
import { checkAdminRole } from '../middlewares/role.js';

const router = express.Router();

router.post('/create', checkAdminRole, TaskController.createTask);
router.get('/get', checkAdminRole, TaskController.getAllTasks);
router.put('/update/:title', TaskController.updateTask);
router.delete('/delete/:title', checkAdminRole, TaskController.deleteTask);
router.get('/sorted', TaskController.getSortedTasks);
router.get('/filtered', TaskController.getFilteredTasks);

export default router;
