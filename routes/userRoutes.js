const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();
//router is kind of a mini app. so 
//like with the other app we can use middleware on this router
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword); //which will only recieve the email addresses
router.patch('/resetPassword/:tokengen', authController.resetPassword); 


//so we can add a middlewar on that router
//Protect all routes after this middleware
router.use(authController.protect);
router.patch('/updateMyPassword', authController.updatePassword );
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'))
router.route('/')
      .get(userController.getAllUsers)
      .post(userController.createUser);

router.route('/:id')
      .get(userController.getUser)
      .patch(userController.updateUsers)
      .delete(userController.deleteUsers);


// router.patch('/updateMyPassword', authController.protect, authController.updatePassword );
// router.patch('/updateMe', authController.protect, userController.updateMe);
// router.delete('/deleteMe', authController.protect, userController.deleteMe);
// router.get('/me', authController.protect, userController.getMe, userController.getUser);

// router.route('/')
//       .get(authController.protect, userController.getAllUsers)
//       .post(userController.createUser);

// router.route('/:id')
//       .get(userController.getUser)
//       .patch(userController.updateUsers)
//       .delete(authController.protect, userController.deleteUsers);


module.exports = router;