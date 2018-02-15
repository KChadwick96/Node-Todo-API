const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

const mongoose = require('./db/mongoose');
const Todo = require('./models/todo');
const User = require('./models/user');

const port = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    const todo = new Todo({
        text: req.body.text
    });

    todo.save().then(
        doc => res.send(doc),
        err => res.status(400).send(err)
    );
});

app.get('/todos', (req, res) => {
    Todo.find().then(
        todos => res.send({todos}),
        err => res.status(400).send(err)
    );
});

app.get('/todos/:id', (req, res) => {
    const id = req.params.id;
    
    // validate todo id
    if (ObjectID.isValid(id) === false) {
        return res.status(404).send();
    }

    Todo.findById(id).then(todo => {
        if (!todo) {
            res.status(404).send();
        }

        res.send({todo});
    }).catch(ex => res.status(400).send());
});

app.delete('/todos/:id', (req, res) => {
    const id = req.params.id;

    // validate todo id
    if (ObjectID.isValid(id) === false) {
        return res.status(404).send();
    }

    Todo.findByIdAndRemove(id).then(todo => {
        if (!todo) {
            return res.status(404).send();
        } 

        res.send({todo});
    }).catch(ex => res.status(400).send());
});

app.patch('/todos/:id', (req, res) => {
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
        body.complted = false;
        body.completed_at = null;
    }

    Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then(todo => {
        if (!todo) {
            return res.status(404).send();
        }

        res.send({todo});
    }).catch(ex => res.status(400).send());
});

const server = app.listen(port, () => console.log(`Started on port ${port}`));

module.exports = {app, server};

/*
const newUser = new User({email: '   test@outlook.com   '});
newUser.save().then(
    doc => console.log('User added', doc),
    error => console.log(error)
);
*/