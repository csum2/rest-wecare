/*  MAPD713 Enterprise Techs 2021Fall
 *   Group 3  
 *
 *   *** All team members had contribution to the milestones ***
 *
 *   Functionality implemented for milestone #2:
 *   1. Add one patient info
 *   2. List all patients info
 *   3. View one patient info
 *   4. Delete one patient info
 *   5. Update one patient info
 * 
 *   Functionality implemented for milestone #3:
 *   1. Add medical data via the patient level
 *   2. Update medical data via the patient level
 *   3. Delete medical data via the patient level
 *   4. View one medical record by a given patient id and medicaldata id
 *   5. Add one medical record by a given patient id and medical resource name
 *   6. Delete one medical record by a given patient id and medicaldata id
 *   7. Update one medical record by a given patient id and medicaldata id
 *   8. List all patients by matching first name or last name
 */

var SERVER_NAME = "wecare";

var http = require("http");
var mongoose = require("mongoose");

var PORT = process.env.PORT;

// Connecting to Mongo Atlas db - wecare-db.
var uristring =
    process.env.MONGODB_URI ||
    "mongodb+srv://group3:Centennial2021@wecare-db-cluster.qeg5w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    // we're connected!
    console.log("!!!! Connected to db: " + uristring);
});

// This is the schema.  Note the types, validation and trim
// statements.  They enforce useful constraints on the data.
// Add, update, delete of medicaldata is just replacing the data array
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
    relationship: String,
    medicaldata: [{
        sortkey: String,
        measuring_date: String,
        measuring_time: String,
        systolic_pressure: String,
        diastolic_pressure: String,
        respiratory_rate: String,
        oxygen_level: String,
        heartbeat_rate: String
    }]
});

// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'Patients' collection in the MongoDB database
var Patient = mongoose.model("Patient", patientSchema);

var corsMiddleware = require("restify-cors-middleware2");
var cors = corsMiddleware({
    preflightMaxAge: 5,
    origins: ["*"],
    allowHeaders:["X-App-Version"],
    exposeHeaders:[]
  });
var errors = require("restify-errors");
var restify = require("restify"),
    // Create the restify server
    server = restify.createServer({ name: SERVER_NAME });

server.listen(PORT, function () {
    console.log("Server %s listening at %s", server.name, server.url);
    console.log("Resources:");
    console.log(" /patients");
    console.log(" /patients/:id");
    console.log(" /patients/:pid/medical");
    console.log(" /patients/:pid/medical/:mid");
    console.log(" /patientnames/:name");
});

server.pre(cors.preflight);
server
    // Support cors
    .use(cors.actual)

    // Allow the use of POST
    .use(restify.plugins.fullResponse())

    // Maps req.body to req.params
    .use(restify.plugins.bodyParser());

// Create a new patient
server.post("/patients", function (req, res, next) {
    console.log("POST request: patients params=>" + JSON.stringify(req.params));
    console.log("POST request: patients body=>" + JSON.stringify(req.body));
    // Make sure name is defined
    if (req.body.first_name === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new errors.BadRequestError("first_name must be supplied"));
    }
    if (req.body.last_name === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new errors.BadRequestError("last_name must be supplied"));
    }
    // Make sure date of birth is defined
    if (req.body.date_of_birth === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new errors.BadRequestError("date_of_birth must be supplied"));
    }
    // Make sure contact phone is defined
    if (req.body.contact_phone === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new errors.BadRequestError("contact_phone must be supplied"));
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
        relationship: req.body.relationship,
        medicaldata: req.body.medicaldata,
    });

    // Create the patient and saving to db
    newPatient.save(function (error, result) {
        // If there are any errors, pass them to next in the correct format
        if (error) return next(new Error(JSON.stringify(error.errors)));
        // Send the patient if no issues
        res.send(201, result);
    });
});

// Get all patients in the system
server.get("/patients", function (req, res, next) {
    console.log("GET request: patients");
    // Find every entity within the given collection
    Patient.find({}).exec(function (error, result) {
        if (error) return next(new Error(JSON.stringify(error.errors)));
        res.send(result);
    });
});

