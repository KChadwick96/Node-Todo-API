const expect = require('expect');
const request = require('supertest');

const {ObjectID} = require('mongodb');

const {app, server} = require('../server');
const Todo = require('../models/todo');
const User = require('../models/user');

const todos = [{
    _id: new ObjectID(),
    text: 'First test todo'
}, {
    _id: new ObjectID(),
    text: 'Second test todo',
    completed: true,
    completed_at: new Date()
}];

beforeEach(done => {
    Todo.remove({})
        .then(() => Todo.insertMany(todos))
        .then(() => done());
});

after(done => {
    server.close();
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

describe('DELETE /todos/:id', () => {
    it('should remove a todo', done => {
        const hexId = todos[1]._id.toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .expect(200)
            .expect(res => {
                expect(res.body.todo._id).toBe(hexId)
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(hexId).then(todo => {
                    expect(todo).toBeFalsy();
                    done();
                }).catch(ex => done(ex));
            });
    });

    it('should return 404 if todo not found', done => {
        const id = new ObjectID();
        request(app)
            .delete(`/todos/${id.toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('it should return 404 if object id is invalid', done => {
        const id = '1234';
        request(app)
            .delete(`/todos/${id}`)
            .expect(404)
            .end(done);
    });
});

describe('PATCH /todos/:id', () => {
    it('should update the todo', done => {
        const hexId = todos[0]._id.toHexString();
        const update = {
            text: 'Updated text',
            completed: true
        }

        request(app)
            .patch(`/todos/${hexId}`)
            .send(update)
            .expect(200)
            .expect(res => {
                const todo = res.body.todo;
                expect(todo.text).toBe(update.text);
                expect(todo.completed).toBe(true);
                expect(typeof todo.completed_at).toBe('string'); // will be a string since db does not return dates
            })
            .end(done);
    });

    it('should clear completed_at when todo is not completed', done => {
        const hexId = todos[1]._id.toHexString();
        const update = {
            text: 'Some more updated text',
            completed: false
        }

        request(app)
            .patch(`/todos/${hexId}`)
            .send(update)
            .expect(200)
            .expect(res => {
                const todo = res.body.todo;
                expect(todo.text).toBe(update.text);
                expect(todo.completed).toBe(false);
                expect(todo.completed_at).toBe(null);
            })
            .end(done);
    });
});