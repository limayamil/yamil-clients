export type FeatureFlag = 'prototype' | 'tasklist' | 'milestone';

const defaults: Record<FeatureFlag, boolean> = {
  prototype: true,
  tasklist: true,
  milestone: true
};

export function isFeatureEnabled(flag: FeatureFlag, overrides?: Partial<Record<FeatureFlag, boolean>>) {
  return overrides?.[flag] ?? defaults[flag];
}
