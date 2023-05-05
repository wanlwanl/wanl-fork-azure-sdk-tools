import { times } from "../../js/pages/review-modules.js";

QUnit.module("times");

QUnit.test("two numbers", assert => {
    assert.equal(times(0, 1),0);
});