/*	Copyright 2016 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
*/

'use strict';

var koa = require('koa');
var config = require('config')(require('./config.js'));
var logger = require('koa-logger');
var fresh = require('koa-fresh');
var etag = require('koa-etag');
var compress = require('koa-compress');
var conditional = require('koa-conditional-get');

var route = require('koa-route');
var pg = require('koa-pg');
var body = require('koa-body');

var app = koa();

var pages = {
	create: function *(site) {
		try {
			var result = yield this.pg.db.client.query_('CREATE TABLE pages."' + site + '" (name TEXT PRIMARY KEY, body TEXT);');
			this.body = result.command;
		} catch(e) {
			if(e.code == '42P07') {
				e.status = 409;
				e.expose = true;
			}
			throw e;
		}
	},
	remove: function *(site) {
		try {
			var result = yield this.pg.db.client.query_('DROP TABLE pages."' + site + '";');
			this.body = result.command;
		} catch(e) {
			if(e.code == '3F000') {
				e.status = 404;
				e.expose = true;
			}
			throw e;
		}
	},
	get: function *(site) {
		try {
			var result = yield this.pg.db.client.query_('SELECT name FROM pages."' + site + '";');
		} catch(e) {
			if(e.code == '42P01') {
				e.status = 404;
				e.expose = true;
			}
			throw e;
		}
		this.type = 'json';
		this.body = JSON.stringify((result.rows !== undefined ? result.rows : {}));
	},
};

var page = {
	create: function *(site, page) {
		if(this.request.body === undefined) {
			this.throw(400, 'no page body');
		}
		try {
			var result = yield this.pg.db.client.query_('INSERT INTO pages."' + site + '" (name, body) VALUES ($1::text, $2::text);', [page, this.request.body]);
			this.body = result.command + ' ' + result.rowCount;
		} catch(e) {
			if(e.code == '23505') {
				e.status = 409;
				e.expose = true;
			}
			throw e;
		}
	},
	remove: function *(site, page) {
		var result = yield this.pg.db.client.query_('DELETE FROM pages."' + site + '" WHERE name = $1::text;', [page]);
		this.body = result.command + ' ' + result.rowCount;
	},
	modify: function *(site, page) {
		if(this.request.body === undefined) {
			this.throw(400, 'no page body');
		}
		var result = yield this.pg.db.client.query_('UPDATE pages."' + site + '" SET body = $2::text WHERE name = $1::text', [page, this.request.body]);
		if(result.rowCount == 0)
			this.throw(404);

		this.body = result.command + ' ' + result.rowCount;
	},
	get: function *(site, page) {
		try {
			var result = yield this.pg.db.client.query_('SELECT body FROM pages."' + site + '" WHERE name = $1::text;', [page]);
		} catch (e) {
			if(e.code == '42P01') {
				e.status = 404;
				e.expose = true;
			}
			throw e;
		}
		this.type = 'markdown';
		if(result.rows.length == 0)
			this.throw(404);

		this.body = result.rows[0].body;
	},
};

var server;

config.onReady(function() {
	app.use(logger());
	app.use(body({strict: false}));
	app.use(pg(config.db.toString()));
	app.use(compress());
	app.use(conditional());

	app.use(route.get('/:site', pages.get));
	app.use(route.put('/:site', pages.create));
	app.use(route.del('/:site', pages.remove));
	app.use(route.get('/:site/:page', page.get));
	app.use(route.put('/:site/:page', page.create));
	app.use(route.del('/:site/:page', page.remove));
	app.use(route.post('/:site/:page', page.modify));

	server = app.listen(config.port);
});

config.onChange(function() {
	server.close(function() {
		server = app.listen(config.port);
	});
});
