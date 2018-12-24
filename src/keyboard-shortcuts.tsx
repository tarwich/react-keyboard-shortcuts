import { observer } from 'mobx-react';
import { createElement, Component } from 'react';
import { ShortcutManager, Shortcut } from './shortcut-manager';

const shortcutManager = new ShortcutManager();

interface IWatcher {
  shortcuts: { [chord: string]: () => void };
}

interface IProps extends IWatcher {
  className?: string;
}

@observer
export class KeyboardShortcuts extends Component<IProps> implements IWatcher {
  shortcuts: {};
  layer: Shortcut[];

  componentDidMount() {
    this.layer = shortcutManager.addLayer(this.props.shortcuts);
  }

  componentDidUpdate() {
    shortcutManager.updateLayer(this.layer, this.props.shortcuts);
  }

  componentWillUnmount() {
    shortcutManager.removeLayer(this.layer);
  }

  render() {
    const { className = '' } = this.props;

    return (
      <span
        className={`KeyboardShortcuts ${className}`}
        style={{ display: 'none' }}
      />
    );
  }
}
