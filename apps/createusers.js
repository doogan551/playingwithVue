var config = require('config');
var async = require('async');

var db = require('../helpers/db');
var utils = require('../helpers/utils');
var Security = require('../models/security');

var dbConfig = config.get('Infoscan.dbConfig');
var connectionString = [dbConfig.driver, '://', dbConfig.host, ':', dbConfig.port, '/', dbConfig.dbName];

var users = [{
  firstname: 'Morris',
  lastname: 'Healy'
}, {
  firstname: 'Stephen',
  lastname: 'Trent'
}, {
  firstname: 'Rob',
  lastname: 'Kendall',
  oldPassword: true,
  password: "$2a$10$87faffa3hLAKuKuKN9huoeUUXg1a53PYv9sUktAKtgfdjftnXHG22",
}, {
  firstname: 'Randy',
  lastname: 'Culler',
  oldPassword: true,
  password: "$2a$10$ZYx7B7F.4gnlzZIv/RN1W.uOJgmVWDYj3.2aDIfG9RMkM6oLS8Nem",
}, {
  firstname: 'Jeff',
  lastname: 'Shore'
}, {
  firstname: 'Robert',
  lastname: 'Barrett'
}, {
  firstname: 'Johnny',
  lastname: 'Roberts'
}, {
  firstname: 'Adam',
  lastname: 'Eldridge'
}, {
  firstname: 'Wayne',
  lastname: 'Lancaster'
}, {
  firstname: 'Tim',
  lastname: 'Koplin'
}, {
  firstname: 'Mark',
  lastname: 'Ferguson'
}, {
  firstname: 'Dennis',
  lastname: 'Cooke'
}, {
  firstname: 'Perry',
  lastname: 'Lyon'
}, {
  firstname: 'Austin',
  lastname: 'Groce'
}];

var title = 'Dorsett Technologies';

function createUsers() {
  db.connect(connectionString.join(''), function(err) {

    async.eachSeries(users, function(user, cb) {
      var username = [user.firstname.toLowerCase(), user.lastname.substr(0, 1).toLowerCase()].join('');
      var data = {
        username: username,
        Password: username,
        'First Name': user.firstname,
        'Last Name': user.lastname,
        Title: title,
        Description: title,
        'System Admin': true,
        'Password Reset': true
      };

      if (!!user.oldPassword) {
        data.Password = user.password;
        data.oldPassword = user.oldPassword;
        data['Password Reset'] = false;
      }

      Security.Users.newUser(data, function(err, result) {
        console.log(username, err, result.message);
        cb();
      });

    }, function(err) {
      console.log('done');
    });
  });
}
createUsers();