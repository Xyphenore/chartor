import express from "express";
import createError from "http-errors";
import logger from "morgan";
import nunjucks from "nunjucks";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
// import {STATUS_CODE} from "http";
import {router as indexRouter} from "./routes/index.js";
import {router as userRouter} from "./routes/users.js";

const app = express();

const NOT_FOUND_ERROR = 404;
const INTERNAL_ERROR = 500;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(logger("dev"));

// View engine setup
nunjucks.configure(join(__dirname, "views"), {
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
app.use(express.static(join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", userRouter);

// Catch 404 and forward to error handler
app.use((_firstIgnored, _secondIgnored, next) => {
    next(createError(NOT_FOUND_ERROR));
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
