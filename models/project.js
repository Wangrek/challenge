'use strict'

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ProjectSchema = Schema({
	projectID: String,
	jiraIssues: []
});

module.exports = mongoose.model('Project', ProjectSchema);