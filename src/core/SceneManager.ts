import { Application, Container } from 'pixi.js';

export interface Scene {
  readonly name: string;
  init(app: Application): Promise<void>;
  update(delta: number): void;
  destroy(): void;
}

export class SceneManager {
  private scenes = new Map<string, Scene>();
  private current: Scene | null = null;
  readonly stage = new Container();

  constructor(private app: Application) {
    app.stage.addChild(this.stage);
  }

  register(scene: Scene): void {
    this.scenes.set(scene.name, scene);
  }

  async switchTo(name: string): Promise<void> {
    if (this.current) {
      this.current.destroy();
      this.stage.removeChildren();
    }

    const next = this.scenes.get(name);
    if (!next) {
      throw new Error(`Scene "${name}" not registered`);
    }

    this.current = next;
    await next.init(this.app);
  }

  update(delta: number): void {
    this.current?.update(delta);
  }

  get activeScene(): Scene | null {
    return this.current;
  }
}
