const { query } = require('express');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactoryFun');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '4';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratingsAverage,summary,difficulty';

  next();
};

exports.createTour = factory.createOne(Tour);
exports.getAllTours = factory.getAll(Tour);

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   console.log(req.query, 'Sanjnajnajanjana9999999999999999999999999999999999999999999999');
  // Build Query
  //1A.) Filtering
  // const queryObj =  { ...req.query };
  // const excludedFields = ['page', 'sort', 'limit', 'fields'];
  // excludedFields.forEach(el => delete queryObj[el])

  //1.BAdvanced Filtering
  //basically the filter object looks like
  // { difficulty: 'easy', duration: { $gte:5 }}  //we need to start new obj whenever we want to use operator

  //Query object ---> from query string (console.log(req.query)) .....[gte]=5&duration=easy
  // {difficulty: 'easy', duration: { gte: '5'}}
  //console.log("KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",JSON.stringify(queryObj) )
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match =>`$${match}`);
  // console.log(JSON.parse(queryStr), "sanjanajnaananannanan")
  //------------------------------------------------------------------------------------------------
  //we have 2 ways to query the database
  // const tours = await Tour.find({
  //   duration: 5,
  //   difficulty: 'easy'
  // });

  //2. with mongooose method
  //  const tours = await Tour.find()
  //                          .where('duartion')
  //                          .equals(5)
  //                          .where('difficulty')
  //                          .equals('easy')

  //1. const query = Tour.find(queryObj)
  //2.
  // const query = Tour.find(JSON.parse(queryStr))
  //let query = Tour.find(JSON.parse(queryStr))

  //console.log('MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM', req.query);

  //Execute Query
  //main start----------------
//   const feature = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sorting()
//     .limitFields()
//     .paginated();
//   //const tours = await Tour.find(req.query)
//   //const tours = await query
//   const tours = await feature.query;

//   //SEND RESPONSE
//   res.status(201).json({
//     status: 'success',
//     result: tours.length,
//     data: {
//       tour: tours,
//     },
//   });
// });

exports.getTour = factory.getOne(Tour , {"path": 'reviews'})

exports.updateTour =factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = async (req, res) => {
//   try {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }

//     return res.status(204).json({
//       status: 'success',
//       data: null,
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

//Aggregation Pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // //  _id: null,     //this will group the result of the whole documents together
        _id: { $toUpper: '$difficulty' }, //this will group the result based on the difficulty level
        // _id: '$ratingsAverage',
        numOfTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: -1 }, //1 for ascending
    },
    // {
    //   $match: { _id: { $ne: 'EASY'}}  //we can repeat the stages
    // }
  ]);

  res.status(201).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

//Aggregation: umwinding and projecting
exports.monthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;
  console.log(year, 'SSSSSSSSSSSSSSSSSSSSSS', req.query);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    // {
    //   $limit: 5
    // }
  ]);
  res.status(201).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/-40,45/unit/mi
exports.getToursWithin = (req, res, next) =>{
  const { distance, latlng, unit } = req.params;
  const [ lat, lng] = latlng.split(', ');

  if(!lat || !lng ){
    next(new AppError("Please provide latitude and longitude in the format lat, lng.", 400))
  }

  console.log(distance, lat, lng, unit);

  res.status(200).json({
    status: "success"
  })
}
//so in order to get rid of try/catch blocks. we simply wrapped our asynchronous func. inside of the catchAsync func. This function will then return a new anonymous func(arrow function) which will then be assigned to createTour.
//basically than that anonymous func will get called as soon as a new tour should be created using the createTour handler
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////First Practice when we have to read data from file rather than DB

// const fs = require('fs');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// //we have this middleware before it actually hits the update controller

// exports.checkId = (req, res, next, val) => {
//   console.log(`this is the id : ${val}`);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       //we have to return from this function if there is no id because if not return then it will send the response back and it then hit the next fun. and will proceed for another response which is not allowed if the response is already sent
//       status: 'fail',
//       message: 'Invalid Id',
//     });
//   }
//   next();
// };

// //create a check body middleware. (Check if body contains the name and price property, if yes
// //then ultimately run the createtourhandler middleware in routes in tourRoutes).
// //Chain this middleware to the post request of createTour handler
// exports.checkBody = (req, res, next) => {
//     console.log(req.body, "SSSSSSSSSSSSSSSSSSSSS")
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       staus: 'fail',
//       message: 'Missing Name or Price',
//     });
//   }
//   next();
//   console.log(
//     req.body.name,
//     '--------------------------AND-------------',
//     req.body.price
//   );
// };

