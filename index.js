#!/usr/bin/env node
'use strict'

const express = require('express');
const horizon = require('@horizon/server');
const r = require('rethinkdb');

var connection = undefined;
var queue = [];

function userExists(id) {
  return queue.some(function(el) {
    return el.id === id;
  }); 
}

r.connect({host: process.env.RETHINK_HOST, port: 28015, db: '4b'}, function(err, conn) {
    if (err) throw err;
    connection = conn;
    r.table('sessions').changes().run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.each(function(err, row) {
            if (row.new_val.stage > 4) {
                r.table('users').filter({session: row.new_val.id}).update({session:false}).run(connection, function(err, result) {
                    if (err) throw err;
                    console.log(result);
                });
                return;
            }
            if (row.new_val.voteCount > 1) {
                r.table('sessions')
                    .update({voteCount:0, stage: row.new_val.stage+1})
                    .run(connection, function(err, result) {
                        if (err) throw err;
                        console.log(result);
                    });
                r.table('users').filter({session: row.new_val.id}).update({voted:false}).run(connection, function(err, result) {
                    if (err) throw err;
                    console.log(result);
                });
            }
        });
    });
    r.table('users').changes().run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.each(function(err, row) {
            if (err) throw err;
            if (!row.new_val.session) {
                if (!userExists(row.new_val)) {
                    queue.push(row.new_val);
                }
            }
            if (queue.length === 2) {
                r.table('sessions').insert({
                    stage: 1,
                    voteCount: 0
                }).run(connection, function(err, result) {
                    if (err) throw err;
                    const sessionId = result.generated_keys[0];
                    const userOne = queue[0].id;
                    const userTwo = queue[1].id;
                    queue = [];
                    r.table('users')
                        .get(userOne)
                        .update({session: sessionId})
                        .run(connection, function(err, result) {
                            if (err) throw err;
                            console.log(result);
                        });
                    r.table('users')
                        .get(userTwo)
                        .update({session: sessionId})
                        .run(connection, function(err, result) {
                            if (err) throw err;
                            console.log(result);
                        });
                    console.log(result);
                });
            }
            console.log(JSON.stringify(row));
        });
    });
});

const app = express();
app.use(express.static(__dirname + '/dist'));
app.get('/', function(req, res) {
  res.sendFile('index.html');
});

console.log(process.env.RETHINK_HOST);
const httpServer = app.listen(8181);
const options = {
    project_name: '4b',
    auth: {
        token_secret: process.env.HORIZON_TOKEN_SECRET,
        allow_anonymous: true
    },
    rdb_host: process.env.RETHINK_HOST,
    permissions: false
};

const horizonServer = horizon(httpServer, options);

console.log('Listening on port 8181.');

