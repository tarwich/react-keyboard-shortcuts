type ShortcutDefinition = { [chord: string]: () => void };

export type Shortcut = {
  chord: string;
  action: Function;
};

const MODIFIERS = {
  altKey: '!',
  metaKey: '#',
  ctrlKey: '^',
  shiftKey: '+',
};

function normalizeKey(key: string) {
  return [...key.toLowerCase()].sort().join('');
}

export class ShortcutManager {
  // #region Fields
  history: string[] = [];
  layers: Shortcut[][] = [];
  shortcuts: Shortcut[];
  // #endregion

  constructor() {
    document.body.addEventListener('keydown', this.handleKeyDown);
  }

  // #region Methods
  addLayer(shortcuts: ShortcutDefinition) {
    const layer = this.convertDefinitionToLayer(shortcuts);
    this.layers.push(layer);
    this.updateAllShortcuts();
    return layer;
  }

  handleKeyDown = (event: KeyboardEvent) => {
    // Ignore modifier keys
    if (event.location !== 0) return;
    // Normalize the key
    const key = normalizeKey(
      Object.entries(MODIFIERS)
        .map(
          ([modifier, symbol]: [keyof typeof MODIFIERS, string]) =>
            event[modifier] ? symbol : ''
        )
        .join('') + event.key.toLowerCase()
    );
    // Rotate this key into the history
    this.history = this.history.slice(-9).concat(key);
    const textHistory = this.history.slice().join(' ');
    // Check the shortcuts
    const match = this.shortcuts
      .slice()
      .reverse()
      .find(
        shortcut =>
          shortcut.action &&
          shortcut.chord === textHistory.slice(-shortcut.chord.length)
      );
    if (match) match.action();
  };

  private convertDefinitionToLayer(shortcuts: ShortcutDefinition): Shortcut[] {
    return Object.entries(shortcuts).map(([chord, action]) => {
      return {
        // Sort the chords to normalize the modifiers
        chord: chord
          .split(' ')
          .map(normalizeKey)
          .join(' '),
        action,
      };
    });
  }

  removeLayer(layerToRemove: Shortcut[]) {
    this.layers = this.layers.filter(layer => layer === layerToRemove);
    this.updateAllShortcuts();
  }

  updateAllShortcuts() {
    this.shortcuts = this.layers.flatMap(layer => layer);
  }

  updateLayer(layerToReplace: Shortcut[], shortcuts: ShortcutDefinition) {
    this.layers = this.layers.map(layer => {
      if (layer === layerToReplace)
        return this.convertDefinitionToLayer(shortcuts);
      else return layer;
    });
  }
  // #endregion
}
