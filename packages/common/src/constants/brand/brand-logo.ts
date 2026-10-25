import brandAssets from "./brand-assets.json";

/**
 * The brand mark next to the wordmark in every app header. The JSON is the single source: the
 * website's favicon and OG-image scripts read it too, so the generated assets show the same mark.
 */
export const BrandLogo = brandAssets.logo;
