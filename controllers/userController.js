const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./../controllers/handlerFactoryFun')

const filterObj = function(obj, ...allowedFields){
    const newObj = {};
    Object.keys(obj).forEach(el =>{
        if(allowedFields.includes(el)) newObj[el] = obj[el]
        //so if the current field is one of the allowed fields well then newobj with the field name of the current field 
        //should be equal to whatever is in the object at the current element, so the current field name
        console.log(newObj, "----new object of the filere object-----")
    })
    return newObj
}


// exports.getAllUsers = catchAsync (async(req, res, next) => {
//     const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     result: users.length,
//     data: {
//        users,
//     },
//   });
// });

exports.updateMe = catchAsync(async( req, res, next ) => {
    //1. throw error if user POSTs the password
    console.log(req.body, "-----------------------------------------------------------me--------------")
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password update. Please use /updateMyPassword', 400))
    }

    //2. Filtered out unwanted fields name that are not allowed to be updated
    const filteredBody = filterObj(req.body, "name", "email");
    //3.update the properties or user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true});

    res.status(200).json({
        status: "succes", 
        data: {
            data: updatedUser
        }
    })
});

exports.deleteMe = catchAsync(async(req, res, next) =>{
    console.log(req.user, "================")
    await User.findByIdAndUpdate(req.user.id, { active: false});
    
    res.status(204).json({
        status: "succes",
        data: null
    })
});

exports.createUser =  (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not defined yet. Please use /signup instead"
    })
};
exports.getMe = (req, res, next) =>{
    req.params.id = req.user.id;

    next();
}
//Do Not Update Passwords with this 
exports.updateUsers = factory.updateOne(User);
exports.deleteUsers = factory.deleteOne(User);
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);


// exports.deleteUsers = (req, res) => {
//     res.status(500).json({
//         status: "error",
//         message: "This route is not defined yet"
//     })
// };