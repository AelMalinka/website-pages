/*	Copyright 2016 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
	Distributed under the terms of the GNU Affero General Public License v3
*/

'use strict';

const koa = require('koa');

const logger = require('koa-logger');
const etag = require('koa-etag');
const conditional = require('koa-conditional-get');

const config = require('config')(require('./config.js'));

const route = require('koa-route');
const pg = require('koa-pg');
const body = require('koa-bodyparser');

const app = new koa();

const pages = {
	create: async (ctx, site) => {
		try {
			const result = await ctx.pg.db.client.queryPromise('CREATE TABLE pages."' + site + '" (name TEXT PRIMARY KEY, body TEXT);');
			ctx.body = result.command;
		} catch(e) {
			if(e.code == '42P07') {
				e.status = 409;
				e.expose = true;
			}
			throw e;
		}
	},
	remove: async (ctx, site) => {
		try {
			const result = await ctx.pg.db.client.queryPromise('DROP TABLE pages."' + site + '";');
			ctx.body = result.command;
		} catch(e) {
			if(e.code == '3F000') {
				e.status = 404;
				e.expose = true;
			}
			throw e;
		}
	},
	get: async (ctx, site) => {
		try {
			const result = await ctx.pg.db.client.queryPromise('SELECT name FROM pages."' + site + '";');
			ctx.type = 'json';
			ctx.body = JSON.stringify((result.rows !== undefined ? result.rows : {}));
		} catch(e) {
			if(e.code == '42P01') {
				e.status = 404;
				e.expose = true;
			}
			throw e;
		}
	},
};

const page = {
	create: async (ctx, site, page) => {
		if(ctx.request.body === undefined) {
			ctx.throw(400, 'no page body');
		}
		try {
			const result = await ctx.pg.db.client.queryPromise('INSERT INTO pages."' + site + '" (name, body) VALUES ($1::text, $2::text);', [page, ctx.request.body]);
			ctx.body = result.command + ' ' + result.rowCount;
		} catch(e) {
			if(e.code == '23505') {
				e.status = 409;
				e.expose = true;
			}
			throw e;
		}
	},
	remove: async (ctx, site, page) => {
		const result = await ctx.pg.db.client.queryPromise('DELETE FROM pages."' + site + '" WHERE name = $1::text;', [page]);
		ctx.body = result.command + ' ' + result.rowCount;
	},
	modify: async (ctx, site, page) => {
		if(ctx.request.body === undefined) {
			ctx.throw(400, 'no page body');
		}
		const result = await ctx.pg.db.client.queryPromise('UPDATE pages."' + site + '" SET body = $2::text WHERE name = $1::text', [page, ctx.request.body]);
		if(result.rowCount == 0)
			ctx.throw(404);

		ctx.body = result.command + ' ' + result.rowCount;
	},
	get: async (ctx, site, page) => {
		try {
			const result = await ctx.pg.db.client.queryPromise('SELECT body FROM pages."' + site + '" WHERE name = $1::text;', [page]);
			ctx.type = 'markdown';
			if(result.rows.length == 0)
				ctx.throw(404);

			ctx.body = result.rows[0].body;
		} catch (e) {
			if(e.code == '42P01') {
				e.status = 404;
				e.expose = true;
			}
			throw e;
		}
	},
};

var server;

app.use(logger());
app.use(body({strict: false}));
app.use(conditional());

config.onReady(function() {
	app.use(pg(config.db.toString()));

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
