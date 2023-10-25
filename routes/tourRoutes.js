const express = require('express');
const tourController = require('./../controllers/tourController')
const authController = require('./../controllers/authController');
// const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');
//const reviewRouter = require('./../routes/reviewRoutes');


//console.log(process.env);
const router = express.Router();

//Post /tour/343fgt467/reviews
//Get /tour/343fgt467/reviews
//Get /tour/343fgt467/reviews/787fghf78fh

//router.route('/:tourId/reviews').post(authController.protect, authController.restrictTo('user'), reviewController.createReview)
router.use('/:tourId/reviews', reviewRouter )  //router is the tour routes

//router.param('id', tourController.checkId);

router.route('/top-5-cheap')
      .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats')
      .get(tourController.getTourStats);    

router.route('/monthly-plan/:year')
      .get(authController.protect, 
            authController.restrictTo('admin', 'lead-guide', 'guide'), 
            tourController.monthlyPlan);       

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
      .get(tourController.getToursWithin);

router.route('/')
      .get(tourController.getAllTours)
      .post(authController.protect, 
            authController.restrictTo('admin', 'lead-guide'), 
            tourController.createTour);

router.route('/:id')
      .get(tourController.getTour)
      .patch(authController.protect, 
             authController.restrictTo('admin', 'lead-guide'),
             tourController.updateTour)
      .delete(authController.protect, 
              authController.restrictTo('admin', 'lead-guide'), 
              tourController.deleteTour);




module.exports = router

//mergeParams => advanced express features
//basically we will say that this tour router should use the review router incase it ever encounters a route like 