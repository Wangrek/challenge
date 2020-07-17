'use strict'
var JiraClient = require("jira-connector");
var TogglClient = require("toggl-api");
var Project = require('../models/project');

function getApiData(req, res) {
	var projectID;
	var projectKey;
	var boardID;
	var jiraIssues = [];
	var projectId = req.params.id;
	var counter = 0;
	var noData = true;

	//Set credentials/token to connect Jira and Toggl API's
	var toggl = new TogglClient({apiToken: 'd4d155ba3cd31567fa0c755370d323db'});
	var jira = new JiraClient({
				host: "stackitchallenge.atlassian.net",
			  basic_auth: {
			    email: "wangrek@gmail.com",
			    api_token: "ER6GnvhOiqOj5aSDfvJN4496"
			  }
			});
	
	if (projectId && projectId != null && projectId!=undefined) {
		jira.project.getAllProjects(null , (err, data) => {
			if(err) return res.status(500).send({Error: err});
			if(!data) return res.status(404).send({message: "There are no projects"});
	    data.forEach(element => {
	    	if (element.id == projectId) {
	    		projectID = element.id;
	    		projectKey = element.key;
	    		noData = false;
	    	}
	    });

			if(noData) return res.status(404).send({message: "The project doesn't exist"});    

	    jira.board.getAllBoards(null , (err, data) => {
	    	if(err) return res.status(500).send({Error: err});
	    	if(!data) return res.status(404).send({message: "There are no boards"});
	    	data.values.forEach(element => {
	    		if (element.name == projectKey + ' board') {
	    			boardID = element.id;
	    			noData = false;
	    		}
	    	});
	    	
	    	if(noData) return res.status(404).send({message: "The board doesn't exist"}); 

	    	jira.board.getIssuesForBoard({boardId: boardID} , (err, data) => {
	    		if(err) return res.status(500).send({Error: err});
	    		if(!data) return res.status(404).send({message: "There are no issues"});
	    		data.issues.forEach(function callback(element, index){
	    			var togglEntries = [];
	    			var aggregatedTags = [];
	    			var aggregateCategories = [];
	    			var totalDur = 0;
	    			toggl.getTimeEntries('2020-01-01T15:42:46+02:00', '2021-01-01T15:42:46+02:00', function(err, entries) {
	    				if(err) return res.status(500).send({Error: err});
	    				if(!entries) return res.status(404).send({message: "There are no entries"});
						  entries.forEach(entry => {
						  	var found = entry.description.indexOf(element.key);
						  	if(found != -1) {
						  		var cate = null;
						  		var date = new Date(null);
									date.setSeconds(entry.duration);
									var result = date.toISOString().substr(11, 8);
									totalDur = totalDur + entry.duration;
									
									if (!aggregatedTags.includes(entry.tags[0])) {
										aggregatedTags.push(entry.tags[0]);
									}

									switch(entry.tags[0]) {
									  case "refactoring":
									  case "bug_fix":
									  case "test_automation":
									  case "testing":
									  case "implementation":
									  case "refining":
									  case "code_review":
									  case "deployment":
									  case "tech_research":
									  case "qa_updates":
									  case "qa_testing":
									  	cate = "ALPHA";
									    break;
									  case "qa_automation":
									  case "planning":
									  case "design":
									  case "estimation":
									  case "coordination_work":
									  case "process":
									  case "training":
									  case "pm_admin":
									  case "accounting":
									  case "payroll":
									  case "invoices":
									  case "compliance":
									  case "admin":
									  case "onboarding":
									  case "off_boarding":
									  case "evaluation":
									  case "recruiting":
									  case "interviewing":
									    cate = "OMEGA";
									    break;
									  case "_non_billable":
									  case "_video_review":
									  case "_pair_working":
									  case "_meeting":
									    cate = "BETA";
									    break;  
									}

									if (!aggregateCategories.includes(cate)) {
										aggregateCategories.push(cate);
									}

						  		togglEntries.push({
						  			id: entry.id,
					          desc: entry.description,
					          start: entry.start,
					          stop: entry.stop,
					          duration: result,
					          durationMillSeconds: entry.duration * 1000,
					          tags : entry.tags, 
					          category: cate
						  		});
						  	} 
						  });
						});

	    			var assignee = null;
	    			jira.issue.getIssue({issueKey: element.key} , (err, d) => {
	    				if(err) return res.status(500).send({Error: err});
	    				if(!d) return res.status(404).send({message: "There is no issue"});
	    				if (d.fields.assignee != null) {
	    					assignee = d.fields.assignee.displayName
	    				}
	    				var dat = new Date(null);
							dat.setSeconds(totalDur);
							var resu = dat.toISOString().substr(11, 8);

	    				jiraIssues.push({
	    					id: element.key, 
	    					statusCategory: d.fields.status.name, 
	    					summary: d.fields.summary, 
	    					assignee: assignee,
	    					totalDuration: resu,
	    					totalDurationMillSeconds: totalDur * 1000,
	    					aggregatedTags: aggregatedTags,
	    					aggregateCategories: aggregateCategories, 
	    					estimatedDuration: d.fields.timetracking.originalEstimate,
	    					estimatedDurationMillSeconds: d.fields.timetracking.originalEstimateSeconds,
	    					togglEntries: togglEntries
	    				});
	    				counter += 1;
	    				if (data.issues.length == counter) {
	    					return res.status(200).send({projectID, jiraIssues});
	    				}
	    			});
	    			noData = false;
	    		});
	    		if(noData) return res.status(404).send({message: "The are no issues"});    		
	    	});
	    }); 
	  });
	} else {
		res.status(400).send({message: "Send a valid project ID"});
	}  	
}

function saveProject(req, res) {
	var params = req.body;
	var project = new Project();

	if (params.projectID && params.jiraIssues) {
		project.projectID = params.projectID;
		project.jiraIssues = params.jiraIssues;

		project.save((err, projectStored) => {
			if(err) return res.status(500).send({Error: err});
			if(projectStored) {
				res.status(200).send({project: projectStored});
			} else {
				res.status(404).send({message: "The project has not been saved!"});
			}
		});
	} else {
		res.status(400).send({
			message: "Send all the required fields!" 
		});
	}
}

function getProjects(req, res) {
	Project.find().exec((err, projects) => {
		if(err) return res.status(500).send({Error: err});
		if(projects.length == 0) return res.status(404).send({message: "There are no projects"});

		return res.status(200).send({projects});
	});
}

module.exports = {
	getApiData,
	getProjects,
	saveProject
}