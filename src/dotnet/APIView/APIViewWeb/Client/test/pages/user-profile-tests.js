import { square } from "../../js/pages/user-profile-modules.js";

QUnit.module("square");

QUnit.test("square", assert => {
    assert.equal(square(2),4);
});