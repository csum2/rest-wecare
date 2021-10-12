/*  MAPD713 Enterprise Techs 2021Fall
*   Group 3
*
*   Functionality implemented:
*   1. Add one patient info
*   2. List all patients info
*   3. View one patient info
*/

var DEFAULT_PORT = 5000
var DEFAULT_HOST = '127.0.0.1'
var SERVER_NAME = 'wecare'

var http = require('http');
var mongoose = require("mongoose");

var port = process.env.PORT;
var ipaddress = process.env.IP; // TODO: figure out which IP to use for the heroku

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.  
var uristring =
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/data';

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("!!!! Connected to db: " + uristring)
});

// This is the schema.  Note the types, validation and trim
// statements.  They enforce useful constraints on the data.
var patientSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    date_of_birth: String,
    biological_sex: String,
    email: String,
    contact_phone: String,
    residential_address: String,
    emergency_contact: String,
    emergency_phone: String,
    relationship: String
});

// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'Patients' collection in the MongoDB database
var Patient = mongoose.model('Patient', patientSchema);

var errors = require('restify-errors');
var restify = require('restify')
    // Create the restify server
    , server = restify.createServer({ name: SERVER_NAME })

if (typeof ipaddress === "undefined") {
    //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
    //  allows us to run/test the app locally.
    console.warn('No process.env.IP var, using default: ' + DEFAULT_HOST);
    ipaddress = DEFAULT_HOST;
};

if (typeof port === "undefined") {
    console.warn('No process.env.PORT var, using default port: ' + DEFAULT_PORT);
    port = DEFAULT_PORT;
};

server.listen(port, ipaddress, function () {
    console.log('Server %s listening at %s', server.name, server.url)
    console.log('Resources:')
    console.log(' /patients')
    console.log(' /patients/:id')
})


server
    // Allow the use of POST
    .use(restify.plugins.fullResponse())

    // Maps req.body to req.params
    .use(restify.plugins.bodyParser())


// Create a new patient
server.post('/patients', function (req, res, next) {
    console.log('POST request: patients params=>' + JSON.stringify(req.params));
    console.log('POST request: patients body=>' + JSON.stringify(req.body));
    // Make sure name is defined
    if (req.body.first_name === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new errors.BadRequestError('first_name must be supplied'))
    }
    if (req.body.last_name === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new errors.BadRequestError('last_name must be supplied'))
    }
    // Make sure date of birth is defined
    if (req.body.date_of_birth === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new errors.BadRequestError('date_of_birth must be supplied'))
    }
    // Make sure contact phone is defined
    if (req.body.contact_phone === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new errors.BadRequestError('contact_phone must be supplied'))
    }

    // Creating new patient.
    var newPatient = new Patient({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        date_of_birth: req.body.date_of_birth,
        biological_sex: req.body.biological_sex,
        email: req.body.email,
        contact_phone: req.body.contact_phone,
        residential_address: req.body.residential_address,
        emergency_contact: req.body.emergency_contact,
        emergency_phone: req.body.emergency_phone,
        relationship: req.body.relationship
    });

    // Create the patient and saving to db
    newPatient.save(function (error, result) {
        // If there are any errors, pass them to next in the correct format
        if (error) return next(new Error(JSON.stringify(error.errors)))
        // Send the patient if no issues
        res.send(201, result)
    })
})


// Get all patients in the system
server.get('/patients', function (req, res, next) {
    console.log('GET request: patients');
    // Find every entity within the given collection
    Patient.find({}).exec(function (error, result) {
        if (error) return next(new Error(JSON.stringify(error.errors)))
        res.send(result);
    });
})


// Get a single patient by the patient id
server.get('/patients/:id', function (req, res, next) {
    console.log('GET request: patients/' + req.params.id);

    // Find a single patient by their id
    Patient.find({ _id: req.params.id }).exec(function (error, patient) {
        if (patient) {
            // Send the patient if no issues
            res.send(patient)
        } else {
            // Send 404 header if the patient doesn't exist
            res.send(404)
        }
    })
})
