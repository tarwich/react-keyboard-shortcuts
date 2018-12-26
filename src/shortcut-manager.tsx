/** @jsx createElement */
import { observable } from 'mobx';
import { createElement, Component, Fragment } from 'react';
import { observer } from 'mobx-react';
import { render, unmountComponentAtNode } from 'react-dom';
import './keyboard-shortcuts.scss';

type ShortcutDefinition = { [chord: string]: () => void };

export type Shortcut = {
  chord: string;
  action: Function;
  caption?: string;
};

const MODIFIERS = {
  altKey: '!',
  metaKey: '#',
  ctrlKey: '^',
  shiftKey: '+',
};

class KeyHistory {
  key: string;
  time: number;

  constructor(options: Pick<KeyHistory, 'key' | 'time'>) {
    Object.assign(this, options);
  }

  toString() {
    return this.key;
  }
}

function normalizeKey(key: string) {
  return [...key.toLowerCase()].sort().join('');
}

const ShortcutManagerStore = observable({
  debugHistory: [] as string[],
  history: [] as KeyHistory[],
  layers: [] as Shortcut[][],
  match: null as Shortcut | null,
  shortcuts: [] as Shortcut[],
  modifiers: {
    altKey: false,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
  },
});

export class ShortcutManager {
  // #region Fields
  private _debug = false;
  /** The container in which the debug UI will be rendered */
  private container: Element;
  /** Timers to clear the history */
  timers: number[] = [];
  get debug() {
    return this._debug;
  }
  set debug(value: boolean) {
    this._debug = value;

    if (value) this.installDebugUi();
    else this.removeDebugUi();
  }
  // #endregion

  constructor(options: { debug?: boolean } = {}) {
    document.body.addEventListener('keydown', this.handleKeyDown);
    document.body.addEventListener('keyup', this.handleKeyUp);
    this.debug = options.debug || false;
    this.debug = true;
  }

  // #region Methods
  addLayer(shortcuts: ShortcutDefinition | Shortcut[]) {
    const layer = Array.isArray(shortcuts)
      ? shortcuts
      : this.convertDefinitionToLayer(shortcuts);
    ShortcutManagerStore.layers.push(layer);
    this.updateAllShortcuts();
    return layer;
  }

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

  handleKeyDown = (event: KeyboardEvent) => {
    // Store modifier keys
    Object.keys(ShortcutManagerStore.modifiers).forEach(
      (modifier: keyof typeof ShortcutManagerStore.modifiers) => {
        ShortcutManagerStore.modifiers[modifier] = event[modifier];
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
        .join('') + event.key.toLowerCase()
    );
    // Rotate this key into the history
    ShortcutManagerStore.history = ShortcutManagerStore.history
      .slice(-10)
      .concat(new KeyHistory({ key, time: Date.now() }));
    // Check the shortcuts
    const match = ShortcutManagerStore.shortcuts.slice().find(shortcut => {
      if (!shortcut.action) return false;
      return (
        shortcut.chord ===
        ShortcutManagerStore.history
          .slice(-shortcut.chord.split(' ').length)
          .join(' ')
      );
    });

    if (match) {
      ShortcutManagerStore.match = match;
      match.action();
      ShortcutManagerStore.history.push(
        new KeyHistory({ key: '', time: Date.now() })
      );
    } else {
      ShortcutManagerStore.match = null;
    }
  };

  handleKeyUp = () => {
    Object.keys(ShortcutManagerStore.modifiers).forEach(
      (modifier: keyof typeof ShortcutManagerStore.modifiers) => {
        ShortcutManagerStore.modifiers[modifier] = false;
      }
    );
  };

  private installDebugUi() {
    // Create the container if it doesn't exist
    this.container =
      document.querySelector('.ShortcutManagerContainer') ||
      document.body.appendChild(document.createElement('div'));
    this.container.classList.add('ShortcutManagerContainer');
    // Render the shortcut manager in the container
    render(<ShortcutManagerUi />, this.container);
  }

  private removeDebugUi() {
    if (this.container) unmountComponentAtNode(this.container);
  }

  removeLayer(layerToRemove: Shortcut[]) {
    ShortcutManagerStore.layers = ShortcutManagerStore.layers.filter(
      layer => layer === layerToRemove
    );
    this.updateAllShortcuts();
  }

  updateAllShortcuts() {
    ShortcutManagerStore.shortcuts = ShortcutManagerStore.layers
      .flatMap(layer => layer)
      .reverse();
  }

  updateLayer(
    layerToReplace: Shortcut[],
    shortcuts: ShortcutDefinition | Shortcut[]
  ) {
    const newLayer = Array.isArray(shortcuts)
      ? shortcuts
      : this.convertDefinitionToLayer(shortcuts);
    ShortcutManagerStore.layers = ShortcutManagerStore.layers.map(
      layer => (layer === layerToReplace ? newLayer : layer)
    );
    return newLayer;
  }
  // #endregion
}

@observer
class ShortcutManagerUi extends Component {
  render() {
    return (
      <span className="ShortcutManager ShortcutManager--debug">
        <div className="ShortcutManager__Header">
          Keyboard Shortcuts
          <div className="ShortcutManager__Modifiers">
            {Object.entries(ShortcutManagerStore.modifiers).map(
              ([modifier, pressed]: [
                keyof typeof ShortcutManagerStore.modifiers,
                boolean
              ]) => (
                <span
                  className={`ShortcutManager__Modifier ${
                    pressed ? 'ShortcutManager__Modifier--pressed' : ''
                  }`}
                >
                  {MODIFIERS[modifier]}
                </span>
              )
            )}
          </div>
        </div>
        <div className="ShortcutManager__Panel">
          <div className="ShortcutManager__History">
            History:
            <div className="ShortcutManager__HistoryKeys">
              {ShortcutManagerStore.history.map(key => (
                <code key={key.time}>{key.key}</code>
              ))}
            </div>
          </div>
          {ShortcutManagerStore.layers
            .slice()
            .reverse()
            .map((layer, i) => (
              <dl className="ShortcutManager__Layer" key={i}>
                <header>
                  {`Layer ${String(
                    ShortcutManagerStore.layers.length - i
                  ).padStart(2, '0')}`}
                </header>
                {(layer || []).map(shortcut => this.renderShortcut(shortcut))}
              </dl>
            ))}
        </div>
      </span>
    );
  }

  renderChord(chord: string) {
    const { history } = ShortcutManagerStore;

    for (let i = history.length; i >= 0; --i) {
      const historySlice = history.slice(-i).join(' ');
      const historySliceLength = historySlice.length;

      if (chord.startsWith(historySlice)) {
        return (
          <Fragment>
            <span className="match">{chord.substr(0, historySliceLength)}</span>
            {chord.substr(historySliceLength)}
          </Fragment>
        );
      }
    }

    return chord;
  }

  renderShortcut(shortcut: Shortcut) {
    const triggeredClass =
      shortcut === ShortcutManagerStore.match ? 'Shortcut--triggered' : '';
    const overriddenClass =
      ShortcutManagerStore.shortcuts.find(
        other => other.chord === shortcut.chord
      ) !== shortcut
        ? 'Shortcut--overridden'
        : '';

    return (
      <span
        className={`Shortcut ${triggeredClass} ${overriddenClass}`}
        key={shortcut.chord}
      >
        <dt className="Shortcut__Chord">
          {this.renderChord(shortcut.chord.replace(' ', ''))}
        </dt>
        <dd className="Shortcut__Definition">{shortcut.caption}</dd>
      </span>
    );
  }
}
