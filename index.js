const express = require('express')
const app = express()

var rp = require('request-promise');
var Promise = require('promise');
var bodyParser = require('body-parser');

// parse application/json 
app.use(bodyParser.json());

function getVehicles(modelYear, manufacturer, model, withRating, callback) {
	console.log('inside getvehicles');
	console.log('modelYear:' + modelYear);
	console.log('manufacturer:' + manufacturer);
	console.log('model:' + model);
	console.log('withRating:' + withRating);

	var respObj ={};
	var options1 = {
    uri: 'https://one.nhtsa.gov/webapi/api/SafetyRatings/modelyear/' 
    	+ modelYear + '/make/' + manufacturer + '/model/' + model +'?format=json',
    json: true // Automatically parses the JSON string in the response
	};
	rp(options1)
	  .then(function (res) {
	  	console.log("rp res:" + JSON.stringify(res));
	    var promises = [];
	    respObj['Count'] = res.Count;
	    respObj['Results'] = [];
	    for(var i=0;i<res.Results.length;i++){
	    	var vehicleId = res.Results[i].VehicleId;
	    	respObj['Results'].push({'VehicleId': vehicleId
	    		, 'Description': res.Results[i].VehicleDescription});
	    	var options2 = {
			    uri: 'https://one.nhtsa.gov/webapi/api/SafetyRatings/VehicleId/'
			    	+ vehicleId+'?format=json',
			    json: true // Automatically parses the JSON string in the response
				};

				promises.push(rp(options2));
	    }
	    if(withRating) {
				Promise.all(promises)
				  .then(function (res) {
				    for(var j=0;j<res.length;j++){
				    	respObj['Results'][j]['CrashRating'] = res[j].Results[0].OverallRating;
				    }
				    callback(respObj);
				  });
			}else {
				console.log("sending response");
				callback(respObj);
			}
	  })
	  .catch(function (err) {
	  	console.log("sending error default response");
	    callback({'Count':0, 'Results': []});
	  });
}

app.get('/vehicles/:modelYear/:manufacturer/:model', function(req, res){
  var withRating = false;
	if(req.query){
  	if(req.query.withRating != null) {
  		withRating = req.query.withRating.toLowerCase() == 'true';
  	}
  }
  var modelYear =  req.params.modelYear;
  var manufacturer = req.params.manufacturer;
  var model = req.params.model;
  getVehicles(modelYear, manufacturer, model, withRating, function(results){
  	res.json(results);
  });
})

app.post('/vehicles', function(req, res){
  var modelYear = req.body.modelYear;
  var model = req.body.model;
  var manufacturer = req.body.manufacturer;
  console.log
  getVehicles(modelYear, manufacturer, model, false, function(respObj){
  	res.json(respObj);
  });
});

app.listen(8888, function () {
  console.log('Server listening on port 8888!')
});