const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./../controllers/handlerFactoryFun');


// exports.createReview = catchAsync(async (req, res, next) =>{
//     console.log(req.body, "----review body---");
//     //Allow nested routes
//     if(!req.body.tour) req.body.tour = req.params.tourId;
//     if(!req.body.user) req.body.user = req.user.id;

//     const newReview = await Review.create(req.body)
// console.log("-newReview--------", newReview)
//     res.status(201).json({
//         status: 'success',
//         data: {
//             review: newReview
//         }
//     })
// });


//we have some additional steps like nested routes wala which is not in our generic code createOne wala so to fix that we gonna make a middeware
//which going to run before createReview
//creating a middleware
exports.setTourUserIds =  ( req, res, next ) => {
//Allow nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    next();
};

exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview    = factory.getOne(Review);

exports.getAllReview = factory.getAll(Review)
catchAsync(async (req, res, next)=>{
    console.log("------------------------req.params.tourId------------------------", req.params.tourId)
    let filter;
    if(req.params.tourId) filter = { tour: req.params.tourId};
    console.log("----------------fileter--------------", filter)
    const reviews = await Review.find(filter);
console.log("---getting all reviews----", reviews)
    res.status(200).json({
        status: "success",
        result: reviews.length,
        data:{
            reviews
        }
    })
});
