const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, "Review cannot be empty!"]
    },

    rating:{
        type: Number,
        min:1,
        max:5,
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    //Parent Referencing
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, "Review must belong to a tour"]
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true})  //this will ensure that the combination of tour and user is always unique

reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });

    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next();
})

//CALCULATE AVERAGE RATING and NO. OF RATING
//e.g Review.calcStats
//1.select all the reviews that actually belongs to the current tour or id
//2. in the next stage lets calculate the statistics themselves.

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating'}
            }
        }
    ])
    //aggregation actually returns a promise so we have to await aggregation
    //and now we want to use this function to update the tour document with this statistics. so we need to call this method.
    //now to persisted this stats on tour model. so we need to acquire the tour model.

    if(stats.length >0 ){
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    } else (await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5
    }))
};

//Document middleware
reviewSchema.post('save', function() {
this.constructor.calcAverageRatings (this.tour)

});

//findByIdAndUpdate
//findByIdAndDelete
//as for this find thing we only have query middleware(and so in the query we actually dont have direct access to the document on order to
// do something similar like this(this.constructor.calcAverageRatings (this.tour)) basically to get the tourId). 

//so to this limitation we have a nice trick. so we are going to implement a pre middleware for this event.

reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await  this.findOne();   //by doing this.r instead of creating var we actually creating a 'r' property on the 'this'.
   next();
});

reviewSchema.post(/^findOneAnd/, async function(){
    //this.r = await  this.findOne();  does NOT work here, query has already executed.
    await this.r.constructor.calcAverageRatings(this.r.tour)
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review


//when you want to populate 2 fields you need to actually call populate twice so once for each of the field.
//virtual properties are basically fields that we can define on schema but it will not be persisted. on this 'get' method becz virtual 
//property be created each time that we get some data out of the db.
//Virtual Populate-we can get access to all the reviews for a certain tour but without keeping this array of ID's on the tour(keeping that 
//array of reviews ID's on a tour but without actually persisting it to the database ).

//(this.constructor) here it will still points to the model this is the curent doc and constructor is the model who created that document 