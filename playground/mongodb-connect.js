const { MongoClient, ObjectID } = require('mongodb');

const uri = `mongodb://admin:o4OHqmlXD30bcWFz@playground-shard-00-00-kn1ug.mongodb.net:27017,playground-shard-00-01-kn1ug.mongodb.net:27017,playground-shard-00-02-kn1ug.mongodb.net:27017/todoapp?ssl=true&replicaSet=Playground-shard-0&authSource=admin`

/* const obj = new ObjectID();
console.log(obj); */

MongoClient.connect(uri, (err, client) => {
    if (err) {
        return console.log('Failed to connect to database server');
    }

    console.log('Connected to database server!');

    const db = client.db('todoapp');

    /* db.collection('todos').insertOne({
        text: 'My task',
        completed: false
    }, (err, result) => {
        if (err) {
            return console.log('Unable to insert todo', err);
        }

        console.log(JSON.stringify(result.ops, undefined, 2));
    }); */

    db.collection('users').insertOne({
        name: 'Kieran',
        age: 21,
        location: 'Manchester'
    }, (err, result) => {
        if (err) {
            return console.log('Unable to insert user', err);
        }

        const docCreated = result.ops[0];
        console.log(JSON.stringify(docCreated, undefined, 2));
        console.log(docCreated._id.getTimestamp());
    });

    client.close();
});