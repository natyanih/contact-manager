var express = require('express'),
	app = express();

var mongoose = require('mongoose');

mongoose.connection.once('open', function () {
	console.log('MongoDB connection opened.');
});
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error: '));
var options = require('./creds');
mongoose.connect('mongodb://localhost:27017/test', options);

var ContactSchema = new mongoose.Schema({
	name: String,
	number: String,
	username: String
});
var Contact = mongoose.model('contacts', ContactSchema);

// Setup CORS related headers
var corsSettings = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'origin, content-type, accept');
	// deal with OPTIONS method during a preflight request
	if (req.method === 'OPTIONS') {
		res.send(200);
	} else {
		next();
	}
}

app.use(express.bodyParser());
app.use(corsSettings);

function listContacts(req, res) {
	var options = {};
	if (req.query.skip) {
		options.skip = req.query.skip;
	}
	if (req.query.limit) {
		options.limit = req.query.limit;
	}
	Contact.find(null, null, options, function (err, docs) {
		if (err) {
			console.log(err);
			res.send(500, err);
		} else {
			res.send(200, docs);
		}
	});
}

// Note: For security reasons, fields must be validated before saving to database in a real world scenario.
// This is only for training purposes so it's not necessary to do validation.
function createContact(req, res) {
	Contact.create(req.body, function (err, doc) {
		if (err) {
			console.log(err);
			res.send(500, err);
		} else {
			res.send(200, doc);
		}
	});
}

function deleteContactById(req, res) {
	var id = req.params.id;
	Contact.findByIdAndRemove(id, function (err, doc) {
		if (err) {
			console.log(err);
			res.send(404, err);
		} else {
			res.send(200, doc);
		}
	})
}

function updateContactById(req, res) {
	var id = req.params.id;
	var newData = {
		name: req.body.name,
		number: req.body.number,
		username: req.body.username
	};
	Contact.findByIdAndUpdate(id, newData, function (err, doc) {
		if (err) {
			console.log(err);
			res.send(404, err);
		} else {
			res.send(200, doc);
		}
	});
}

app.get('/contacts', listContacts);
app.post('/contacts', createContact);
app.put('/contacts/:id', updateContactById);
app.delete('/contacts/:id', deleteContactById);

app.listen(9090);
