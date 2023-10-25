const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean')
const hpp = require('hpp')

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');


const app = express();

//body-parser, reading data from body into
app.use(express.json({limit: '10kb'}));  //calling json method here basically returns a function, that func is then added to the middleware stack

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'mazGroupSize',
        'difficulty',
        'price'
    ]
})
);

// app.use((req, res, next) => {
//     //req.requestTime = new Date().toISOString();
//     console.log(req.headers, "----request headers------")
//     next();
// });

//1. Global Middlewares
//Set security HTTP headers
app.use(helmet());

//Development logging
if(process.env.NODE_ENV === 'development'){
app.use(morgan('dev'))};  //calling this morgan function in return, returns the function thatj looks like a middleware func(that it should like be)

//limiting the requests from same api
//we start by creating a limiter /recieves object of options(ratelimit is a function which will based on our objects, create a middleware function. which we can now use using app.use)
const limiter = rateLimit({
    max: 50,
    windowMs: 60*60*1000,
    message: "Too many requests from this IP, Please try again in an hour."
});
app.use('/api', limiter)
// app.get('/', (req, res) => {
//     res.status(200);
//     res.send('hii from the server'); 
// });


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////Refactoring the Code ///separating the handler functions of the routes so that we can even export to other file
// const getAllTours = (req, res) => {  //this cb here is called rout handling
//     console.log(req.requestTime, "Time")
//     res.status(200).json({
//         status: "success",
//         Time: req.requestTime,
//         result: tours.length,
//         data: {
//             tourss: tours
//         }
//     });
// };

// const getTour = (req,res) => {
//     console.log(req.params.id, "------------------------");
//     const id = req.params.id*1
//     const tour = tours.find(el => el.id === id );
//     console.log("-------------------------------------------------------------", tour)

//     //if there is no such id present , then
//     //if( id> tours.length)
//     if(!tour)
//     {
//         return res.status(404).json({
//             status: "fail",
//             message: "Invalid Id"
//         })
//     }
//     res.status(200).json({
//         status: "success",
//         data : {
//             tour
//         }
//     })
// }
// const createTour = (req, res) =>{      //here we will use the middleware as express doesnt put that body on the request, so to made that data available will use middleware(app.use(express.json())
//     //console.log(req.body);
//     //as we are gonna put that body data into the json file here and not into the db so we need to create here id manually:
//     const newId = tours[tours.length - 1].id + 1;
//     //now we will send the body data and the id, so
//     const newTour = Object.assign({id: newId}, req.body)
//     console.log(newTour, "Sanjanjanjanja");

// //now we need to push that created newTour into the tours file so
// tours.push(newTour);
// //console.log(tours, "--------------------------------------------------")
// fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
// res.status(201).json({
//     status: "success",
//     data : {
//         oneTour: newTour
//     }
// })
// })

// //Imp ->  //every time we also need to send some response response 
//     //res.send("done")
// };

// const updateTour = (req,res) => {
//     if(req.params.id*1 > tours.length){
//         return res.status(404).json({
//             status: "fail",
//             message: "Invalid Id"
//         });
//     }

//     res.status(200).json({
//         status: "success",
//         data: {
//             tour: "<updated tour>"
//         }
//     })
// }

// const deleteTour = (req,res) => {
//     if(req.params.id*1 > tours.length){
//         return res.status(404).json({
//             status: "fail",
//             message: "Invalid Id"
//         });
//     }

//     res.status(204).json({
//         status: "success",
//         data: null
//     })
// }

//////////////////////////////////////////////////////////////////////////Users

// const getAllUsers = (req, res) => {
//     res.status(500).json({
//         status: "error",
//         message: "This route is not defined yet"
//     })
// };

// const getUsers = (req, res) => { 
//     res.status(500).json({
//         status: "error",
//         message: "This route is not defined yet"
//     })
// };

// const createUser =  (req, res) => {
//     res.status(500).json({
//         status: "error",
//         message: "This route is not defined yet"
//     })
// };

