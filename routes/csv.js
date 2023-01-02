import {existsSync as exists, readdirSync} from "fs";
import {isDirectory} from "../libs/path.js";
import {Router} from "express";

const router = Router();

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
 * @returns {!object} Returns the list of csv names.
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

    if (!exists(dataDir)) {
        throw new Error(`Internal Error. The data directory does not exist. Value: '${dataDir}'. Please create it.`);
    }
    if (!isDirectory(dataDir)) {
        throw new Error(
            "Internal Error. The data directory is not a directory."
            + `Value: '${dataDir}'.`
            + "Please verify the object with the name of the data directory.",
        );
    }

    const files = new Set(
        readdirSync(dataDir)
            .filter(file => file.endsWith(".csv")),
    );

    const filesJson = {list: []};

    files.forEach(file => filesJson.list.push(file));

    return filesJson;
};

let CACHE = null;

/**
 * Load the list of csv files contains in the directory 'data'.
 *
 * @param {!string} dataDir The directory path.
 *
 * @since 1.0.0
 * @author Axel DAVID
 */
const loadCSVList = function(dataDir) {
    CACHE = listCSVFiles(dataDir);
};

/**
 * Return the list of csv files to the client, like a json.
 *
 * @throws {Error} Thrown if the list of csv files is not loaded.
 *
 * @since 1.0.0
 * @version 1.0.0
 * @author Axel DAVID
 */
const csvRoute = function(_ignoredReq, res, _ignoredNext) {
    if (null == CACHE) {
        throw new Error(
            "Cannot send the list of csv files."
            + " The list is null."
            + " Please initialize the list before opening the port of the server.",
        );
    }
    res.json(CACHE);
};

router.get("/", csvRoute);

export {router, loadCSVList};
