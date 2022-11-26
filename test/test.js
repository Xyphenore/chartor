import * as request from "supertest";
import {app} from "../app";

describe("App", () => {
    it("has the default page", (done) => {
        request(app)
            .get("/")
            .expect(/Welcome to Express/u, done);
    });
});
