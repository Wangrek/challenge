'use strict'

var express = require('express');
var ProjectController = require('../controllers/project');

var api = express.Router();

api.get('/getData/:id', ProjectController.getApiData);
api.get('/getInfo', ProjectController.getProjects);
api.post('/saveInfo', ProjectController.saveProject);

module.exports = api;