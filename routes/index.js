import {Router} from "express";

const router = Router();

/**
 * Return the index view to the client.
 * The view loads the user JS script.
 * This script requests data and show charts on the browser.
 *
 * @since 1.0.0
 * @version 1.0.0
 * @author Axel DAVID
 * @see views.index.njk
 */
router.get("/", (_ignoredReq, res, _ignoredNext) => {
    res.render(
        "index.njk",
        {
            title: "Express",
        },
    );
});

export {router};
