
var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var MongoClient = require('mongodb').MongoClient, assert = require('assert');
// Connection URL
var url = 'mongodb://localhost:27017/moviesBE';

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});


app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/sample', function (req, res) {
    var response = {message: 'you called /sample with GET operation'};
    res.send(response);
});

app.post('/sample', function(req, res) {
    console.log('Request body: ', req.body);
    var response = {message: 'you called /sample with POST operation', originData: req.body};
    res.send(response);
});


app.post('/addFav', function (req , res) { //request result
    // Connect to the server and open database 'MoviesDB'
    MongoClient.connect( url , function (err , connection) {
        assert.equal( null , err );
        console.log( 'Connected successfully to server! ', req.body );
        var database = connection.db( 'MoviesDB' );

        var message = {movie: req.body};
        insertMovie(database, message, function () {
            // Close the database
            connection.close();
        });

    } );
} );


app.post('/delFav', function (req , res) { //request result
    // Connect to the server and open database 'MoviesDB'
    MongoClient.connect( url , function (err , connection) {
        console.log( 'Connected successfully to server! ', req.body.id );
        assert.equal( null , err );
        var database = connection.db( 'MoviesDB' );
        var collection = database.collection('favMovies');
        // Delete first document where a is 3
        //collection.findOneAndDelete({''})

        // Call callback function
       collection.deleteOne({'movie.id': req.body.id}, function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.result.n);
            console.log("Removed movie");
            connection.close();
        });

    } );
} );

app.get('/getFav', function (req , res) { //request result
    // Connect to the server and open database 'MoviesDB'
    MongoClient.connect( url , function (err , connection) {
        assert.equal( null , err );
        if (doDebug) {
            console.log('Connected successfully to server! ', req.body);
        }
        var database = connection.db( 'MoviesDB' );

        var collection = database.collection('favMovies');
        // Find my favourite some movies
        collection.find({}).toArray(function(err, movies) {
            assert.equal(err, null);
            if (doDebug) {
                console.log("Found the following records");
                console.log(movies);
            }
            res.send(movies);
            connection.close();
        });
    } );
} );

app.post('/addSearchQuery', function (req) { //request result
    // Connect to the server and open database 'MoviesDB'
    MongoClient.connect( url , function (err , connection) {
        assert.equal( null , err );
        if (doDebug) {
            console.log('Connected successfully to server! ', req.body);
        }
        var database = connection.db( 'MoviesDB' );

        //var message = {movie: req.body};
        insertSearchQuery(database, req, function () {
            // Close the database
            connection.close();
        });

    } );
} );

app.get('/getSearchHistory', function (req , res) { //request result
    // Connect to the server and open database 'MoviesDB'
    if (doDebug) {
        console.log('arrived at backend to get search history');
    }
    MongoClient.connect( url , function (err , connection) {
        assert.equal( null , err );
        if (doDebug) {
        console.log( 'Connected successfully to server! ', req.body );
        }
        var database = connection.db( 'MoviesDB' );

        var collection = database.collection('searchHistory');
        // Find my favourite some movies
        collection.find({}).toArray(function(err, result) {
            assert.equal(err, null);
            if (doDebug) {
                console.log("Found the following records");
                console.log(result);
            }
            res.send(result);
            connection.close();
        });
    } );
} );

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

// ########################################################################
var insertSearchQuery = function(db, searchQuery, callback) {
    var collection = db.collection('searchHistory');
    var currentDate = new Date().toISOString();

    collection.findOne({'query':searchQuery.param('query')},
        function(err, result) {
            if (result != null) {
                collection.updateOne({'query':searchQuery.param('query')} , { $set: {'query':searchQuery.param('query'), 'count':searchQuery.param('resultCount'), "date":currentDate} }, function(err, result) {
                assert.equal(err, null);
                assert.equal(1, result.result.n);
                console.log("Updated search query");
                callback(result);
            });
            } else {
                collection.insertOne({'query':searchQuery.param('query'), 'count':searchQuery.param('resultCount'), "date":currentDate}, function(err, result) {
                    assert.equal(err, null);
                    assert.equal(1, result.ops.length);
                    console.log("Inserted search query into the history collection");
                    callback(result);
                });
            }
            callback(result);
        });
}
// ########################################################################

var insertMovie = function(db, movie, callback) {
    var collection = db.collection('favMovies');
    collection.insertOne(movie,
        function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.ops.length);
            console.log("Inserted movie into the favorite collection");
            callback(result);
        });
};

