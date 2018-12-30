import { observable } from 'mobx';
import { ShortcutDefinition } from './shortcut-definition';
import { Shortcut } from './shortcut';
import { normalizeKey } from './normalizeKey';

let nextId = 0;
const generateId = () => ++nextId;

export class ShortcutLayer {
  id = generateId();
  @observable shortcuts: Shortcut[] = [];

  constructor(shortcuts: Shortcut[] | ShortcutDefinition) {
    if (Array.isArray(shortcuts)) this.shortcuts = shortcuts;
    else {
      this.shortcuts = Object.entries(shortcuts).map(([chord, action]) => {
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
    this.shortcuts.forEach(shortcut => {
      shortcut.chord = shortcut.chord
        .split(' ')
        .map(normalizeKey)
        .join(' ');
      if (!shortcut.id) shortcut.id = generateId();
    });
  }
}
