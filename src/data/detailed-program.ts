export const DETAILED_PROGRAM_PUBLISHED = false;

export type DetailedProgramAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

// The file name and extension must remain unset until the delivered asset's
// signature, MIME type, and intrinsic dimensions have been verified.
export const DETAILED_PROGRAM_ASSET: DetailedProgramAsset | null = null;

export function isValidDetailedProgramAsset(
  asset: DetailedProgramAsset | null
): asset is DetailedProgramAsset {
  if (!asset) return false;

  return (
    asset.src.startsWith("/images/") &&
    asset.src.trim().length > "/images/".length &&
    asset.alt.trim().length > 0 &&
    Number.isInteger(asset.width) &&
    asset.width > 0 &&
    Number.isInteger(asset.height) &&
    asset.height > 0
  );
}

export function getPublishedDetailedProgramAsset(
  published: boolean,
  asset: DetailedProgramAsset | null
): DetailedProgramAsset | null {
  return published && isValidDetailedProgramAsset(asset) ? asset : null;
}
