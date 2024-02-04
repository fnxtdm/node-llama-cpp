import {describe, expect, test} from "vitest";
import {getLlama, LlamaEmbeddingContext, LlamaModel} from "../../../src/index.js";
import {getModelFile} from "../../utils/modelFiles.js";

describe("functionary", () => {
    describe("embedding", () => {
        test("deterministic", async () => {
            const modelPath = await getModelFile("functionary-small-v2.2.q4_0.gguf");
            const llama = await getLlama();

            const model = new LlamaModel({
                llama,
                modelPath
            });
            const embeddingContext = new LlamaEmbeddingContext({
                model,
                contextSize: 4096
            });

            const helloWorldEmbedding = await embeddingContext.getEmbeddingFor("Hello world");

            const helloThereEmbedding = await embeddingContext.getEmbeddingFor("Hello there");

            expect(helloWorldEmbedding.vector).to.not.eql(helloThereEmbedding.vector);

            const helloWorld2Embedding = await embeddingContext.getEmbeddingFor("Hello world");

            expect(helloWorld2Embedding.vector).to.eql(helloWorldEmbedding.vector);
            expect(helloWorld2Embedding.vector).to.not.eql(helloThereEmbedding.vector);
        }, {
            timeout: 1000 * 60 * 60 * 2
        });

        test("deterministic between runs", async () => {
            const modelPath = await getModelFile("functionary-small-v2.2.q4_0.gguf");
            const llama = await getLlama();

            const model = new LlamaModel({
                llama,
                modelPath
            });
            const embeddingContext = new LlamaEmbeddingContext({
                model,
                contextSize: 4096
            });

            const helloWorldEmbedding = await embeddingContext.getEmbeddingFor("Hello world");
            const helloThereEmbedding = await embeddingContext.getEmbeddingFor("Hello there");

            expect(helloWorldEmbedding.vector).to.not.eql(helloThereEmbedding.vector);

            embeddingContext.dispose();

            const embeddingContext2 = new LlamaEmbeddingContext({
                model,
                contextSize: 4096
            });

            const helloWorldEmbedding2 = await embeddingContext2.getEmbeddingFor("Hello world");
            const helloThereEmbedding2 = await embeddingContext2.getEmbeddingFor("Hello there");

            expect(helloWorldEmbedding2.vector).to.eql(helloWorldEmbedding.vector);
            expect(helloThereEmbedding2.vector).to.eql(helloThereEmbedding.vector);
        }, {
            timeout: 1000 * 60 * 60 * 2
        });
    });
});
