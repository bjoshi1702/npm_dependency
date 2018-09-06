const fs = require('fs');
const fetch = require("node-fetch");

init();
// parse command line arguments
function init() {
  if (process.argv.length < 3) {
    console.error("Missing package name.");
    console.log("Usage: node npm-dep-viz.js <package-name> [[--devDependencies][--peerDependencies]] [[--version=<version_number>][--at-date=<date>]] [--json]");
    return;
  }
  var name = process.argv[2];

  requestData(name, finalizeData);
}

// fetch json data for package
function requestData(name, callBack) {
  fetch('http://registry.npmjs.org/'.concat(name))
    .then(res=>res.json())
    .then(json => {
      if (json.hasOwnProperty('error') && json['error'] == 'Not found')
        console.error("Invalid package name \'" + name + "\'." );
	  else
		callBack(json, makeJson);
      })
    .catch(err => console.error("Network error."));
}

// parse json according to command line arguments
function finalizeData(response, callBack) {
  var isDevDependecies = false;
  var isPeerDependencies = false;
  var date; 					// date given by user
  var version; 					// version given by user.
  var onlyJson = false;
  var treeVersion; 				// final version to be displayed.
  var depType = 'dependency'; 	// type of dependency normal, peer, dev.

  if (process.argv.length > 3) { // options given
    for (var i = 3; i < process.argv.length; i++) {
      if (process.argv[i] == '--devDependencies') {
        isDevDependecies = true;
		depType = "dev dependency";
      } else if (process.argv[i] == '--peerDependencies') {
        isPeerDependencies = true;
		depType = "peer dependency";
      } else if (process.argv[i].startsWith('--at-date' )) {
        dateStr = process.argv[i].substring(process.argv[i].indexOf("=") + 1);
        date = new Date(dateStr);
      } else if (process.argv[i].startsWith('--version')) {
        version = process.argv[i].substring(process.argv[i].indexOf("=") + 1);
      } else if (process.argv[i] == '--json') {
        onlyJson = true;
      } else {
        console.error("Invalid option \'" + process.argv[i] + "\'.");
        return;
      }
    }
  } 
  
  var availableVersions = [];

  for (var v in response['versions'])  {
    availableVersions.push(v);
  }

  // When user specify both date and version it can be possible that they are
  // refering to two different versions of the same package and can create conflict.
  if (version && date) {
    console.error("Not valid, received two version references.");
    return;
  } else if (isDevDependecies && isPeerDependencies) { // conflicting request
    console.error("Not valid, choose any one view.");
    return;
  } else if (version) {
    if (availableVersions.includes(version)) {
      treeVersion = version;
    } else {
      console.error("Version number is not valid. Available version(s) are,");
      console.log(availableVersions);
      return;
    }
  } else if (date) {
    for (var key in availableVersions) {
      var curDate = new Date(response['time'][availableVersions[key]]);
      
      if (curDate > date) {
        if (key == 0) {
          console.log("Package was not available at/before given date.");
          return;
        }
        treeVersion = availableVersions[key - 1];
        break;
      }
    }
    if (!treeVersion) {
      treeVersion = availableVersions[availableVersions.length - 1];
    }
  } else {
    treeVersion = availableVersions[availableVersions.length - 1]; // latest version
  }

  var dependList = [];
  var versionList = [];

  if (isDevDependecies) {
    for (var key in response["versions"][treeVersion]["devDependencies"]) {
      dependList.push(key);
      versionList.push(response["versions"][treeVersion]["devDependencies"][key]);    
    }
  } else if (isPeerDependencies) {
    for (var key in response["versions"][treeVersion]["peerDependencies"]) {
      dependList.push(key);
      versionList.push(response["versions"][treeVersion]["peerDependencies"][key]);    
    }
  } else {
    for (var key in response["versions"][treeVersion]["dependencies"]) {
      dependList.push(key);
      versionList.push(response["versions"][treeVersion]["dependencies"][key]);
    }
  }
  if (dependList.length == 0) {
	  console.log("No " + depType + " for package " + process.argv[2] + ".");
	  return;
  }
  callBack(process.argv[2], treeVersion, dependList, versionList, onlyJson, depType);
}

// create json for dependency tree
function makeJson(rootName, rootVersion, depNames, depVersions, onlyJson, type) {
    var treeJson = {};
    treeJson.name = rootName;
    treeJson.version = rootVersion;
	treeJson.depType = type;
    var children = [];

    for (var i = 0; i < depNames.length; i++) {
        var child = {};
        child.name = depNames[i];
        child.version = depVersions[i];
        children.push(child);
    }
    treeJson.children = children;
    
    if (onlyJson) {
    	console.log(treeJson);
    	return; 
    }

    // write json data to file
    fs.writeFile("./treeData.json", JSON.stringify(treeJson), (err) => {
      if (err) {
        console.error("Error in creation of json file.");
        return;
      }
    })

   	require("openurl").open("index.html")
}