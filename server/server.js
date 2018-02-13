const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

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
    
    // validate todo api
    if (ObjectID.isValid(id) === false) {
        return res.status(404).send();
    }

    Todo.findById(id).then(todo =>{
        if (todo) {
            res.send({todo});
        } else {
            res.status(404).send();
        }
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