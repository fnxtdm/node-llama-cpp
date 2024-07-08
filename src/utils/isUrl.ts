export function isUrl(text: string, throwOnInvalidUrl: boolean = true) {
    if (text.startsWith("http://") || text.startsWith("https://")) {
        try {
            new URL(text);
            return true;
        } catch {
            if (throwOnInvalidUrl)
                throw new Error(`Invalid URL: ${text}`);

            return false;
        }
    }

    return false;
}
