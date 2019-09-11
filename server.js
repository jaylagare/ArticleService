// CONFIG
var config = require('./config');
console.log(config.applicationString+" v"+config.versionString+" ("+config.buildString+")");

// PACKAGES
const express = require('express');
const helmet = require('helmet');
const logger = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const http = require('http');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require("fs");
const fileType = require('file-type');
const mongo = require("mongodb");

// DATABASE
var ObjectID = mongo.ObjectID;    
var MongoClient = mongo.MongoClient;
var connectionString = config.mongodbURL;
var db;
MongoClient.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
    if (err) {
        console.log(err);
        return;
    }
    db = client.db();
});

// SERVICE
var app = express();

// use helmet
app.use(helmet());

// use logger/morgan to log requests to the console
app.use(logger("dev")); // 'default', 'short', 'tiny', 'dev'

// use body parser so we can get info from POST and/or URL parameters
// app.use(bodyParser());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb', parameterLimit: 50000 }));

// app.use(methodOverride());

// app.use(app.router);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "localhost"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// app.use(function (req, res, next) {
//     // Website you wish to allow to connect
//     res.setHeader('Access-Control-Allow-Origin', '*'); // allow everyone to public service
//     // Request methods you wish to allow
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     // Request headers you wish to allow
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');
//     // Set to true if you need the website to include cookies in the requests sent
//     // to the API (e.g. in case you use sessions)
//     res.setHeader('Access-Control-Allow-Credentials', true);
// });

// // accept all OPTIONS
// app.options('*', function(req, res) {
//     res.sendStatus(200);
// });

// // disable etag
// app.set('etag', false); // turn off

// BASIC ROUTES
// about server
app.get('/', function(req, res) {
	console.log('/');
    data = config.applicationString+' v'+config.versionString+' ('+config.buildString+')'+'<br>';
    res.send(data);
});

// SECURED ROUTES 
// TODO: SECURE THESE ENDPOINTS WITH APPROPRIATE AUTHENTICATION/AUTHORIZATION MECHANISM
// get an instance of the router for api routes
var apiRoutes = express.Router(); 

apiRoutes.use(cors());

// ARTICLES
apiRoutes.get('/articles', function(req, res, next) {
    console.log('Retrieving articles');
	db.collection('articles', function(err, collection) {
        if (err) {
            res.send({'error' : error.errmsg});
            return;
        }

        collection.find().toArray(function(err, articles) {
            if (err) {
                res.send({'error' : error.errmsg});
                return;
            }

            res.send(articles);
        });
    });

});

apiRoutes.get('/articles/:id', function(req, res, next) {
	var id = req.params.id;

    console.log('Retrieving article ' + id);
    db.collection('articles', function(err, collection) {
        if (err) {
            res.send({'error' : error.errmsg});
            return;
        }

        collection.findOne({'_id': new ObjectID(id)}, function(err, article) {
            if (err) {
                res.send({'error' : error.errmsg});
                return;
            }

            if (!article) {
                res.status(404);
                res.json({
                    success: false,
                    message: "Article not found.",
                });
                res.end();
                return;
            } else {
                res.send(article);
                return;
            }
        });
    });
});

apiRoutes.post('/articles', function(req, res, next) {
	var article = req.body;
    article.publishDate = new Date().getTime();

    console.log('Creating new article');
    db.collection('articles', function(err, collection) {
        if (err) {
            res.send({'error' : error.errmsg});
            return;
        }

        // check if id already in use
        collection.findOne({'_id': new ObjectID(article._id)}, function(err, item) {
            if (err) {
                res.send({'error' : error.errmsg});
                return;
            }

            // if in use, return error
            if (item) {
                res.status(403);
                res.json({
                    success : false,
                    message : "id in use."
                });
                res.end();
            } else {
                collection.insert(article, {safe:true}, function(err, result) {
                    if (err) {
                        res.send({'error' : error.errmsg});
                        return;
                    }

                    console.log('Success: ' + JSON.stringify(result[0]));
                    res.send(result[0]);
                });
            } 
        });
    });
});

