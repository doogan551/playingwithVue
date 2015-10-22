var express = require('express');
var	router = express.Router();
var _ = require('lodash');
var	passport = require('passport');

router.get('/login', function(req, res) {
	res.render('login');
});

router.post('/authenticate', function(req, res, next){
	passport.authenticate('local', function(err, user, info){
		if (err) {
			return next(err);
		} else if (info) {
			return res.json(info);
		}

		req.logIn(user, function(err) {
			if (err) {
				return next(err);
			}

			return res.json(user);
		});
	})(req, res, next);
});


router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

module.exports = router;
