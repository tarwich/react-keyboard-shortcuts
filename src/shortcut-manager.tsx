/** @jsx createElement */
import { observable } from 'mobx';
import { createElement, Component, Fragment } from 'react';
import { observer } from 'mobx-react';
import { render } from 'react-dom';
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

type ShortcutManagerStore = {
  debugHistory: string[];
  history: KeyHistory[];
  layers: Shortcut[][];
  match: Shortcut | null;
  shortcuts: Shortcut[];
  modifiers: {
    altKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
  };
  visible: boolean;
};

export class ShortcutManager {
  // #region Fields
  @observable
  store: ShortcutManagerStore = {
    debugHistory: [],
    history: [],
    layers: [],
    match: null,
    shortcuts: [],
    modifiers: {
      altKey: false,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
    },
    visible: false,
  };
  /** The container in which the debug UI will be rendered */
  private container: Element;
  /** Timers to clear the history */
  timers: number[] = [];
  reactComponent: void | Element | Component<any, any, any>;
  get debug() {
    return this.store.visible;
  }
  set debug(value: boolean) {
    this.store.visible = value;
  }
  // #endregion

  constructor(options: { debug?: boolean } = {}) {
    document.body.addEventListener('keydown', this.handleKeyDown);
    document.body.addEventListener('keyup', this.handleKeyUp);
    this.debug = options.debug || false;
    this.installDebugUi();
  }

  // #region Methods
  addLayer(shortcuts: ShortcutDefinition | Shortcut[]) {
    const layer = Array.isArray(shortcuts)
      ? shortcuts
      : this.convertDefinitionToLayer(shortcuts);
    this.store.layers.push(layer);
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
    Object.keys(this.store.modifiers).forEach(
      (modifier: keyof ShortcutManagerStore['modifiers']) => {
        this.store.modifiers[modifier] = event[modifier];
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
    this.store.history = this.store.history
      .slice(-10)
      .concat(new KeyHistory({ key, time: Date.now() }));
    // Check the shortcuts
    const match = this.store.shortcuts.slice().find(shortcut => {
      if (!shortcut.action) return false;
      return (
        shortcut.chord ===
        this.store.history.slice(-shortcut.chord.split(' ').length).join(' ')
      );
    });

    if (match) {
      this.store.match = match;
      match.action();
      this.store.history.push(new KeyHistory({ key: '', time: Date.now() }));
    } else {
      this.store.match = null;
    }
  };

  handleKeyUp = () => {
    Object.keys(this.store.modifiers).forEach(
      (modifier: keyof ShortcutManagerStore['modifiers']) => {
        this.store.modifiers[modifier] = false;
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
    render(<ShortcutManagerUi store={this.store} />, this.container);
  }

  removeLayer(layerToRemove: Shortcut[]) {
    this.store.layers = this.store.layers.filter(
      layer => layer === layerToRemove
    );
    this.updateAllShortcuts();
  }

  updateAllShortcuts() {
    this.store.shortcuts = this.store.layers.flatMap(layer => layer).reverse();
  }

  updateLayer(
    layerToReplace: Shortcut[],
    shortcuts: ShortcutDefinition | Shortcut[]
  ) {
    const newLayer = Array.isArray(shortcuts)
      ? shortcuts
      : this.convertDefinitionToLayer(shortcuts);
    this.store.layers = this.store.layers.map(
      layer => (layer === layerToReplace ? newLayer : layer)
    );
    return newLayer;
  }
  // #endregion
}

interface IProps {
  store: ShortcutManagerStore;
}

@observer
class ShortcutManagerUi extends Component<IProps> {
  @observable store: ShortcutManagerStore;
  constructor(props: IProps) {
    super(props);
    this.store = props.store;
  }

  render() {
    if (!this.store.visible) return null;

    return (
      <span className="ShortcutManager ShortcutManager--debug">
        <div className="ShortcutManager__Header">
          Keyboard Shortcuts
          <div className="ShortcutManager__Modifiers">
            {Object.entries(this.store.modifiers).map(
              ([modifier, pressed]: [
                keyof ShortcutManagerStore['modifiers'],
                boolean
              ]) => (
                <span
                  className={`ShortcutManager__Modifier ${
                    pressed ? 'ShortcutManager__Modifier--pressed' : ''
                  }`}
                  key={modifier}
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
              {this.store.history.map(key => (
                <code key={key.time}>{key.key}</code>
              ))}
            </div>
          </div>
          {this.store.layers
            .slice()
            .reverse()
            .map((layer, i) => (
              <dl className="ShortcutManager__Layer" key={i}>
                <header>
                  {`Layer ${String(this.store.layers.length - i).padStart(
                    2,
                    '0'
                  )}`}
                </header>
                {(layer || []).map(shortcut => this.renderShortcut(shortcut))}
              </dl>
            ))}
        </div>
      </span>
    );
  }

  renderChord(chord: string) {
    const { history } = this.store;

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
      shortcut === this.store.match ? 'Shortcut--triggered' : '';
    const overriddenClass =
      this.store.shortcuts.find(other => other.chord === shortcut.chord) !==
      shortcut
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
