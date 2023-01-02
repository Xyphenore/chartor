// For optimization
import compression from "compression";
import express from "express";
import {
    existsSync as exists,
    mkdirSync as mkdir,
    lstatSync,
    readdirSync,
    writeFileSync as writeFile,
    rmSync as rm,
} from "fs";

// For security
import helmet from "helmet";

// For logs
import createError from "http-errors";
import logger from "morgan";

// For views
import nunjucks from "nunjucks";

import {dirname, join} from "path";
import rfs from "rotating-file-stream";
import {fileURLToPath} from "url";
import zlib from "zlib";

import {router as indexRouter} from "./routes/index.js";

/**
 * The application.
 *
 * @constant
 * @type {app}
 *
 * @version 1.0.0
 * @since 1.0.0
 */
const app = express();

const INTERNAL_ERROR = 500;

/**
 * Check if the given path is a directory.
 *
 * @param {!string} path String not null.
 *
 * @throws {TypeError} Thrown if the given path is not a string.
 * @throws {TypeError} Thrown if the given path is null.
 *
 * @returns {!boolean} Returns True if the path is a directory, else False.
 *
 * @since 1.0.0
 * @author Axel DAVID
 */
const isDirectory = function(path) {
    if (null === path) {
        throw new TypeError(
            "The given path is null. Please give a path not null.",
        );
    }

    if ("string" !== typeof path) {
        throw new TypeError(
            "The given path is not a string."
            + ` Type: '${typeof path}'. Value: '${path}'.`
            + " Please give a string.",
        );
    }

    return lstatSync(path)
        .isDirectory();
};

// Define constantes node js server for esmodule
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// View engine setup
/**
 * The path of view directory.
 *
 * @constant
 * @type {string}
 *
 * @since 1.0.0
 */
const VIEWS_DIR = join(__dirname, "views");
if (!exists(VIEWS_DIR)) {
    throw new Error(`Internal Error. The views directory does not exist. Value: '${VIEWS_DIR}'. Please create it.`);
}
if (!isDirectory(VIEWS_DIR)) {
    throw new Error(
        "Internal Error. The views directory is not a directory."
        + `Value: '${VIEWS_DIR}'.`
        + "Please verify the object with the name of the view's directory.",
    );
}

nunjucks.configure(VIEWS_DIR, {
    autoescape: true,
    throwOnUndefined: true,
    trimBlocks: true,
    lstripBlocks: true,
    noCache: true,
    web: {
        useCache: false,
        async: false,
    },
    express: app,
});

// Security setup
app.use(helmet());

// TODO Tester la vitesse de l'application
// TODO Mettre en place différents compresseur en fonction des routes
// https://www.npmjs.com/package/compression
app.use(compression({
    chunkSize: zlib.Z_DEFAULT_CHUNK_SIZE,
    level: zlib.Z_DEFAULT_COMPRESSION,
    memLevel: zlib.Z_DEFAULT_MEMLEVEL,
    strategy: zlib.Z_DEFAULT_STRATEGY,
    threshold: "1kb",
    windowBits: zlib.Z_DEFAULT_WINDOWBITS,
}));

// Create logs directory
/**
 * The path of logs directory.
 *
 * @constant
 * @type {string}
 *
 * @since 1.0.0
 */
const LOGS_DIR = join(__dirname, "logs");
if (!exists(LOGS_DIR)) {
    mkdir(LOGS_DIR);
}
if (!isDirectory(LOGS_DIR)) {
    throw new Error(
        "Internal Error. The logs directory is not a directory."
        + `Value: '${LOGS_DIR}'.`
        + "Please verify the object with the name of the log's directory.",
    );
}

// TODO Remove dev logger
app.use(logger("dev", {immediate: false}));

// Logger for access
const LOG_STREAM = rfs.createStream(
    join("access.log"),
    {
        interval: "1d",
        path: LOGS_DIR,
    },
);
app.use(logger(
    "combined",
    {
        immediate: false,
        stream: LOG_STREAM,
    },
));

app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Add public directory
/**
 * The path of public directory.
 *
 * @constant
 * @type {string}
 *
 * @since 1.0.0
 */
const PUBLIC_DIR = join(__dirname, "public");
if (!exists(PUBLIC_DIR)) {
    throw new Error(`Internal Error. The public directory does not exist. Value: '${PUBLIC_DIR}'. Please create it.`);
}
if (!isDirectory(PUBLIC_DIR)) {
    throw new Error(
        "Internal Error. The public directory is not a directory."
        + `Value: '${PUBLIC_DIR}'.`
        + "Please verify the object with the name of the public's directory.",
    );
}

app.use(express.static(PUBLIC_DIR));

// Add routes
app.use("/", indexRouter);

// Catch 404 and forward to error handler
app.use((req, _secondIgnored, next) => {
    next(createError.NotFound("Unknown resource at URL: " + req.url));
});

// Error handler
app.use((err, req, res, _ignored) => {
    // Set locals, only providing errors in development
    res.locals.message = err.message;
    res.locals.error = "development" === req.app.get("env") ? err : {};

    // Render the error page
    res.status(err.status || INTERNAL_ERROR);
    res.render("error");
});

// List CSV files

/**
 * The path of data directory.
 *
 * @constant
 * @type {string}
 *
 * @since 1.0.0
 */
const DATA_DIR = join(PUBLIC_DIR, "data");
if (!exists(DATA_DIR)) {
    throw new Error(`Internal Error. The data directory does not exist. Value: '${DATA_DIR}'. Please create it.`);
}
if (!isDirectory(DATA_DIR)) {
    throw new Error(
        "Internal Error. The data directory is not a directory."
        + `Value: '${DATA_DIR}'.`
        + "Please verify the object with the name of the data directory.",
    );
}

// List csv files in data
/**
 * List all csv file from data directory.
 *
 * @param {!string} dataDir String not null.
 * The path of the data directory.
 *
 * @throws {TypeError} Thrown if the data directory is null.
 * @throws {TypeError} Thrown if the data directory is not a string.
 * @throws {Error} Thrown if the path does not exist.
 * @throws {Error} Thrown if the path is not a directory.
 *
 * @returns {!Set<string>} Returns the list of csv names.
 *
 * @since 1.0.0
 * @author Axel DAVID
 */
const listCSVFiles = function(dataDir) {
    if (null === dataDir) {
        throw new TypeError(
            "The given path is null. Please give a path not null.",
        );
    }
    if ("string" !== typeof dataDir) {
        throw new TypeError(
            "The given path is not a string."
            + ` Type: '${typeof dataDir}'. Value: '${dataDir}'.`
            + " Please give a string.",
        );
    }

    if (!exists(DATA_DIR)) {
        throw new Error(`Internal Error. The data directory does not exist. Value: '${dataDir}'. Please create it.`);
    }
    if (!isDirectory(DATA_DIR)) {
        throw new Error(
            "Internal Error. The data directory is not a directory."
            + `Value: '${dataDir}'.`
            + "Please verify the object with the name of the data directory.",
        );
    }

    return new Set(
        readdirSync(dataDir)
            .filter(file => file.endsWith(".csv")),
    );
};

/**
 * The path of the file 'csv.txt'.
 *
 * @type {!string}
 * @constant
 * @since 1.0.0
 * @author Axel DAVID
 */
const NAMES_FILE = join(PUBLIC_DIR, "csv.txt");
if (exists(NAMES_FILE)) {
    rm(NAMES_FILE);
}
listCSVFiles(DATA_DIR)
    .forEach(name => {
        writeFile(NAMES_FILE, name + "\n", {flag: "a"});
    });

export {app};
