const expect = require('expect');
const request = require('supertest');
const mongoose = require('mongoose');
const {ObjectID} = require('mongodb');

const {app, server} = require('../server');
const Todo = require('../models/todo');
const User = require('../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

after(done => {
    console.log('Closing test');
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

describe('GET /users/me', () => {
    it('should return user if authenticated', done => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect(res => {
                expect(res.body.user._id).toBe(users[0]._id.toHexString())
                expect(res.body.user.email).toBe(users[0].email);
            })
            .end(done);
    });

    it('should return 401 if not authenticated', done => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect(res => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('POST /users', () => {
    it('should create a user', done => {
        const email = 'example@example.com';
        const password = 'testpassword123';

        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect(res => {
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body.user._id).toBeTruthy();
                expect(res.body.user.email).toBe(email)
            })
            .end(err => {
                if (err) { 
                    return done(err);
                }

                User.findOne({email}).then(user => {
                    expect(user).toBeTruthy();
                    expect(user.password.length).toEqual(60);
                    done();
                }).catch(ex => done(ex));
            });
    });

    it('should return validation errors if request invalid', done => {
        const email = 'invalidemail';
        const password = 'abc'; // less than 6 chars

        request(app)
            .post('/users')
            .send({email, password})
            .expect(400)
            .expect(res => {
                expect(res.headers['x-auth']).toBeFalsy();
                expect(res.body).toEqual({});
            })
            .end(done);
    });

    it('should not create user if email in use', done => {
        const email = users[0].email;
        const password = 'testpassword'; // less than 6 chars

        request(app)
            .post('/users')
            .send({email, password})
            .expect(400)
            .expect(res => {
                expect(res.headers['x-auth']).toBeFalsy();
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('POSTS /users/login', () => {
    it('should login user and return auth token', done => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .expect(200)
            .expect(res => {
                expect(res.headers['x-auth']).toBeTruthy();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                User.findById(users[1]._id).then(user => {
                    expect(user.tokens[0].access).toBe('auth');
                    expect(user.tokens[0].token).toBe(res.headers['x-auth']);
                    done();
                }).catch(ex => done(ex));
            });
    });

    it('should reject invalid login', done => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password + 'a'
            })
            .expect(400)
            .expect(res => {
                expect(res.headers['x-auth']).toBeFalsy();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                User.findById(users[1]._id).then(user => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch(ex => done(ex));
            });
    });
});

describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', done => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                User.findById(users[0]._id).then(user => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch(ex => done(ex));
            });
    });
});