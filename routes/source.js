import {Router} from "express";

const router = Router();

/**
 * Return the source view to the client.
 * The view loads the user JS script.
 *
 * @since 1.0.0
 * @version 1.0.0
 * @author Axel DAVID
 * @see chartor.views.source.njk
 */
const sourceRoute = function(_ignoredReq, res, _ignoredNext) {
    res.render(
        "source.njk",
        {
            title: "Chartor - Source",
        },
    );
};

router.get("/", sourceRoute);

export {router};
