import * as React from 'react';
import { Component, Fragment } from 'react';
import './keyboard-shortcuts.scss';

type ShortcutDefinition = { [chord: string]: () => void };

let __id = 0;
const generateId = () => ++__id;

export type Shortcut = {
  chord: string;
  action: Function;
  caption?: string;
  id?: number;
  textFieldEnabled?: boolean;
  preventDefault?: boolean;
};

const MODIFIERS = {
  ctrlKey: '^',
  altKey: '!',
  shiftKey: '+',
  metaKey: '#',
};

class KeyHistory {
  key: string;
  time: number;

  constructor(options: Pick<KeyHistory, 'key'>) {
    this.key = options.key;
    this.time = Date.now();
  }

  toString() {
    return this.key;
  }
}

const RE_REMOVE_MODIFIERS = /[!#^+]+/g;

function normalizeKey(key: string) {
  const modifiers = Object.values(MODIFIERS)
    .filter(modifier => key.indexOf(modifier) !== -1)
    .join('');
  const characters = key.replace(RE_REMOVE_MODIFIERS, '').toUpperCase();
  return modifiers + characters;
}

export class ShortcutLayer {
  id = generateId();
  shortcuts: Shortcut[] = [];

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

type ShortcutManagerStore = {
  debugHistory: string[];
  history: KeyHistory[];
  layers: ShortcutLayer[];
  match: Shortcut | null;
  readonly shortcuts: Shortcut[];
  modifiers: {
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  };
};

export class ShortcutManager {
  // #region Fields
  static store: ShortcutManagerStore = {
    debugHistory: [],
    history: [],
    layers: [],
    match: null,
    get shortcuts() {
      return this.layers
        .slice()
        .reverse()
        .flatMap((layer: ShortcutLayer) => layer.shortcuts);
    },
    modifiers: {
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    },
  };
  get store() {
    return ShortcutManager.store;
  }
  /** Timers to clear the history */
  timers: number[] = [];
  reactComponent: void | Element | Component<any, any, any>;
  // #endregion

  constructor() {
    document.body.addEventListener('keydown', this.handleKeyDown);
    document.body.addEventListener('keyup', this.handleKeyUp);
  }

  // #region Methods
  addLayer(shortcuts: ShortcutDefinition | Shortcut[]) {
    const layer = new ShortcutLayer(shortcuts);
    this.store.layers.push(layer);

    ShortcutManagerUi.instances.forEach(manager => manager.forceUpdate());

    return layer;
  }

  handleKeyDown = (event: KeyboardEvent) => {
    const isTextField = event.target && 'value' in event.target;

    // Store modifier keys
    Object.keys(this.store.modifiers).forEach(
      (modifier: keyof ShortcutManagerStore['modifiers']) => {
        this.store.modifiers[modifier] = event[modifier];
      }
    );
    // Ignore modifier keys
    if (event.location !== 0) {
      ShortcutManagerUi.instances.forEach(manager => manager.forceUpdate());

      return;
    }

    // Normalize the key
    const key = normalizeKey(
      Object.entries(MODIFIERS)
        .map(([modifier, symbol]: [keyof typeof MODIFIERS, string]) =>
          event[modifier] ? symbol : ''
        )
        .join('') + event.key
    );
    // Rotate this key into the history
    this.store.history = this.store.history
      .slice(-10)
      .concat(new KeyHistory({ key }));
    // Check the shortcuts
    const match = this.store.shortcuts.slice().find(shortcut => {
      if (!shortcut.action) return false;
      return (
        shortcut.chord ===
        this.store.history.slice(-shortcut.chord.split(' ').length).join(' ')
      );
    });

    if (match) {
      // Only do the action if one of the following is true
      // 1. We are not in a text field
      // 2. textFieldEnabled is enabled for this shortcut
      // 3. textFieldEnabled is not false and the action is being
      //    triggered by the escape key or a modified key combo
      const shouldAction =
        !isTextField ||
        match.textFieldEnabled ||
        (match.textFieldEnabled !== false &&
          (match.chord === 'ESCAPE' || match.chord.match(RE_REMOVE_MODIFIERS)));

      this.store.match = match;
      if (shouldAction) {
        if (match.preventDefault !== false) {
          event.preventDefault();
        }
        match.action();
      }
      this.store.history.push(new KeyHistory({ key: '' }));
    } else {
      this.store.match = null;
    }

    ShortcutManagerUi.instances.forEach(manager => manager.forceUpdate());
  };

  handleKeyUp = () => {
    Object.keys(this.store.modifiers).forEach(
      (modifier: keyof ShortcutManagerStore['modifiers']) => {
        this.store.modifiers[modifier] = false;
      }
    );

    ShortcutManagerUi.instances.forEach(manager => manager.forceUpdate());
  };

  removeLayer(layerToRemove: ShortcutLayer) {
    this.store.layers = this.store.layers.filter(
      layer => layer.id !== layerToRemove.id
    );

    ShortcutManagerUi.instances.forEach(manager => manager.forceUpdate());
  }

  updateLayer(
    layerToReplace: ShortcutLayer,
    shortcuts: ShortcutDefinition | Shortcut[]
  ) {
    const newLayer = new ShortcutLayer(shortcuts);
    this.store.layers = this.store.layers.map(layer =>
      layer.id === layerToReplace.id ? newLayer : layer
    );

    ShortcutManagerUi.instances.forEach(manager => manager.forceUpdate());

    return newLayer;
  }
  // #endregion
}

interface IProps {
  visible?: boolean;
}

export class ShortcutManagerUi extends Component<IProps> {
  static instances = new Map<ShortcutManagerUi, ShortcutManagerUi>();

  constructor(props: IProps) {
    super(props);
    ShortcutManagerUi.instances.set(this, this);
  }

  componentWillUnmount() {
    ShortcutManagerUi.instances.delete(this);
  }

  render() {
    const { modifiers, history, layers } = ShortcutManager.store;
    const { visible = false } = this.props;

    if (!visible) return null;

    return (
      <span className="ShortcutManager ShortcutManager--debug">
        <div className="ShortcutManager__Header">
          Keyboard Shortcuts
          <div className="ShortcutManager__Modifiers">
            {Object.entries(modifiers).map(
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
              {history.map(key => (
                <code key={`${key.key}-${key.time}`}>{key.key}</code>
              ))}
            </div>
          </div>
          {layers
            .slice()
            .reverse()
            .map((layer, i) => (
              <dl className="ShortcutManager__Layer" key={i}>
                <header>
                  {`Layer ${String(layers.length - i).padStart(2, '0')}`}
                </header>
                {layer.shortcuts.map(shortcut => this.renderShortcut(shortcut))}
              </dl>
            ))}
        </div>
      </span>
    );
  }

  renderChord(chord: string) {
    const { history } = ShortcutManager.store;

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
    const { match, shortcuts } = ShortcutManager.store;

    const triggeredClass =
      match &&
      // match.action === shortcut.action &&
      match.chord === shortcut.chord &&
      match.caption === shortcut.caption
        ? 'Shortcut--triggered'
        : '';

    const overriddenClass =
      shortcuts.find(other => other.chord === shortcut.chord) !== shortcut
        ? 'Shortcut--overridden'
        : '';

    return (
      <span
        className={`Shortcut ${triggeredClass} ${overriddenClass}`}
        key={shortcut.id}
      >
        <dt className="Shortcut__Chord">
          {this.renderChord(shortcut.chord.replace(' ', ''))}
        </dt>
        <dd className="Shortcut__Definition">{shortcut.caption}</dd>
      </span>
    );
  }
}
