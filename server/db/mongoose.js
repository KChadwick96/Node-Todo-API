const mongoose = require('mongoose');

// use promises
mongoose.Promise = global.Promise;
const uri = `mongodb://admin:o4OHqmlXD30bcWFz@playground-shard-00-00-kn1ug.mongodb.net:27017,playground-shard-00-01-kn1ug.mongodb.net:27017,playground-shard-00-02-kn1ug.mongodb.net:27017/todoapp?ssl=true&replicaSet=Playground-shard-0&authSource=admin`

// connect
mongoose.connect(uri);

module.exports = mongoose;