// exports.getAllTours = (req, res) => {
//   //this cb here is called rout handling
//   console.log(req.requestTime, 'Time');
//   res.status(200).json({
//     status: 'success',
//     Time: req.requestTime,
//     result: tours.length,
//     data: {
//       tourss: tours,
//     },
//   });
// };

// exports.getTour = (req, res) => {
//   console.log(req.params.id, '------------------------');
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);
//   console.log(
//     '-------------------------------------------------------------',
//     tour
//   );

//   //if there is no such id present , then
//   //if( id> tours.length)
//   // if(!tour)
//   // {
//   //     return res.status(404).json({
//   //         status: "fail",
//   //         message: "Invalid Id"
//   //     })
//   // }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// };
// exports.createTour = (req, res) => {
//   //here we will use the middleware as express doesnt put that body on the request, so to made that data available will use middleware(app.use(express.json())
//   //console.log(req.body);
//   //as we are gonna to put that body data into the json file here and not into the db so we need to create here id manually:
//   const newId = tours[tours.length - 1].id + 1;
//   //now we will send the body data and the id, so
//   const newTour = Object.assign({ id: newId }, req.body);
//   console.log(newTour, 'Sanjanjanjanja');

//   //now we need to push that created newTour into the tours file so
//   tours.push(newTour);
//   //console.log(tours, "--------------------------------------------------")
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       res.status(201).json({
//         status: 'success',
//         data: {
//           oneTour: newTour,
//         },
//       });
//     }
//   );

//   //Imp ->        //every time we also need to send some response response
//   //res.send("done")
// };

// exports.updateTour = (req, res) => {
//   // if(req.params.id*1 > tours.length){
//   //     return res.status(404).json({
//   //         status: "fail",
//   //         message: "Invalid Id"
//   //     });
//   // }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<updated tour>',
//     },
//   });
// };

// exports.deleteTour = (req, res) => {
//   // if(req.params.id*1 > tours.length){
//   //     return res.status(404).json({
//   //         status: "fail",
//   //         message: "Invalid Id"
//   //     });
//   // }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// };

//////////////////////////////////////////////////////////////////////////
// exports.createTour = catchAsync(async (req, res, next) => {
//   try {
//     // const newTour = new Tour({});
//     // newTour.save()
//     console.log(req.body, 'UUUUUUUUUUUUUUUUUUUUUUUUUUU');
//     const newTour = await Tour.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// });

// exports.getAllTours = async (req, res) => {
//   console.log(req.query, 'Sanjnajnajanjana');
//   try {
//     // Build Query
//     //1A.) Filtering
//     // const queryObj =  { ...req.query };
//     // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     // excludedFields.forEach(el => delete queryObj[el])

//     //1.BAdvanced Filtering
//     //basically the filter object looks like
//     // { difficulty: 'easy', duration: { $gte:5 }}  //we need to start new obj whenever we want to use operator

//     //Query object ---> from query string (console.log(req.query)) .....[gte]=5&duration=easy
//     // {difficulty: 'easy', duration: { gte: '5'}}
//     //console.log("KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",JSON.stringify(queryObj) )
//     // let queryStr = JSON.stringify(queryObj);
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match =>`$${match}`);
//     // console.log(JSON.parse(queryStr), "sanjanajnaananannanan")
//     //------------------------------------------------------------------------------------------------
//     //we have 2 ways to query the database
//     // const tours = await Tour.find({
//     //   duration: 5,
//     //   difficulty: 'easy'
//     // });

//     //2. with mongooose method
//     //  const tours = await Tour.find()
//     //                          .where('duartion')
//     //                          .equals(5)
//     //                          .where('difficulty')
//     //                          .equals('easy')

//     //1. const query = Tour.find(queryObj)
//     //2.
//     // const query = Tour.find(JSON.parse(queryStr))
//     //let query = Tour.find(JSON.parse(queryStr))

//     //console.log('MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM', req.query);
//     //Execute Query
//     const feature = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sorting()
//       .limitFields()
//       .paginated();
//     //const tours = await Tour.find(req.query)
//     //const tours = await query
//     const tours = await feature.query;
//     //console.log('TOURRRRRRRRRRRRRRRRRRRRRRRR', tours);

//     //SEND RESPONSE
//     res.status(201).json({
//       status: 'success',
//       result: tours.length,
//       data: {
//         tour: tours,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };
