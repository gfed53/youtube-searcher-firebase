var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');

var app = express();

//****** Middleware

app.use(bodyParser.json());

// ******* You can toggle between serving 'src' and 'build' directories if need be.
app.use(express.static('src'));

app.get('/access', function(req, res){
    res.json(config.KEYS);
});

var runServer = function(callback) {
    
    app.listen(config.PORT, function() {
        console.log('Listening on localhost:' + config.PORT);
        if (callback) {
            callback();
        }
    });
};

if (require.main === module) {
    runServer(function(err) {
        if (err) {
            console.error(err);
        }
    });
}