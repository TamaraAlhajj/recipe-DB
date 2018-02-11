//Tamara Alhajj 100948027

var mongo = require('mongodb').MongoClient;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

const ROOT = "./public";
const URL = "mongodb://localhost:27017/recipeDB";

app.set('views', './views');
app.set('view engine', 'pug');

//log requests
app.use(function (req, res, next) {
    console.log(req.method + " request for " + req.url);
    next();
});

//main page
app.get(['/', '/index.html', '/home', '/index'], function (req, res) {
    console.log("serving main pug page")
    res.render('index');
});

//load all current recipes into dropdown
app.get("/recipes", function (req, res) {
    var recipes = [];  //hold recipe names
    mongo.connect(URL, function (err, db) {
        var collections = db.collections("recipes");
    collections.find({}, { name: 1 }, function (err, cursor) {  //fetch recipe names
            if (err) handleStatus(res, err, 500, 'FAILED TO CONNECT TO DATABASE');  //mongo error 
            else {
                cursor.each(function (err, document) {   //iterate through recipes
                    if (err) handleStatus(res, err, 500, 'FAILED TO CONNECT TO DATABASE'); //mongo error         
                    else if (document == null) res.send(JSON.stringify({ names: recipes })); //no more recipes to iterate, so send all
                    else recipes.push(document.name); //add recipe to array
                    db.close();
                });
            }
        });
    });
});

//handle specific recipe
app.get("/recipe/:name", function (req, res) {
    mongo.connect(URL, function (err, db) {
        var collections = db.collections("recipes");
        if (err) handleStatus(res, err, 500, 'FAILED TO CONNECT TO DATABASE'); //mongo error
        else {
            //assume unique recipe names
        collections.findOne({ name: req.params.name }, function (err, document) {
                if (document === null) handleStatus(res, err, 404, 'ERROR GETTING RECIPE'); //client side error
                else res.send(document); //send recipe
                db.close();
            });
        }
    });
});

//handle post request
//recipe updates for only the corresponding fields in the document
app.use("/recipe", bodyParser.urlencoded({ extended: true }));
app.post("/recipe", function (req, res) {
    mongo.connect(URL, function (err, db) {
        var collections = db.collections("recipes");
        if (!req.body.name) handleStatus(res, 'Bad Request', 400, 'ERROR NO RECIPE NAME');
        else {
            //Upsert recipe: Inserts/Updates urlencoded object of recipe item as appropriate 
        collections.update({ name: req.body.name }, req.body, { upsert: true }, function (err, data) {
                //log object info
                console.log("body: ", req.body);
                if (err) handleStatus(res, err, 500, 'ERROR CONNECTING TO DB'); //mongo error
                else handleStatus(res, 'OK', 200, 'UPDATED RECIPE'); //success
                db.close();
            });
        }
    });
});

//handle all static requests
app.use(express.static(ROOT));

//if all else fails... client side error
app.all("*", function (req, res) { res.sendStatus(404) });

app.listen(2406, function () { console.log("Express server listening on port 2406"); });


/**
 * function: send status
 * 
 * @param {Object} res client response
 * @param {any} status error details, if any
 * @param {int} code http code
 * @param {string} msg response message
 */
function handleStatus(res, status, code, msg) {
    console.log(msg + ": " + status);
    res.sendStatus(code);
}