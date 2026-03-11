import { Assets, type UnresolvedAsset } from 'pixi.js';

/**
 * Thin wrapper around PixiJS v8 Assets API.
 * Provides bundle management and progress tracking for scene-based loading.
 */

export interface AssetBundle {
  name: string;
  assets: UnresolvedAsset[];
}

export class AssetLoader {
  private loadedBundles = new Set<string>();

  /** Register an asset bundle for deferred loading */
  addBundle(bundle: AssetBundle): void {
    Assets.addBundle(bundle.name, bundle.assets);
  }

  /** Load a bundle with optional progress callback. Returns all loaded assets. */
  async loadBundle(
    bundleName: string,
    onProgress?: (progress: number) => void,
  ): Promise<Record<string, unknown>> {
    if (this.loadedBundles.has(bundleName)) {
      return {};
    }

    const assets = await Assets.loadBundle(bundleName, onProgress);
    this.loadedBundles.add(bundleName);
    return assets as Record<string, unknown>;
  }

  /** Load a single asset by alias */
  async load<T = unknown>(alias: string): Promise<T> {
    return Assets.load<T>(alias);
  }

  /** Check if a bundle has been loaded */
  isBundleLoaded(bundleName: string): boolean {
    return this.loadedBundles.has(bundleName);
  }

  /** Unload a bundle and free GPU memory */
  async unloadBundle(bundleName: string): Promise<void> {
    await Assets.unloadBundle(bundleName);
    this.loadedBundles.delete(bundleName);
  }

  /** Reset all state */
  reset(): void {
    this.loadedBundles.clear();
    Assets.reset();
  }
}
