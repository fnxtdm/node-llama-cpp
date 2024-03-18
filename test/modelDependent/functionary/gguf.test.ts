import {describe, expect, it, test} from "vitest";
import {GgufFsFileReader} from "../../../src/gguf/ggufParser/fileReaders/GgufFsFileReader.js";
import {GgufParser} from "../../../src/gguf/ggufParser/GgufParser.js";
import {getModelFile} from "../../utils/modelFiles.js";
import {GgufInsights} from "../../../src/gguf/GgufInsights.js";
import {getTestLlama} from "../../utils/getTestLlama.js";
import {parseGgufMetadata} from "../../../src/gguf/parseGgufMetadata.js";

describe("GGUF Parser", async () => {
    const modelPath = await getModelFile("functionary-small-v2.2.q4_0.gguf");

    test("Magic should be GGUF local model", async () => {
        const fileReader = new GgufFsFileReader({filePath: modelPath});
        const magic = await fileReader.readByteRange(0, 4);
        const magicText = String.fromCharCode(...magic);

        expect(magicText).toBe("GGUF");
    });

    it("should parse local gguf model", async () => {
        const fileReader = new GgufFsFileReader({filePath: modelPath});
        const ggufParser = new GgufParser({fileReader: fileReader});

        const metadata = await ggufParser.parseMetadata();

        expect(metadata).toMatchSnapshot();
    });

    it("should calculate GGUF VRAM Usage", async () => {
        const fileReader = new GgufFsFileReader({filePath: modelPath});
        const ggufParser = new GgufParser({fileReader: fileReader});

        const metadata = await ggufParser.parseMetadata();

        const ggufInsights = new GgufInsights(metadata);

        const llama = await getTestLlama();
        const model = await llama.loadModel({
            modelPath: modelPath
        });

        const usedRam = llama.getVramState().used;

        expect(ggufInsights.VRAMUsage).toMatchInlineSnapshot("4474643028.666667");
        expect(usedRam).to.be.gte(3.5 * Math.pow(1024, 3));
        expect(usedRam).to.be.lte(4.5 * Math.pow(1024, 3));
        await model.dispose();
    });

    it("should fetch GGUF metadata", async () => {
        const ggufMetadataParseResult = await parseGgufMetadata(modelPath);

        expect(ggufMetadataParseResult).toMatchSnapshot();

        const insights = new GgufInsights(ggufMetadataParseResult);
        expect(insights.VRAMUsage).toMatchInlineSnapshot("4474643028.666667");
    });
});
