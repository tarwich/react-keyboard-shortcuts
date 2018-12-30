import { observable, configure, computed } from 'mobx';
import { KeyHistory } from './key-history';
import { ShortcutLayer } from './shortcut-layer';
import { Shortcut } from './shortcut';

configure({
  isolateGlobalState: true,
  enforceActions: 'observed',
});

class Store {
  @observable debugHistory: string[] = [];
  @observable history: KeyHistory[] = [];
  @observable layers: ShortcutLayer[] = [];
  @observable match: Shortcut | null = null;
  @computed
  get shortcuts() {
    return this.layers
      .slice()
      .reverse()
      .flatMap(layer => layer.shortcuts);
  }
  @observable
  modifiers = {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
  };
}

export const HotkeyStore = new Store();
