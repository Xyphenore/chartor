#!/usr/bin/env node

/**
 * Module dependencies.
 */
import debug_module from "debug";
import http from "http";
import gracefulShutdown from "http-graceful-shutdown";
import {app} from "../app.js";

const debug = debug_module("chartor");

/**
 * Normalize a port into a number, string, or false.
 */
const normalizePort = function(val) {
    const localPort = parseInt(val, 10);

    if (isNaN(localPort)) {
        // named pipe
        return val;
    }

    if (0 <= localPort) {
        // port number
        return localPort;
    }

    return false;
};

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */
const onError = function(error) {
    if ("listen" !== error.syscall) {
        throw error;
    }

    const bind = "string" === typeof port
        ? "Pipe " + port
        : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
    case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
    default:
        throw error;
    }
};

/**
 * Event listener for HTTP server "listening" event.
 */
const onListening = function() {
    const addr = server.address();
    const bind = "string" === typeof addr
        ? "pipe " + addr
        : "port " + addr.port;
    debug("Listening on " + bind);
};

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

// TODO Use production
gracefulShutdown(server, {
    timeout: 30000,
    signals: "SIGINT SIGTERM",
    development: true,
    forceExit: true,
});
