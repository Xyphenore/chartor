import {lstatSync} from "fs";

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

export {isDirectory};
