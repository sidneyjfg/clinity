type BuildInfo = {
  commitSha: string | null;
  label: string;
  layer: string;
};

const fallbackLayer = process.env.NEXT_PUBLIC_APP_LAYER_LABEL ?? "layer-dev";
const buildLayer = fallbackLayer.trim().length > 0 ? fallbackLayer : "layer-dev";
const buildCommitSha = process.env.NEXT_PUBLIC_APP_COMMIT_SHA?.trim() || null;

export function getBuildInfo(): BuildInfo {
  const shortSha = buildCommitSha ? buildCommitSha.slice(0, 7) : null;

  return {
    layer: buildLayer,
    commitSha: buildCommitSha,
    label: shortSha ? `${buildLayer} (${shortSha})` : buildLayer,
  };
}
