import { add } from "../../js/shared/comments-modules.js";

QUnit.module("add");

QUnit.test("two numbers", assert => {
    assert.equal(add(0, 1),1);
});