apiRoutes.put('/articles/:id', function(req, res, next) {
	var id = req.params.id;
    var article = req.body;
    article.modifyDate = new Date().getTime();

    delete article._id;

    db.collection('articles', function(err, collection) {
        if (err) {
            res.send({'error' : error.errmsg});
            return;
        }

        collection.findOne({'_id': new ObjectID(id)}, function(err, oldArticle) {
            if (err) {
                res.send({'error' : error.errmsg});
                return;
            }

            if (!oldArticle) {
                res.status(404);
                res.json({
                    success: false,
                    message: "Article not found.",
                });
                res.end();
                return;
            }

            console.log('Updating article: ' + article._id);
            collection.update({'_id': new ObjectID(id)}, article, {safe:true}, function(err, result) {
                if (err) {
                    res.send({'error' : error.errmsg});
                    return;
                }
                console.log('' + result + ' article updated');
                res.send(article);
            });
        });
    });
});

apiRoutes.delete('/articles/:id', function(req, res, next) {
	var id = req.params.id;

    db.collection('articles', function(err, collection) {
        if (err) {
            res.send({'error' : error.errmsg});
            return;
        }

        collection.findOne({'_id': new ObjectID(id)}, function(err, article) {
            if (err) {
                res.send({'error' : error.errmsg});
                return;
            }

            if (!article) {
                res.status(404);
                res.json({
                    success: false,
                    message: "Article not found.",
                });
                res.end();
                return;
            }

            console.log('Deleting article: ' + article.id);
            collection.remove({'_id': new ObjectID(id)}, {safe:true}, function(err, result) {
                if (err) {
                    res.send({'error' : error.errmsg});
                    return;
                }

                console.log('' + result + ' article deleted');
                res.send(req.body);
            });
        });
    });	
});

// IMAGES
var upload = multer({
  dest: __dirname + '/images/',
  limits: {fileSize: 10000000, files:1}
})
apiRoutes.post('/images', upload.single('filename'), function(req, res, next) {
    if (!req.file) {
        res.status(400).end()
    } else {
        // res.send(req.files);
        console.log('Creating new image ' + id);
        res.send(req.file);
        res.status(200).end()
    }
});

apiRoutes.get('/images/:id', function(req, res, next) {
    var id = req.params.id;

    console.log('Retrieving image ' + id);

    var options = {
            root: __dirname + '/images',
            dotfiles: 'deny',
            headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    var filename = __dirname + "/images/"+id;

    // get content type using file-type (fast, reads part of header only)
    fs.open(filename, 'r', function(err, fd) {
        if (err) {
            // throw err;
            res.status(404).end(); // probably file not found
            return;
        }

        var data = new Buffer(100);
        fs.read(fd, data, 0, 100, 0, function(err, num) {
            if (err) throw err;

            // get content type using file-type
            try{
                var type = fileType(data).mime;

                // set content type
                res.setHeader('Content-Type', type);
            }catch(e) {}

            res.sendFile(id, options, function (err) {
                if (err) {
                    console.log(err);
                    res.status(err.status).end();
                } else {
                    console.log('Sent image ' + id);
                    res.status(200).end();
                }
            }); 
        });
    });
});

apiRoutes.delete('/images/:id', function(req, res, next) {
    var id = req.params.id;

    console.log('Deleting image ' + id);
    var filename = __dirname + "/images/"+id;

    fs.unlink(filename, function(err) {
        if (err) {
            console.log(err);
            // res.status(err.status).end();
            res.status(404).end(); // assume unlink due to file not found
        } else {
            console.log("Deleted image " + id);
            res.status(200).end();
        }
    });
});

// apply the routes to our application with the prefix /
app.use('/', apiRoutes);

// get listen port
var port = config.port;
if (!port) port = 3000;

// create secure server
// var privateKey = fs.readFileSync( 'privatekey.pem' );
// var certificate = fs.readFileSync( 'certificate.pem' );

// https.createServer({
//     key: privateKey,
//     cert: certificate
// }, app).listen(port);

// app.listen(port, function () {
// 	console.log('Server listening on port '+port);
// });

// create server
var server = http.createServer(app);
server.on('error', function (e) {
  console.log(e);
});

// start listening
server.listen(port, function() {
    console.log('Server listening on port '+port);
});