// const updateUsers = (req, res) => {
//     res.status(500).json({
//         status: "error",
//         message: "This route is not defined yet"
//     })
// };

// const deleteUsers = (req, res) => {
//     res.status(500).json({
//         status: "error",
//         message: "This route is not defined yet"
//     })
// };

//we will first read the file as a top level code and we dont want to block the code inside the folloeing cb function so
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`));
//console.log("Sanjana", tours)
//app.get('/api/v1/tours', getAllTours);

////////////////////////////////////////////////////////////////////////////////////////////
//Responding to URL parameters
//we need to define a route which can accept a variable(params)
// app.get('/api/v1/tours/:id', getTour )
// app.post('/api/v1/tours', createTour)
// app.patch('/api/v1/tours/:id', updateTour)
// app.delete('/api/v1/tours/:id', deleteTour)

//another method doing this using route is
//app.route('/api/v1/tours').get(getAllTours).post(createTour);

//as the order of middleware is matters as(what will happen here is the following console will not be logged as the 
//upper route handler finished its req-res cycle part of the middleware stack that gets executed before the req-res 
//cycle ends)
// app.use((req, res, next) => {
//     console.log("Hello from middleware");
//     next();
// });

//app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour)

////////////////////////////////////////////////////////////////////////////////////////
////Implementing the User routes
// app.route('/api/v1/users').get(getAllUsers).post(createUsers);
// app.route('/api/v1/userss/:id').get(getUsers).patch(updateUsers).delete(deleteUsers)


/////Mounting the tourRouter and userRouter

//const userRouter = express.Router();

// userRouter.route('/').get(getAllUsers).post(createUser)
// userRouter.route('/:id').get(getUsers).patch(updateUsers).delete(deleteUsers)

///////////////////////////////////////////////////////////////////////////////////////
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//2.)creating the error or error obj
app.all('*', (req,res,next) => {
    // res.status(401).json({
    //     status: "fail",
    //     message: `can't find ${req.originalUrl} on this server`
    // });
    // next();

    // const err = new Error(`can't find ${req.originalUrl} on this server`);
    // err.status = "fail",
    // err.statusCode = 400

    // next(err);    //in this next() the err will be passed for the next error middleware handler function whereevr it 
    //              //is. And in the next func. whenevr we pass anything, it will assume that it is an error and it will
    //         // then skip all the middlewares in the middleware stack and sent the error that we passed in to the GEHF


    next(new AppError(`can't find ${req.originalUrl} on this server`), 404)

        })

//Express comes with error handling middlewares 
//creating global express error handling middleware.
//in this we will have 2 steps- 1. writing the middleware(will hanlde all the errors coming from all over the 
//application) and then 2. creating the err or err obj

//1.) creating the middleware
app.use(globalErrorHandler);


//Most used API architecture: (Representational States Transfer is basically a way of building web APIs in a logical 
//way, making them easy to consume)
//API : is piece of software  that can be used by another piece of software in order to allow application to talk to 
//each other.

//Restful APIs ->which means APIs following the REST architecture, and that rules are:-
//1. Separate API into logical resources.
//2. These resources should then be exposed(to be made available using structures, resource-based URLs).
//3. use HTTP methods for doing any action on data(deleting, creating etc).
//4. Send data as JSON(from server to client or vice versa)(usually).
//5. The APIs must be stateless(i.e all states must be handled on the client ans not on the server. And state simply 
//refers to a piece of data in the app that might change over the time)



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


module.exports = app;


/////
//Node js app and express app can run in different environments. and the most imp ones are the development env and production env./becs depending on the env, we might use different DB.
//now by defauly, express sets the environment to development.
//in summary env variables are global variables that are used to define the environment in which a node app is running

//process.env //nodejs also sets a lot of env varibales



//"start:dev": "nodemon server.js",
//"start:prod": "set NODE_ENV=production & nodemon server.js",