const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController'); // Ensure correct case
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Protected routes
router.use(authMiddleware);
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.delete('/:id', UserController.deleteUser);

// Admin only routes


console.log(UserController);

module.exports = router;
