import { subtract } from "../../js/pages/index-modules.js";

QUnit.module("subtract");

QUnit.test("two numbers", assert => {
    assert.equal(subtract(2, 1),1);
});