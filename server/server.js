require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');
const _ = require('lodash');

const mongoose = require('./db/mongoose');
const Todo = require('./models/todo');
const User = require('./models/user');
const {authenticate} = require('./middleware/authenticate');

const port = process.env.PORT;
const app = express();

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
    const body = _.pick(req.body, ['text']);
    body._creator = req.user._id;
    const todo = new Todo(body);

    todo.save().then(doc => res.send(doc))
        .catch(ex => res.status(400).send());
    
});

app.get('/todos', authenticate, (req, res) => {
    Todo.find({_creator: req.user._id}).then(
        todos => res.send({todos}),
        err => res.status(400).send(err)
    );
});

app.get('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id;
    
    // validate todo id
    if (ObjectID.isValid(id) === false) {
        return res.status(404).send();
    }

    Todo.findOne({
        _id: id,
        _creator: req.user._id
    }).then(todo => {
        if (!todo) {
            res.status(404).send();
        }

        res.send({todo});
    }).catch(ex => res.status(400).send());
});

app.delete('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id;

    // validate todo id
    if (ObjectID.isValid(id) === false) {
        return res.status(404).send();
    }

    Todo.findOneAndRemove({
        _id: id,
        _creator: req.user._id
    }).then(todo => {
        if (!todo) {
            return res.status(404).send();
        } 

        res.send({todo});
    }).catch(ex => res.status(400).send());
});

app.patch('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id;
    const body = _.pick(req.body, ['text', 'completed']); // take the params that can be updated

    // validate todo id
    if (ObjectID.isValid(id) === false) {
        return res.status(404).send();
    }

    // modify body
    if (_.isBoolean(body.completed) && body.completed) {
        body.completed_at = new Date();
    } else {
        body.completed = false;
        body.completed_at = null;
    }

    Todo.findOneAndUpdate({
        _id: id,
        _creator: req.user._id
    }, {$set: body}, {new: true}).then(todo => {
        if (!todo) {
            return res.status(404).send();
        }

        res.send({todo});
    }).catch(ex => res.status(400).send());
});

app.post('/users', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);

    user.save()
        .then(() => {
            return user.generateAuthToken();
        })
        .then(token => {
            res.header('x-auth', token).send({user});
        })
        .catch(ex => res.status(400).send());
});

app.get('/users/me', authenticate, (req, res) => {
    res.send({user: req.user});
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => res.send())
        .catch(ex => res.status(400).send());
});

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    
    User.findByCredentials(body.email, body.password).then(user => {
        return user.generateAuthToken().then(token => {
            res.header('x-auth', token).send({user});
        });
    }).catch(ex => res.status(400).send());
});

const server = app.listen(port, () => console.log(`Started on port ${port}`));

module.exports = {app, server};