'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/challenge', {useNewUrlParser: true, useUnifiedTopology: true})
		.then(() => {
			console.log ("<<< Database connection successful >>>");

			app.listen(port, () => {
				console.log ("Upload Server on: http://localhost:3800");
			});
		})
		.catch(err => console.log(err));