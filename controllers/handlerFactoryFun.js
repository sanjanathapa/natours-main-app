//as most of the handler function has same structure or they are repeating the same code so we gonna use handler factory function

//Advance concept kind of
//purpose of the handler factory function is to create a function(i.e handler factory function) which will then return a function(hanldr function(for every single model that we have in our application)). i.e inside the factory func we will pass in the model(inside the factory function we will pass model)
//the function that we are gonna write here is basically will returns controllers.
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res) => {
          const doc = await Model.findByIdAndDelete(req.params.id);
      
          if (!doc) {
            return next(new AppError('No doc found with that ID', 404));
          }
            res.status(204).json({
            status: 'success',
            data: null,
          });
      });

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      },
    });
  });

  exports.createOne = Model => catchAsync(async (req, res, next) => {
    // const newTour = new Tour({});
    // newTour.save()
    console.log(req.body, 'UUUUUUUUUUUUUUUUUUUUUUUUUUU');
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
  

//we will first create the query, and then if there is the populate options object, we will then add that to the query and then by the end
//await that query.

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    //1. create the query
    let query = Model.findById(req.params.id)
    if(popOptions) query = query.populate(popOptions)
    //const tour = await Tour.findOne({_id : req.params.id})   //we have to pass afilter object
    //const doc = await Model.findById(req.params.id).populate('reviews')

    const doc = await query;
    console.log(doc, "------------document----------------")
  
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

  exports.getAll = Model => catchAsync(async (req, res, next) => {
    console.log(req.query, 'Sanjnajnajanjana9999999999999999999999999999999999999999999999');
    console.log("------------------------req.params.tourId------------------------", req.params.tourId);
    //To allow for nested GET Reviews on tour(a small hack)
    let filter;
    if(req.params.tourId) filter = { tour: req.params.tourId};
    const feature = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sorting()
    .limitFields()
    .paginated();
  // const doc = await feature.query.explain();
  const doc = await feature.query;

  //SEND RESPONSE
  res.status(201).json({
    status: 'success',
    result: doc.length,
    data: {
      data: doc,
    },
  });
});
  








// exports.deleteTour = async (req, res) => {
//     try {
//       const tour = await Tour.findByIdAndDelete(req.params.id);
  
//       if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));
//       }
  
//       return res.status(204).json({
//         status: 'success',
//         data: null,
//       });
//     } catch (err) {
//       res.status(404).json({
//         status: 'fail',
//         message: err,
//       });
//     }
//   };

//we can create indexes on specific fields in a collection. for example mongo automatically creates an index
//mongodn has to examine basically scan all of these docs in order to find correct three ones(or filtered docs that matches the query).
//if we had thousands and millions of docs, than this would significanlty affect the read performance of this query.

//so here indexes will solve our problem.
//we cna create indexes on specific fields in a collection. mongo automatically creatyes an index on the id fields by default. can check on compass header
//can index on that field on which people queries for more often like price.

//and this is a huge performance gain by doing indexes. always do indexes on models.


//calculating average rating
//we r gonna calculate the average rating and also the number of ratings of a tour each time that a new review is added to that tour or also when a review is updated or
//deleted,