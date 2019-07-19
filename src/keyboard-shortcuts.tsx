import { isEqual } from 'lodash';
import { Component } from 'react';
import { ShortcutManager, ShortcutLayer, Shortcut } from './shortcut-manager';

const shortcutManager = new ShortcutManager();

interface IProps {
  debug?: boolean;
  shortcuts: { [chord: string]: () => void } | Shortcut[];
}

export class KeyboardShortcuts extends Component<IProps> {
  layer: ShortcutLayer | null = null;

  constructor(props: IProps) {
    super(props);

    shortcutManager.debug = props.debug || false;
    this.layer = shortcutManager.addLayer(this.props.shortcuts);
  }

  componentDidUpdate(props: IProps) {
    shortcutManager.debug = this.props.debug || false;

    if (this.layer && !isEqual(props.shortcuts, this.props.shortcuts)) {
      this.layer = shortcutManager.updateLayer(
        this.layer,
        this.props.shortcuts
      );
    }
  }

  componentWillUnmount() {
    if (this.layer) {
      shortcutManager.removeLayer(this.layer);
    }
  }

  render() {
    return null;
  }
}
