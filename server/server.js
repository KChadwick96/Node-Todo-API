const mongoose = require('mongoose');

// use promises and connect
mongoose.Promise = global.Promise;
const uri = `mongodb://admin:o4OHqmlXD30bcWFz@playground-shard-00-00-kn1ug.mongodb.net:27017,playground-shard-00-01-kn1ug.mongodb.net:27017,playground-shard-00-02-kn1ug.mongodb.net:27017/todoapp?ssl=true&replicaSet=Playground-shard-0&authSource=admin`
mongoose.connect(uri);

const Todo = mongoose.model('Todo', {
    text: {
        type: String,
        required: true,
        trim: true,
        minLength: 1
    },
    completed: {
        type: Boolean,
        default: false
    },
    completed_at: {
        type: Date,
        default: null
    }
});

const User = mongoose.model('User', {
    email: {
        type: String,
        required: true,
        trim: true,
        minLength: 1
    }
});

const newUser = new User({email: '   test@outlook.com   '});
newUser.save().then(
    doc => console.log('User added', doc),
    error => console.log(error)
);

/* const newTodo = new Todo({
    text: '  Do something else '
});

newTodo.save().then(
    doc => console.log('Todo added', doc),
    error => console.log(error)
); */