var findMovies = function(db, callback) {
// Get the movies collection
    var collection = db.collection('favMovies');
// Find some movies
    //collection.find({'a':3})
    collection.find({}).toArray(function(err, movies) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(movies)
        callback(movies); // Call callback function
    });
};


var insertDocuments = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.insertMany([ {a : 1}, {a : 2}, {a : 3} ],
        function(err, result) {
            assert.equal(err, null);
            assert.equal(3, result.result.n); // result = the document
            assert.equal(3, result.ops.length); // ops = the inserted docs
            console.log("Inserted 3 documents into the collection");
            callback(result); // Call callback function
        });
};

var findAll = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Find some documents
    collection.find({}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs)
        callback(docs); // Call callback function
    });
};

var updateDocument = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Update first document where a is 2, set b equal to 1
    // $set updates existing attributes or inserts new attributes
    collection.updateOne({ a : 2 } , { $set: { b : 1 } },
        function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.result.n);
            console.log("Updated document with field a equal 2");
            callback(result);
        });
};
/*
var removeDocument = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Delete first document where a is 3
    collection.deleteOne({ a : 3 }, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log("Removed document with field a equal 3");
        callback(result);
    });
};
*/
/*
var express = require('express');
var app = express();
app.get('/', function (req, res) {
    res.send('Hello World!');
});
app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
*/

/*
var express = require('express');
var path = require('path');
var app = express();
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

app.get('/sample', function (req, res) {
    var response = {message: 'you called /sample with GET operation'};
            res.send(response);
});
app.post('/sample', function(req, res) {
    console.log('Request body: ', req.body);
    var response = {message: 'you called /sample with POST operation', originData: req.body};
            res.send(response);
});


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
// Connection URL
var url = 'mongodb://localhost:27017/Movies';
// Use connect method to connect to the server
MongoClient.connect(url, function(err, connection) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    var database = connection.db('MoviesDB');
    //connection.close();

    insertDocuments(database, function() {
        updateDocument(database, function() {
            removeDocument(database, function() {
                findDocuments(database, function() {
                    connection.close();
                });
            });
        });
    });



});

var insertSearchLine = function(db, callback) {
    var collection = db.collection('searchLines');
    collection.insertOne([{a:1}],
    function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.ops.length);
        console.log("Inserted search line into the collection");
        callback(result);
    });
}

var insertMovie = function(db, callback) {
    var collection = db.collection('movies');
    collection.insertOne([{}],
        function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.ops.length);
            console.log("Inserted movie into the favorite collection");
            callback(result);
        });
}

var findMovies = function(db, callback) {
// Get the documents collection
    var collection = db.collection('movies');
// Find some documents
    //collection.find({'a':3})
    collection.find({}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs)
        callback(docs); // Call callback function
    });
}

var removeMovie = function(db, callback) {
    var collection = db.collection('movies');
    collection.deleteOne([{}],
        function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.ops.length);
            console.log("Removed movie from the favorite collection");
            callback(result);
        });
}

var insertDocuments = function(db, callback) {
// Get the documents collection
    var collection = db.collection('documents');
// Insert some documents
    collection.insertMany([ {a : 1}, {a : 2}, {a : 3} ],
        function(err, result) {
            assert.equal(err, null);// result = the document
            assert.equal(3, result.ops.length); // ops = the inserted docs
            console.log("Inserted 3 documents into the collection");
            callback(result); // Call callback function
        });
}

var findDocuments = function(db, callback) {
// Get the documents collection
    var collection = db.collection('documents');
// Find some documents
    //collection.find({'a':3})
    collection.find({}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs)
        callback(docs); // Call callback function
    });
}

var updateDocument = function(db, callback) {
// Get the documents collection
    var collection = db.collection('documents');
// Update first document where a is 2, set b equal to 1
// $set updates existing attributes or inserts new attributes
    collection.updateOne({ a : 2 } , { $set: { b : 2 } },
        //collection.updateMany({ a : 3 } , { $set: { c : 1 } },
        function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.result.n);
            console.log("Updated document with field a equal 2");
            callback(result);
        });
}

var removeDocument = function(db, callback) {
// Get the documents collection
    var collection = db.collection('documents');
// Delete first document where a is 3
    collection.deleteOne({ a : 3 }, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log("Removed document with field a equal 3");
        callback(result);
    });
}
*/