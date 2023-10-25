//const util = require('util'); //will create an object called util.
const { promisify } = require('util'); 
const crypto = require('crypto');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
    return jwt.sign({ id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSignToken = (user, statusCode, res )=>{
    const token = signToken(user._id)
    const cookieOptions = {
        expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true
    }
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true
    res.cookie('jwt', token, cookieOptions)
    user.password = undefined
    res.status(statusCode).json({
        status: "success", 
        token,
        data: {
            user
        }
    }) 

}

exports.signup = catchAsync (async(req, res, next) =>{
    console.log(req.body, "---------request body----------------------------------------")
    const newUserdata = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,}
    //const newUser = await User.create(req.body)
     if(req.body.role) newUserdata.role = req.body.role
    const newUser = await User.create(newUserdata)

    console.log("----------newuser data--------", newUserdata)
   
    
    //const token = signToken(newUser._id)
    // jwt.sign({ id: newUser._id}, process.env.JWT_SECRET, {
    //     expiresIn: process.env.JWT_EXPIRES_IN
    // }) 
    
    // res.status(200).json({
    //     status: "success", 
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // }) 
    createSignToken(newUser, 201, res);
});

//we always passes options as an object

exports.login = catchAsync(async (req, res, next) => {
    console.log(req.body, "------request body---------")
    const {email, password } = req.body;

    //1. check if email and passwords exist while login 
    if(!email || !password){   
        return next(new AppError("please provide an email and password!!!!", 400))
    }

    //2. check if user exist && password is exist
    const user = await User.findOne({email}).select('+password')
    console.log("---user----", user)
    //const correct = user.correctPassword(password, user.password)

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
      }
    // if(!user || !user.correctPassword(password, user.password)){
    //     return next(new AppError("Incorrect email or password", 401))

    // }

    createSignToken(user, 200, res)
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: "success",
    //     token
    // });
});

exports.protect = catchAsync( async (req, res, next) => {
    //1. Getting token and check if it's there 
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
//console.log("--headers----------------", req.headers.authorization, "--------------------", req.headers.authorization.split(' ')[1])
    console.log("-7777777777777---", token)

    if(!token){
        return next(new AppError("You are not logged in! Please log in to get access.", 401))    
        //we return from this middleware and call the next one and in next() we gonna create an error
    }
    //2. Verification token
    const  decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    console.log(decoded,"-------------------------------------------------------------------------------")
   
    //3. Check if user still exists
    const currentUser = await User.findById(decoded.id)

    if(!currentUser)
    {
        return next(new AppError("The user belonging to this token does no longer exist!", 401))
    }
    //4. Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)){
    return next(new AppError("User recently changed Password. Please login Again", 401));
    }
 
    //Grant Access to Protected Route
    req.user = currentUser
    console.log("=====request user================", req.user)
    next();
});


exports.restrictTo = (...roless) => {
    console.log(roless, "==================Rolessss============================================")
    return (req, res, next) => {
        console.log("-------------------.restrictTo---------middlea----------------------------------------------", req.user.role)
        if(!roless.includes(req.user.role)) {
            return next(new AppError("Yor are not allowed for this action", 403));
        }
        next();
    };
};

