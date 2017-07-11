/*	Copyright 2016 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

module.exports = {
	name: 'pages',
	port: process.env.PORT || 8080,
	config: {
		host: process.env.CONFIG_HOST || 'localhost',
		port: process.env.CONFIG_PORT || 8081,
	},
};
