const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const Todo = require('../../models/todo');
const User = require('../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const users = [{
    _id: userOneId,
    email: 'kieran@test.com',
    password: 'testpassword1',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, 'abc').toString()
    }]
}, {
    _id: userTwoId,
    email: 'kieran@example.com',
    password: 'testpassword2',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userTwoId, access: 'auth'}, 'abc').toString()
    }]
}];

const todos = [{
    _id: new ObjectID(),
    text: 'First test todo',
    _creator: userOneId,
}, {
    _id: new ObjectID(),
    text: 'Second test todo',
    completed: true,
    completed_at: new Date(),
    _creator: userTwoId,
}];

const populateTodos = done => {
    Todo.remove({})
        .then(() => Todo.insertMany(todos))
        .then(() => done())
        .catch(ex => console.log(ex));
}

const populateUsers = done => {
    User.remove({})
        .then(() => {
            const userOne = new User(users[0]).save();
            const userTwo = new User(users[1]).save();

            return Promise.all([userOne, userTwo]);
        })
        .then(() => done())
        .catch(ex => console.log(ex));
}

module.exports = {
    todos, populateTodos, users, populateUsers
};