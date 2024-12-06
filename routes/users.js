import express from 'express';
import UserController from '../controllers/users.js';
import { checkAdminRole } from '../middlewares/role.js';

const router = express.Router();

router.post('/login', UserController.login);
router.post('/register', UserController.register);
router.get('/findall', checkAdminRole, UserController.findall);
router.get('/findbyname/:name', checkAdminRole, UserController.findbyname);
router.get('/tasks/:name',UserController.gettasks);
router.put('/updateuser/:name', checkAdminRole,UserController.updateuser);
router.delete('/deleteuser/:name', checkAdminRole, UserController.deleteuser);

export default router;
