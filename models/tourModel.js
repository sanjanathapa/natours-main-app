///schemas
const mongoose = require('mongoose'); //we need this mongodb driver which allows our node code to access and iteract with mongodb DB
const slugify = require('slugify');
//const User = require('./userModel');
const validator = require('validator');

const tourSchema = new mongoose.Schema(           //will pass schema as an object
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 40 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: difficulty, medium, easy', 
      },
      //we can use enum only with strings and not with numbers
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'ratings must be above 1.0 '],
      max: [5, 'rating must be above 5.0'],
      set:  val => Math.round(val*10 /10) //4.66666 //46.66666 // 47 //4.7                                               //this is a setter func and this will run each time that a new value will be set to this field
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //in this function it has access to the inputted value
          //here "this" only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //geoJSon in order to specify geospatial data. we basically need to create a new object such as we did here this object is embedded object and we can specify some properties here like type and cordinates 
      type:{
        type: String,
        default:'Point',
        enum: ['Point']
        },
      coordinates: {
        type: [Number],
        address: String,
        description: String
      }
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: {
          type: [Number],
          address: String,
          description: String,
          day: Number
        }
      }
    ],
    //guides: Array
    //Child Referencing
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//single field index
// tourSchema.index( {price: 1});

//improving read performance with indexes
//if we querying combined with another field too instead of one field in index form. then we can use combined field index.
tourSchema.index( {price: 1, ratingsAverage: -1}); 
tourSchema.index( {slug: 1}); 

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// //Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour' 
});


//we  can have middleware running before and after a certain event. in this middleware functin itself we acces to the this keyword
//DOCUMENT MIDDLEWARE: runs before '.save() and  .create() only
tourSchema.pre('save', function (next) {
  console.log(this, '----------------------------------------');
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function(next) {
//     console.log("Will Save the Document... ");
//     next();
// })

//we can run or repeat multiple middleware with the same hook(i.e save )
//post hook middleware will always runs after the pre hook middleware and it has extra acces(document which will be
//being processed) and in this hook they will not have the "this" access
// tourSchema.post('save', function(doc, next){
//     console.log(doc);
//    next();
// })

//this will basically perform the embedding 
//  tourSchema.pre('save', async function(next){
//   const guidesPromises = this.guides.map(async (el) => await User.findById(el));
 
//   console.log("----this----------", this, "---array of promises---------", typeof guidesPromises, "----------", guidesPromises)
//   this.guides = await Promise.all(guidesPromises)
//   next();
//  })


//Query Middleware
//PRE Find hook--> a middleware that is gonna run before any find query is executed. and the 'this' keyword will point to the current query not the document
//tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
})

// tourSchema.pre('findOne', function(next) {
//     this.find({secretTour: { $ne: true } } )
//     next();
// });

//in this post hook we will have acces all the docs th
// tourSchema.post(/^find/, function (next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds!}`);
//   console.log(docs);
//   next();
// });

//AGGREGATION MIDDLEWARE
//we could do it on the controller functions also but what if there is so any aggregation and we might can forget it to include $secretTour: true
//so we will handle it on the model level.
//before the aggregation is actually executed
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  //console.log(this.pipeline)
  next();
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

//creating an instance of the Tour Model or creating a document
// const testTour = new Tour({
//     name: "The Forest Hiker",
//     rating: 4.7,
//     price: 120
// });
// //now we can do apply some methods on this instance like
// testTour.save().then(doc =>{     //in this doc, we get acces to the document that was just saved to the databse
//     console.log("our doc", doc)
// }).catch(err => {
//     console.log("ERROR :(", err)
// })

/////
//Data validations with mongoose
//we can build our cstom validators too.
//A validator is actually really just a simple functions which should return either true or false. if it returns false then it means there is an error otherwise validation is correct and so input can be accepted

//there are couple of libraries on npm for data validation that we can simply plug in here as custom validators that we do not have to write ourselves.
//popular library is called validator

//how we can run many promises all at the same time if we have to wait promises simultaneously
//save the promise into a variable that of save the promise and not the resolved value of the promise. so by doing this we will have three promises. and now in order to get the resolved values.
//we create a new variable and now what we do await is promise.all. and into this promise.all we pass an array of promises. by doing this we will await that and it will basically run all these three promises all at the same time and then save to the three resolved values


//what is populate?
//Populate is a process in order to actually get access to the referenced tour guides whenever we query for a certain tour.
//Populate process always happens in a query.
//behind the scenes, using populate will still actually create a new query. because how else would mongoose be able to get data about tours and user at the same time. it needs to create new query in order to be able to create the connection 