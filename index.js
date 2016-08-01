/*	Copyright 2016 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
*/

'use strict';

if(process.env.NODE_ENV === 'production') {
	require('@google/cloud-trace').start();
	require('@google/cloud-debug');
}

var koa = require('koa');
var config = require('./config.js');
var logger = require('koa-logger');
var fresh = require('koa-fresh');
var etag = require('koa-etag');
var compress = require('koa-compress');
var conditional = require('koa-conditional-get');

var route = require('koa-route');
var pg = require('koa-pg');
var body = require('koa-body-parser');

var app = koa();

app.use(logger());
app.use(body());
app.use(pg(config.db.toString()));
app.use(compress());
app.use(conditional());
app.use(fresh());
app.use(etag());

var pages = {
	create: function *(site) {
		try {
			var schema = yield this.pg.db.client.query_('CREATE SCHEMA "' + site + '";');
			var table = yield this.pg.db.client.query_('CREATE TABLE "' + site + '".pages (name TEXT PRIMARY KEY, body TEXT);');
			this.body = schema.command + '\n' + table.command;
		} catch(e) {
			if(e.code == '42P06') {
				e.status = 409;
				e.expose = true;
			}
			throw e;
		}
	},
	remove: function *(site) {
		try {
			var result = yield this.pg.db.client.query_('DROP SCHEMA "' + site + '" CASCADE;');
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
			var result = yield this.pg.db.client.query_('SELECT name FROM "' + site + '".pages;');
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
		try {
			var result = yield this.pg.db.client.query_('INSERT INTO "' + site + '".pages (name, body) VALUES ($1::text, $2::text);', [page, this.request.body.body]);
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
		var result = yield this.pg.db.client.query_('DELETE FROM "' + site + '".pages WHERE name = $1::text;', [page]);
		this.body = result.command + ' ' + result.rowCount;
	},
	modify: function *(site, page) {
		var result = yield this.pg.db.client.query_('UPDATE "' + site + '".pages SET body = $2::text WHERE name = $1::text', [page, this.request.body.body]);
		if(result.rowCount == 0)
			this.throw(404);

		this.body = result.command + ' ' + result.rowCount;
	},
	get: function *(site, page) {
		try {
			var result = yield this.pg.db.client.query_('SELECT body FROM "' + site + '".pages WHERE name = $1::text;', [page]);
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

app.use(route.get('/:site', pages.get));
app.use(route.put('/:site', pages.create));
app.use(route.del('/:site', pages.remove));
app.use(route.get('/:site/:page', page.get));
app.use(route.put('/:site/:page', page.create));
app.use(route.del('/:site/:page', page.remove));
app.use(route.post('/:site/:page', page.modify));

app.listen(config.port);
