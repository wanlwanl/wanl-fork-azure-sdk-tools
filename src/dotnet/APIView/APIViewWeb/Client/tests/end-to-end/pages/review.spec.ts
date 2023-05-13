import { test, expect } from "@playwright/test";
import  { FormData } from "formdata-node";
import { Readable } from "stream"
import fetch from "node-fetch";
import File from "fetch-blob";

import * as path from "path";
import * as fs from "fs";

import * as rvM from "../../../src/pages/review.module";

const fixturesDir = process.env.FIXTURE_DIR as string;
const baseURL = process.env.BASE_URL as string;
const apiKey = process.env.APIVIEW_API_KEY as string;

test.describe('CodeLine Section State Management', () => {
    test.beforeAll(async () => {
        // Create an automatic Swagger Review using existing token file
        const fileName : string = "webpubsub-data-plane-WebPubSub.Baseline.json";
        const swaggerTokenContent = fs.readFileSync(path.resolve(path.join(fixturesDir, fileName)), "utf8");
        const label = "Swaggwer TestFile Baseline"
        const url = `${baseURL}/AutoReview/UploadAutoReview?label=${label}`;

        const formData = new FormData();
        const file = new File([swaggerTokenContent], { type: "application/octet-stream" });
        console.log(file.size);
        console.log(file.type);
        formData.set("file", file);

        console.log(formData.get("file"));
        
        const requestOptions = {
            method: "POST",
            headers: {
                "ApiKey": apiKey,
            },
            body: formData
        }

        await fetch(url, requestOptions)
            .then(response => response.json())
            .then(result => console.log(result))
            .catch(error => console.log("error uploading auto review", error));    
    });

    test('getSectionHeadingRow should retrieve section heading row', async ({ page }) => {
        //await page.goto(baseURL);
    });
});