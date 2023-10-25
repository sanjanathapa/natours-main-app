const mongoose = require('mongoose');

//Globally handling uncaught exceptions (synchrous error handling)
// process.on('uncaughtException', (err) => {
//   console.log('unahndled rejections!!!, Shutting down');
//   console.log(err.name, err.message);
// });

require('dotenv').config();
const app = require('./app');

// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );

console.log('====db===', process.env.DATABASE, process.env.NODE_ENV);

mongoose
  .connect(`mongodb://localhost:27017/${process.env.DATABASE}`, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((resolvedValue) => {
    //console.log(resolvedValue.connections);
    console.log('DB is connected successfuly');
  })
  .catch((err) => {
    console.log(`error in connection with database: ${err}`);
  });
//console.log(app.get('env'), '&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&7');
console.log(process.env.NODE_ENV);
//now to make it(environmt variabled) available to the other file, we need to require a dotenv function
//so we need some way of reading these variables(this is possible thru config func on dotenv) and saving them as
//environmt varibles in our node environment

const port = process.env.PORT || 9000;
const server = app.listen(port, () =>
  console.log(`app is running on the port: ${port}...`)
);

/////What is mongoose?
//mongoose is an object data modelling library for mongodb and nodejs providing a higher level of abstraction(relationship having like express and node)
//express is a layer of abstraction over regular Node, while mongoose is a layer of abstraction over the regular MongoDB driver.
//and btw, and ODM  is just a way for us to write Javascript code that will then interact with a database.

//we use Mongoose rather than regular mongodb driver as it allows for rapid and simple development of mongodb database interactions.

//Some of the features Mongoose give us is:
//Schemas to model our data and relationship,
//easy data validation, a simple query API, middleware and much more.

//In mongoose, a schema is where we model our data(where we describe the structure of data, deefault values and validations).
//mongoose model: we then take that schema and create a model out of it. basically model is a wrapper for the schema which provides an interface to the DB for
//CRUD operations.

// "scripts": {
//     "start:prod" : "SET NODE_ENV=production & nodemon app.js",
//     "start:dev" : "SET NODE_ENV=development & nodemon app.js"
// },

///////////////////////////
//Globally handling unhandled rejected promises
// process.on('unhandledRejection', (err) => {
//   console.log('unahndled rejections!!!...shutting down');
//   console.log(err.name, err.message);
//   server.close(() => {
//     process.exit(1)   //to shutdown the app gracefully we first let the server to finish all its running reqst then exit from the app
//   })
// });
