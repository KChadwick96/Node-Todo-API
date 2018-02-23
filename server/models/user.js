const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const Schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        require: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

Schema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email']);
};

Schema.methods.generateAuthToken = function() {
    const user = this;
    const access = 'auth';
    const token = jwt.sign({
        _id: user._id.toHexString(),
        access
    }, 'abc').toString();

    user.tokens = user.tokens.concat([{access, token}]);

    return user.save().then(() => {
        return token;
    });
}

Schema.statics.findByToken = function(token) {
    const User = this;
    let decoded;

    try {
        decoded = jwt.verify(token, 'abc');
    } catch(ex) {
        return Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
}

Schema.statics.findByCredentials = function(email, password) {
    const User = this;

    return User.findOne({email}).then(user => {
        if (!user) {
            return Promise.reject();
        }

        return bcrypt.compare(password, user.password).then(res => {
            console.log(res);
            if (res) {
                console.log(user);
                return user;
            } else {
                reject();
            }
        });
    });
}

Schema.pre('save', function(next) {
    const user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

const User = mongoose.model('User', Schema);

module.exports = User;