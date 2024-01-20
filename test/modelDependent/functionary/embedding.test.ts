import {describe, expect, test} from "vitest";
import {LlamaEmbeddingContext, LlamaModel} from "../../../src/index.js";
import {getModelFile} from "../../utils/modelFiles.js";

describe("functionary", () => {
    describe("embedding", () => {
        test("deterministic", async () => {
            const modelPath = await getModelFile("functionary-small-v2.2.q4_0.gguf");

            const model = new LlamaModel({
                modelPath
            });
            const context = new LlamaEmbeddingContext({
                model,
                contextSize: 4096
            });

            const helloWorldEmbedding = await context.getEmbeddingFor("Hello world");

            const helloThereEmbedding = await context.getEmbeddingFor("Hello there");

            expect(helloWorldEmbedding.vector).to.not.eql(helloThereEmbedding.vector);

            const helloWorld2Embedding = await context.getEmbeddingFor("Hello world");

            expect(helloWorld2Embedding.vector).to.eql(helloWorldEmbedding.vector);
            expect(helloWorld2Embedding.vector).to.not.eql(helloThereEmbedding.vector);

            console.log(helloWorld2Embedding.vector);
        }, {
            timeout: 1000 * 60 * 60
        });

        test("deterministic between runs", async () => {
            const modelPath = await getModelFile("functionary-small-v2.2.q4_0.gguf");

            const model = new LlamaModel({
                modelPath
            });
            const context = new LlamaEmbeddingContext({
                model,
                contextSize: 4096
            });

            const helloWorldEmbedding = await context.getEmbeddingFor("Hello world");
            const helloThereEmbedding = await context.getEmbeddingFor("Hello there");

            expect(helloWorldEmbedding.vector).to.not.eql(helloThereEmbedding.vector);

            context.dispose();

            const context2 = new LlamaEmbeddingContext({
                model,
                contextSize: 4096
            });

            const helloWorldEmbedding2 = await context2.getEmbeddingFor("Hello world");
            const helloThereEmbedding2 = await context2.getEmbeddingFor("Hello there");

            expect(helloWorldEmbedding2.vector).to.eql(helloWorldEmbedding.vector);
            expect(helloThereEmbedding2.vector).to.eql(helloThereEmbedding.vector);
        }, {
            timeout: 1000 * 60 * 60
        });
    });
});
