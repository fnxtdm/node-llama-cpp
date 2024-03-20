import {GgufFileInfo} from "../../../src/gguf/ggufParser/types/GgufFileInfoTypes.js";

export function simplifyGgufInfoForTestSnapshot(ggufFileInfo: GgufFileInfo) {
    const ggufFileInfoCopy = structuredClone(ggufFileInfo);

    // these keys are ignored in tests because they contain very long values, so we don't want to include them in full,
    // to make sure we won't make the test snapshots huge, keeping them readable and maintainable
    shortenArray(ggufFileInfoCopy.metadata.tokenizer.ggml.tokens, 10);
    shortenArray(ggufFileInfoCopy.metadata.tokenizer.ggml.scores, 10);
    shortenArray(ggufFileInfoCopy.metadata.tokenizer.ggml.token_type, 10);
    shortenArray(ggufFileInfoCopy.metadata.tokenizer.ggml.merges, 10);

    shortenArray(ggufFileInfoCopy.tensorInfo, 4);

    return ggufFileInfoCopy;
}

function shortenArray(array?: any[], maxSize: number = 10) {
    if (array == null)
        return;

    array.splice(maxSize);
}
