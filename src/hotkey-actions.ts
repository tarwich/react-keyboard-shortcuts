import { ShortcutDefinition } from './shortcut-definition';
import { Shortcut } from './shortcut';
import { ShortcutLayer } from './shortcut-layer';
import { HotkeyStore } from './hotkey-store';
import { KeyHistory } from './key-history';
import { normalizeKey, MODIFIERS } from './normalize-key';

let listenersInstalled = false;

export class HotkeyActions {
  static addLayer(shortcuts: ShortcutDefinition | Shortcut[]): ShortcutLayer {
    const layer = new ShortcutLayer(shortcuts);
    HotkeyStore.layers.push(layer);
    return layer;
  }

  static handleKeyDown = (event: KeyboardEvent) => {
    // Ignore when in a textfield
    if (event.target && 'value' in event.target) return;

    // Store modifier keys
    Object.keys(HotkeyStore.modifiers).forEach(
      (modifier: keyof typeof HotkeyStore['modifiers']) => {
        HotkeyStore.modifiers[modifier] = event[modifier];
      }
    );
    // Ignore modifier keys
    if (event.location !== 0) return;
    // Normalize the key
    const key = normalizeKey(
      Object.entries(MODIFIERS)
        .map(
          ([modifier, symbol]: [keyof typeof MODIFIERS, string]) =>
            event[modifier] ? symbol : ''
        )
        .join('') + event.key
    );
    // Rotate this key into the history
    HotkeyStore.history = HotkeyStore.history
      .slice(-10)
      .concat(new KeyHistory({ key }));
    // Check the shortcuts
    const match = HotkeyStore.shortcuts.slice().find(shortcut => {
      if (!shortcut.action) return false;
      return (
        shortcut.chord ===
        HotkeyStore.history.slice(-shortcut.chord.split(' ').length).join(' ')
      );
    });

    if (match) {
      HotkeyStore.match = match;
      match.action();
      HotkeyStore.history.push(new KeyHistory({ key: '' }));
    } else {
      HotkeyStore.match = null;
    }
  };

  static handleKeyUp = () => {
    Object.keys(HotkeyStore.modifiers).forEach(
      (modifier: keyof typeof HotkeyStore['modifiers']) => {
        HotkeyStore.modifiers[modifier] = false;
      }
    );
  };

  static installEventListeners() {
    if (!listenersInstalled) {
      listenersInstalled = true;
      document.body.addEventListener('keydown', this.handleKeyDown);
      document.body.addEventListener('keyup', this.handleKeyUp);
    }
  }

  static removeLayer(layerToRemove: ShortcutLayer) {
    HotkeyStore.layers = HotkeyStore.layers.filter(
      layer => layer.id === layerToRemove.id
    );
  }

  static updateLayer(
    layerToReplace: ShortcutLayer,
    shortcuts: ShortcutDefinition | Shortcut[]
  ) {
    const newLayer = new ShortcutLayer(shortcuts);
    HotkeyStore.layers = HotkeyStore.layers.map(
      layer => (layer.id === layerToReplace.id ? newLayer : layer)
    );
    return newLayer;
  }
}
