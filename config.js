/*	Copyright 2016 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

module.exports = {
	name: 'pages',
	port: process.env.PORT || 8080,
	config: {
		host: 'localhost' || process.env.CONFIG_HOST,
		port: 8081 || process.env.CONFIG_PORT,
	},
};
