'use strict';
const finalhandler = require('finalhandler');
const http = require('http');
const serveStatic = require('serve-static');

// Serve up build folder
const index = process.argv.length > 2 ? process.argv[2] : 'index.html';
const serve = serveStatic('.', { index: [index] });

// Create server
const server = http.createServer(function onRequest(req, res) {
    serve(req, res, finalhandler(req, res));
});

// Listen
server.listen(1234);