// Get all patients with matching wildcard in patient firstname or last name in the system
server.get("/patientnames/:name", function (req, res, next) {
    console.log("GET request: patientnames/" + req.params.name);
    // Find every entity within the given collection

    //Patient.find({ first_name: new RegExp(req.params.name) }).exec(function (error, result) {
    Patient.find({ $or: [{ first_name: new RegExp(req.params.name, "i") }, { last_name: new RegExp(req.params.name, "i") }] })
        .sort( { first_name: 1, last_name: 1 } )
        .exec(function (error, result) {
            if (error) return next(new Error(JSON.stringify(error.errors)));
            res.send(result);
        });
});


// Get a single patient by the patient id
server.get("/patients/:id", function (req, res, next) {
    console.log("GET request: patients/" + req.params.id);

    // Find a single patient by their id
    Patient.find({ _id: req.params.id }).exec(function (error, patient) {
        if (patient && patient.length) {
            // Send the patient if no issues
            res.send(patient);
        } else {
            // Send 404 header if the patient doesn't exist
            res.send(404);
        }
    });
});

// Delete a single patient with the given id
server.del("/patients/:id", function (req, res, next) {
    console.log("DEL request: patients/" + req.params.id);
    Patient.deleteOne({ _id: req.params.id }, function (error, result) {
        // If there are any errors, pass them to next in the correct format
        if (error) return next(new Error(JSON.stringify(error.errors)));

        // Send a 200 OK response
        res.send(result);
    });
});

// Update a patient with the given id
server.patch("/patients/:id", function (req, res, next) {
    console.log("PATCH request: patients/" + req.params.id);
    console.log("PATCH request: patients body=>" + JSON.stringify(req.body));

    // Creating patching patient according to param
    var obj = new Object();
    if (req.body.first_name !== undefined) obj.first_name = req.body.first_name;
    if (req.body.last_name !== undefined) obj.last_name = req.body.last_name;
    if (req.body.date_of_birth !== undefined)
        obj.date_of_birth = req.body.date_of_birth;
    if (req.body.biological_sex !== undefined)
        obj.biological_sex = req.body.biological_sex;
    if (req.body.email !== undefined) obj.email = req.body.email;
    if (req.body.contact_phone !== undefined)
        obj.contact_phone = req.body.contact_phone;
    if (req.body.residential_address !== undefined)
        obj.residential_address = req.body.residential_address;
    if (req.body.emergency_contact !== undefined)
        obj.emergency_contact = req.body.emergency_contact;
    if (req.body.emergency_phone !== undefined)
        obj.emergency_phone = req.body.emergency_phone;
    if (req.body.relationship !== undefined)
        obj.relationship = req.body.relationship;
    if (req.body.medicaldata !== undefined)
        obj.medicaldata = req.body.medicaldata;

    console.log("Patch patient fields =>" + JSON.stringify(obj));

    Patient.updateOne({ _id: req.params.id }, obj).exec(function (error, result) {
        // If there are any errors, pass them to next in the correct format
        if (error) return next(new Error(JSON.stringify(error.errors)));

        // Send a 200 OK response
        res.send(result);
    });
});

// Get a single medical record by the patient id and medical id
server.get("/patients/:pid/medical/:mid", function (req, res, next) {
    console.log("GET request: patients/" + req.params.pid + "/medical/" + req.params.mid);

    // Find a single patient by the id
    Patient.find({ _id: req.params.pid }).exec(function (error, patient) {
        if (patient && patient.length) {
            var medicaldata = patient[0].medicaldata.find(function (item) {
                return item._id == req.params.mid;
            });
            // Send the medical data if no issues
            if (medicaldata) {
                res.send(medicaldata);
            } else {
                res.send(404);
            }
        } else {
            // Send 404 header if the patient doesn't exist
            res.send(404);
        }
    });
});

