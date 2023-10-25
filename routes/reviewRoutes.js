const express = require('express');
const reviewController = require('./../controllers/reviewController')
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true}); //by default each router only hav access to the parameters of their specific routes

//when id is in other route and we want to access that id or paramtr then we need to merge paramtrs
 
//Post /tour/23frt45556/reviews
//GET /tour/23frt45556/reviews

router.use(authController.protect);

router.route('/')
      .get(reviewController.getAllReview)
      .post(authController.restrictTo('user'), 
            reviewController.setTourUserIds, 
            reviewController.createReview)

router.route('/:id')
      .delete(authController.restrictTo('user', 'admin'),reviewController.deleteReview)
      .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
      .get(reviewController.getReview)

module.exports = router;      