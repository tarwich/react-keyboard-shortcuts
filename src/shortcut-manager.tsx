/** @jsx createElement */
import { observable } from 'mobx';
import { createElement, Component, Fragment } from 'react';
import { observer } from 'mobx-react';
import { render } from 'react-dom';
import './keyboard-shortcuts.scss';

type ShortcutDefinition = { [chord: string]: () => void };

let __id = 0;
const generateId = () => ++__id;

export type Shortcut = {
  chord: string;
  action: Function;
  caption?: string;
  id?: number;
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

    if (this.container && this.container.nextSibling)
      document.body.appendChild(this.container);
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
    const layer = new ShortcutLayer(shortcuts);
    this.store.layers.push(layer);
    return layer;
  }

  handleKeyDown = (event: KeyboardEvent) => {
    // Ignore when in a textfield
    if (event.target && 'value' in event.target) return;

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
      this.store.match = match;
      match.action();
      this.store.history.push(new KeyHistory({ key: '' }));
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

  removeLayer(layerToRemove: ShortcutLayer) {
    this.store.layers = this.store.layers.filter(
      layer => layer.id === layerToRemove.id
    );
  }

  updateLayer(
    layerToReplace: ShortcutLayer,
    shortcuts: ShortcutDefinition | Shortcut[]
  ) {
    const newLayer = new ShortcutLayer(shortcuts);
    this.store.layers = this.store.layers.map(
      layer => (layer.id === layerToReplace.id ? newLayer : layer)
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
  store: ShortcutManagerStore;

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
                {layer.shortcuts.map(shortcut => this.renderShortcut(shortcut))}
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
      this.store.match &&
      // this.store.match.action === shortcut.action &&
      this.store.match.chord === shortcut.chord &&
      this.store.match.caption === shortcut.caption
        ? 'Shortcut--triggered'
        : '';

    const overriddenClass =
      this.store.shortcuts.find(other => other.chord === shortcut.chord) !==
      shortcut
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
