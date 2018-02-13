const expect = require('expect');
const request = require('supertest');
const mongoose = require('mongoose');
const {ObjectID} = require('mongodb');

const {app, server} = require('../server');
const Todo = require('../models/todo');
const User = require('../models/user');

const todos = [{
    _id: new ObjectID(),
    text: 'First test todo'
}, {
    _id: new ObjectID(),
    text: 'Second test todo'
}];

beforeEach(done => {
    Todo.remove({})
        .then(() => Todo.insertMany(todos))
        .then(() => done());
});

after(done => {
    server.close();
    mongoose.connection.close();
    done();
});

describe('POST /todos', () => {
    it('should create a new todo', done => {
        const text = 'My test todo text';
        
        request(app)
            .post('/todos')
            .send({text})
            .expect(200)
            .expect(res => {
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find({text}).then(todos => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch(ex => done(ex));
            });
    });

    it('should not create todo with invalid body data', done => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find().then(todos => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch(ex => done(ex));
            });
    });
});

describe('GET /todos', () => {
    it('should get all todos', done => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect(res => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

describe('GET /todos/:id', () => {
    it('should return todo doc', done => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });

    it('should return a 404 if todo not found', done => {
        const id = new ObjectID();
        request(app)
            .get(`/todos/${id.toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('should return a 404 for non-object ids', done => {
        const id = '1234';
        request(app)
            .get(`/todos/${id}`)
            .expect(404)
            .end(done);
    });
});