// Add a single medical record by the patient id
server.post("/patients/:pid/medical", function (req, res, next) {
    console.log("POST request: patients/" + req.params.pid + "/medical");

    // Find a single patient by the id
    Patient.find({ _id: req.params.pid }).exec(function (error, patient) {
        if (patient && patient.length) {
            var obj = new Object();
            if (req.body.sortkey !== undefined)
                obj.sortkey = req.body.sortkey;
            if (req.body.measuring_date !== undefined)
                obj.measuring_date = req.body.measuring_date;
            if (req.body.measuring_time !== undefined)
                obj.measuring_time = req.body.measuring_time;
            if (req.body.systolic_pressure !== undefined)
                obj.systolic_pressure = req.body.systolic_pressure;
            if (req.body.diastolic_pressure !== undefined)
                obj.diastolic_pressure = req.body.diastolic_pressure;
            if (req.body.respiratory_rate !== undefined)
                obj.respiratory_rate = req.body.respiratory_rate;
            if (req.body.oxygen_level !== undefined)
                obj.oxygen_level = req.body.oxygen_level;
            if (req.body.heartbeat_rate !== undefined)
                obj.heartbeat_rate = req.body.heartbeat_rate;
            //console.log(patient);
            //console.log(obj);

            Patient.updateOne({ _id: req.params.pid }, {
                $push:
                    { 'medicaldata': obj }
            }, { upsert: true }, function (error, result) {
                // If there are any errors, pass them to next in the correct format
                if (error) return next(new Error(JSON.stringify(error.errors)));

                // Send a 200 OK response
                res.send(result);
            });
        } else {
            // Send 404 header if the patient doesn't exist
            res.send(404);
        }
    });
});

// Delete a single medical record by the patient id and the medical id
server.del("/patients/:pid/medical/:mid", function (req, res, next) {
    console.log("DEL request: patients/" + req.params.pid + "/medical/" + req.params.mid);

    // Find a single patient by the id
    Patient.find({ _id: req.params.pid }).exec(function (error, patient) {
        if (patient && patient.length) {
            //console.log(patient);
            const medicalId = mongoose.Types.ObjectId(req.params.mid);  //this is the comment ID
            //console.log(medicalId);
            Patient.updateOne({ _id: req.params.pid }, {
                $pull: { medicaldata: { _id: medicalId } }
            }, function (err, result) {
                if (!err) {
                    console.log("successfully deleted");
                    // Send a 200 OK response
                    res.send(result);
                } else {
                    console.log("err in deletion");
                    res.send(404);
                }
            });
        } else {
            // Send 404 header if the patient doesn't exist
            res.send(404);
        }
    });
});

// Update a single medical record by the patient id and the medical id
server.patch("/patients/:pid/medical/:mid", function (req, res, next) {
    console.log("PATCH request: patients/" + req.params.pid + "/medical/" + req.params.mid);

    // Find a single patient by the id
    Patient.find({ _id: req.params.pid }).exec(function (error, patient) {
        if (patient && patient.length) {
            console.log(patient);
            Patient.updateOne({ _id: req.params.pid, "medicaldata._id": req.params.mid }, {
                $set: {
                    "medicaldata.$.sortkey": req.body.sortkey,
                    "medicaldata.$.measuring_date": req.body.measuring_date,
                    "medicaldata.$.measuring_time": req.body.measuring_time,
                    "medicaldata.$.systolic_pressure": req.body.systolic_pressure,
                    "medicaldata.$.diastolic_pressure": req.body.diastolic_pressure,
                    "medicaldata.$.respiratory_rate": req.body.respiratory_rate,
                    "medicaldata.$.oxygen_level": req.body.oxygen_level,
                    "medicaldata.$.heartbeat_rate": req.body.heartbeat_rate
                }
            }, function (err, result) {
                if (!err) {
                    console.log("successfully updated");
                    // Send a 200 OK response
                    res.send(result);
                } else {
                    console.log("err in updating");
                    res.send(404);
                }
            });
        } else {
            // Send 404 header if the patient doesn't exist
            res.send(404);
        }
    });
});
