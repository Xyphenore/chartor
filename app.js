import * as express from "express";
import * as createError from "http-errors";
import * as logger from "morgan";
import {join} from "path";

import {router as indexRouter} from "./routes/index";
import {router as userRouter} from "./routes/users";

const app = express();

const NOT_FOUND_ERROR = 404;
const INTERNAL_ERROR = 500;

// View engine setup
app.set("views", join(__dirname, "views"));
app.set("view engine", "handlebars");

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
