// For optimization
import compression from "compression";
import express from "express";
import {existsSync as exists, mkdirSync as mkdir} from "fs";

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

const app = express();

const NOT_FOUND_ERROR = 404;
const INTERNAL_ERROR = 500;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(logger("dev"));

// View engine setup
const VIEWS_DIR = join(__dirname, "views");
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

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Add public directory
const PUBLIC_DIR = join(__dirname, "public");
app.use(express.static(PUBLIC_DIR));

// Add routes
app.use("/", indexRouter);

// Catch 404 and forward to error handler
app.use((req, _secondIgnored, next) => {
    next(createError.NotFound("Unknown resource at URL: " + req.url));
});

// Error handler
app.use((err, req, res, _ignored) => {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = "development" === req.app.get("env") ? err : {};

    // Render the error page
    res.status(err.status || INTERNAL_ERROR);
    res.render("error");
});

export {app};
