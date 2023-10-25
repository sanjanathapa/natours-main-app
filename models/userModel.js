const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); //built-in a node module

const userSchema =  new mongoose.Schema({
    name:{
        type: String,
        required: [true, "Please tell us your name"]
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email"]
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please confirm your password"],
        validate: {
    //this only works on CREATE and ON SAVE 
            validator: function(pswd){
                return pswd === this.password
            },
            message: "Passwords are not same"
        }
    },

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

//Document middleware (Pre save hook)
userSchema.pre('save', async function(next) {
    //Only run this function if password was actually modified
     if(!this.isModified('password'))  return next();

     //Hash the password with cost of 12
     this.password = await bcrypt.hash(this.password, 12);

     //Delete passwordConfirm field, we do not want to save this field in DB
     this.passwordConfirm = undefined;
     next();
});

userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew ) return next();

    //will ensure that the token is always created after the password has been changed
    this.passwordChangedAt = Date.now() - 1000;
    next();
})    

userSchema.pre(/^find/, function(next){
    //this points to the current query
    this.find({active: {$ne: false}});
    next();
})

//instance methods. this can be called on the model directly or documents constructed from model. eg User.correctPassowrd
 userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
 }
//  userSchema.methods.correctPassword = async function(
//     candidatePassword,
//     userPassword
//   ) {
//     return await bcrypt.compare(candidatePassword, userPassword);
//   };
 userSchema.methods.changedPasswordAfter = function(JWTTimeStamp){
     if( this.passwordChangedAt ){
         const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() /1000, 10);

        console.log(changedTimeStamp, JWTTimeStamp, "-------------------------TimeStamp--------------");
         return JWTTimeStamp < changedTimeStamp
    }

    // False means NOT Changed
    return false
 }

 //password reset -------------------------------------------------
 userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log({resetToken}, "-------------------------", this.passwordResetToken)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
 }
 

const User = mongoose.model("User", userSchema);

module.exports = User

//All these communication must happen over https
//we can call this instance method on a user document