//----------Password Reset Functionality
exports.forgotPassword = catchAsync(async(req, res, next) => {
//main steps will be
//1. get user based on POSTed request email
const user =  await User.findOne({email: req.body.email});
console.log(req.body.email, "=====================================================")
console.log("USER*******************************************************************", user)
if(!user) {
    return next( new AppError("There is no user with email address", 404))
}

//2. Generate the random reset Token
const resetToken = user.createPasswordResetToken();
//await user.save();
await user.save({validateBeforeSave: false});
console.log("--------------------------st-REQUEST------------------", req.protocol)

//3. Send it to user's email
const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPasswoord/${resetToken}`;
console.log(resetToken, "========================================reset tokennnnn")

const message = `Forgot your password? Submit an Update requeste with your new password to ${resetURL}`;

try{
    await sendEmail({
        email: user.email,
        subject: 'Your password reset token(valid for 10 min)',
        message
    });
    
    res.status(200).json({
        status: "success",
        message: "Token sent to email"
    });
} catch(err) {
    //need to reset both the token and expires property
    user.passwordResetToken = undefined,
    user.passwordResetExpires = undefined
    //it just modifies the data and dont save it so:-
    await user.save({validateBeforeSave: false});

    return next(new AppError('There was an error sending the email. try again later!', 500))

 }
});

exports.resetPassword = catchAsync( async (req, res, next) => {
    console.log("-------------reset request--------------------------------",req.params)
    //1,) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.tokengen).digest('hex');
    console.log(hashedToken, "------hashed token-----------------------------")
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() }} );
    console.log(user, "------------------------------------user--------------------------------------------------------------")

    //2.) If token has not expired, and there is a user then set the new password.
    if(!user){
        return next(new AppError("Token is invalid or has expired", 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    //3.) Update changedPasswordAt property for the current user.
    //Log the user in, send jwt to the client
    createSignToken(user, 200, res)
    // const token = signToken(user._id);
    // console.log(token, "8888888888888888888888888888888888888888888")
    // res.status(200).json({
    //     status: "success",
    //     token
    // });
});


exports.updatePassword = catchAsync(async (req, res, next) => {
    //1. Get user from collection
    console.log("999999999999999999999999999999999999", req.body)
    const user =  await User.findById(req.user.id).select('+password');
    console.log("----------------update PAssword console---------------", user)
    //2. Check if current POSTed password is correct
    if( !(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('your password is incorrrect', 401))
    }
    //3. If so, update the password
    user.password = req.body.password,
    user.passwordConfirm = req.body.passwordConfirm
    await user.save();
    //user.findByIdandUpdate will not Work as intended!

    //4. Log user in, and send jwt
    createSignToken(user, 200, res)
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: "success",
    //     token
    // });
})
//create email handler function to use it throughout the application
//three steps to send emails with nodemailer. it is basicallly a service that will actually send the email(something like gmail) and not the nodjs itself. but gmail is actually the service that we r gonna use .
//anyway ,,we need to always create a transporter and thats always the same no matter what server we r gonna use
//create a transporter
//define the emails options
//actually send the email through nodemailer. 


//on the backend side in order to prevent XSS attacks, we should sanitize user input data and set some special HTTP headers. so express doesnt come eith this practice so we gonna use middleware to set all of these special headers.












//in this middleware, we cant pass arguments into a middleware function. but in thos case we want to pass in the 
//roles(admin and lead-guide) who are allowed to access the resource. so we need a way of basically passing in arguments into the middleware func.
//in a way that usually doesnt work. so in here we will actually create like a wrapper function , which will then return the middleware function
//that we actually want to create.

//and so this function here then basically get access to this role's parameter here. becz there is a closure.
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// To achieve this, you can use a simple but efficient pattern: wrap your actual middleware function with a second one that receives the desired parameters, like so.

// const paramMiddleware = (myParam) => {
//   return (req, res, next) => {
//     // implement your business logic using 'myParam'
//     // ...
//     next();
//   }
// }
// Then, simply pass the desired parameter to the middleware wrapper function when passing to the Express routes.

// app.get('/', paramMiddleware('param'), (req, res) => { res.send('...'); });

///////////////////////////////////////////////////////////////////////////////////////////////////////////


//what if the user has been deleted in the meantime? so the token will still exist, but if the user is no longer existent and then we actually we no longer want to log him again.
//or even worse, what if the user has actualluy changed his password after the token has been issued
//send a token using a http header with the request. set headers in postman to send it along with the request.
// to send a json web token as a header. we should always use authorization key.

//node actually has a built-in promisify function.
//promisify: [Function: promisify] { custom: Symbol(nodejs.util.promisify.custom) },

// Promisification” is a long word for a simple transformation. It’s the conversion of a function that accepts a callback into a function that returns a promise.

// Such transformations are often required in real-life, as many functions and libraries are callback-based. But promises are more convenient, so it makes sense to promisify them.
//false means not changed and not change basically means that the day and or the time at which the token was issued is less than the changed timestamp
//if we want to pass data from one middleware to the next middleware, then we can simply put some stuff on the 
//request object and then that data will be available at a later point.

//pm.response.json() =>this code here gets the response for us and then on there we can write the dot token property and then assign 
//to the jwt env variable.
//each time when we want to add a new protected route, all we need to do is go to authorization tab and then add
//that jwt variable(which you have set in signup or login).

//Auhtorization => its verifying if a certain user has the rights to interact with certain resource even if he is logged in
//1. we always need to check if a user is actually logged in 

//Password reset functionaly
//2 steps
//1.user sends a post request to a password forgot route, only with this email. this will then create a reset token and send
//that to the email that was provided (just a random token not a jwt).
//2. user then sends that token from his email along with a new password in order to update his password.