/*	Copyright 2016 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

module.exports = {
	name: 'pages',
	db: {
		toString: function() {
			return 'postgres://' + this.user + (this.password !== '' ? ':' : '') + this.password + '@' + this.host + (this.port !== undefined ? ':' + this.port : '') + '/' + this.db;
		},
	},
	port: process.env.PORT || 8080,
	forward: 'http://' + (process.env.FORWARD !== undefined ? process.env.FORWARD : 'localhost:') + process.env.PORT + '/',
};
