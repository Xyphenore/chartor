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
 *
 * @param {!string} val A variable containing a port.
 *
 * @throws {Error} Thrown if the value cannot be converted to a valid port.
 * @throws {TypeError} Thrown if the value is null.
 * @throws {TypeError} Thrown if the value is not a string.
 *
 * @returns {!number} port.
 *
 * @since 1.0.0
 * @author Express (Base)
 * @author Axel DAVID (Edit)
 */
const normalizePort = function(val) {
    if (null === val) {
        throw new TypeError(
            "The given value is null. Please give a value not null.",
        );
    }

    if ("string" !== typeof val) {
        throw new TypeError(
            "The given value is not a string."
            + ` Type: '${typeof val}'. Value: '${val}'.`
            + " Please give a string.",
        );
    }

    const localPort = parseInt(val, 10);

    if (!isNaN(localPort) && 0 <= localPort) {
        // port number
        return localPort;
    }

    throw new Error(
        "Cannot normalize the port contains in the value."
        + ` Value: '${val}'.`
        + " Please give a valid value like an integer.",
    );
};

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 *
 * @author Express
 * @since 1.0.0
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
 *
 * @author Express
 * @since 1.0.0
 */
const onListening = function() {
    const addr = server.address();
    const bind = "string" === typeof addr
        ? "pipe " + addr
        : "port " + addr.port;
    debug("Listening on " + bind);
};

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
