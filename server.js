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

// JWT
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var secret = "secret";

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
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
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
    data = config.applicationString+' v'+config.versionString+' ('+config.buildString+')';
    res.send(data);
});

app.post('/login', function(req, res) {
    console.log('login');

    var username = req.body.username || req.query.username;
    var password = req.body.password || req.query.password;
    var user = {username : username, password : password};

    db.collection('users', function(err, users) {
        if (err) {
            res.send({'error' : error.errmsg});
            return;
        }

        users.findOne({'username' : username }, function(err, user) {
            if (err) {
                res.send({'error' : error.errmsg});
                return;
            }

            // authenticated
            if (user && user.password == password) {

                // generate JWT
                var token = jwt.sign(user, secret, {
                        expiresIn: "24h" // expires in 24 hours
                    }, 
                    function(err, token) {
                        if (err) {
                            res.status(501);
                            res.json({
                                success: false,
                                message: 'Error in token generation.'
                            });
                        }

                        var tokenExpiry = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
                        // var tokenExpiry = new Date().getTime() + (5 * 60 * 1000); // 5 minutes; FOR TESTING
                        // return the information including token as JSON
                        res.status(200);
                        res.json({
                            success: true,
                            message: 'Log in successful',
                            token: token,
                            tokenExpiry : tokenExpiry
                        });
                        res.end();              
                    }
                );
            } else {
                res.status(401);
                res.json({
                    success: false,
                    message: 'Log in failed',
                });
                res.end();              
            }
        });
    });
});

// SECURED ROUTES 
// TODO: SECURE THESE ENDPOINTS WITH APPROPRIATE AUTHENTICATION/AUTHORIZATION MECHANISM
// get an instance of the router for api routes
var apiRoutes = express.Router(); 

apiRoutes.use(cors());

// utility method
function errorResponse(res, statusCode, statusMessage) {
    res.status(statusCode);
    res.json({
        success : false,
        message : statusMessage
    });        
    res.end();
}

apiRoutes.use(function(req, res, next) {
    // disable by short circuiting
    // next(); return;

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {
        // verifies secret and checks exp
        // jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
        jwt.verify(token, secret, function(err, decodedToken) {      
            if (err) {
                errorResponse(res, 403, "Invalid security token.");
                return;
            } else {
                // re-verify username and password (in case user has been deleted by admin)
                var username = decodedToken.username;
                var password = decodedToken.password;
                // todo

                // if everything is good, save to request for use in other routes
                req.decodedToken = decodedToken;  

                if (req.method == 'POST') {
                    req.body.dateCreate = new Date().toISOString();
                    req.body.userCreate = username;
                }  
                if (req.method == 'PUT') {
                    req.body.dateUpdate = new Date().toISOString();
                    req.body.userUpdate = username;
                }

                // force date field to UTC Z format
                if (req.body.date) {
                    var date = req.body.date;
                    if (!(date instanceof Date)) { // not a Date (probaby string), try to make Date from it
                        date = new Date(date);
                        if (isNaN(date.getTime())) { // invalid date, create own
                            date = new Date(); 
                        }
                    }
                    req.body.date = date.toISOString();
                }

                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        errorResponse(res, 403, "Missing security token.");
        return;
    }
});

// USERS
apiRoutes.get('/users', function(req, res, next) {
    console.log('Retrieving users');
    db.collection('users', function(err, collection) {
        if (err) {
            res.send({'error' : err.errmsg});
            return;
        }

        collection.find().toArray(function(err, users) {
            if (err) {
                res.send({'error' : err.errmsg});
                return;
            }

            res.send(users);
        });
    });

});

apiRoutes.get('/users/:id', function(req, res, next) {
    var id = req.params.id;

    console.log('Retrieving user ' + id);
    db.collection('users', function(err, collection) {
        if (err) {
            res.send({'error' : err.errmsg});
            return;
        }

        collection.findOne({'_id': new ObjectID(id)}, function(err, user) {
            if (err) {
                res.send({'error' : err.errmsg});
                return;
            }

            if (!user) {
                res.status(404);
                res.json({
                    success: false,
                    message: "User not found.",
                });
                res.end();
                return;
            } else {
                res.send(user);
                return;
            }
        });
    });
});

apiRoutes.post('/users', function(req, res, next) {
    var user = req.body;
    if (!(user.username && user.password && user.confirmPassword)) {
        errorResponse(res, 400, "username, password, confirmPassword required.");
        return;
    }
    if (user.password != user.confirmPassword) {
        errorResponse(res, 400, "password and confirmPassword must match.");
        return;
    }
    delete user.confirmPassword;

    console.log('Creating new user');
    db.collection('users', function(err, collection) {
        if (err) {
            res.send({'error' : err.errmsg});
            return;
        }

        // check if id already in use
        collection.findOne({'_id': new ObjectID(user._id)}, function(err, item) {
            if (err) {
                res.send({'error' : err.errmsg});
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
                collection.insertOne(user, {safe:true}, function(err, result) {
                    if (err) {
                        res.send({'error' : err.errmsg});
                        return;
                    }

                    console.log('Success: ' + JSON.stringify(result[0]));
                    res.send(result[0]);
                });
            } 
        });
    });
});

apiRoutes.put('/users/:id', function(req, res, next) {
    var id = req.params.id;
    var user = req.body;
    if (!(user.username && user.password && user.confirmPassword)) {
        errorResponse(res, 400, "username, password, confirmPassword required.");
        return;
    }
    if (user.password != user.confirmPassword) {
        errorResponse(res, 400, "password and confirmPassword must match.");
        return;
    }
    delete user.confirmPassword;

    delete user._id;

    db.collection('users', function(err, collection) {
        if (err) {
            res.send({'error' : err.errmsg});
            return;
        }

        collection.findOne({'_id': new ObjectID(id)}, function(err, oldUser) {
            if (err) {
                res.send({'error' : err.errmsg});
                return;
            }

            if (!oldUser) {
                res.status(404);
                res.json({
                    success: false,
                    message: "User not found.",
                });
                res.end();
                return;
            }

            console.log('Updating user: ' + user._id);
            collection.update({'_id': new ObjectID(id)}, user, {safe:true}, function(err, result) {
                if (err) {
                    res.send({'error' : err.errmsg});
                    return;
                }
                console.log('' + result + ' user updated');
                res.send(user);
            });
        });
    });
});

apiRoutes.delete('/users/:id', function(req, res, next) {
    var id = req.params.id;

    db.collection('users', function(err, collection) {
        if (err) {
            res.send({'error' : err.errmsg});
            return;
        }

        collection.findOne({'_id': new ObjectID(id)}, function(err, user) {
            if (err) {
                res.send({'error' : err.errmsg});
                return;
            }

            if (!user) {
                res.status(404);
                res.json({
                    success: false,
                    message: "User not found.",
                });
                res.end();
                return;
            }

            console.log('Deleting user: ' + user._id);
            collection.remove({'_id': new ObjectID(id)}, {safe:true}, function(err, result) {
                if (err) {
                    res.send({'error' : err.errmsg});
                    return;
                }

                console.log('' + result + ' user deleted');
                res.send(req.body);
            });
        });
    }); 
});

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
                collection.insertOne(article, {safe:true}, function(err, result) {
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
        console.log('Creating new image');
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

