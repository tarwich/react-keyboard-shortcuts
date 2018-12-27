import { observer } from 'mobx-react';
import { Component } from 'react';
import { ShortcutManager, ShortcutLayer, Shortcut } from './shortcut-manager';
import { observable } from 'mobx';
import { comparer } from 'mobx';

const shortcutManager = new ShortcutManager();

interface IProps {
  debug?: boolean;
  shortcuts: { [chord: string]: () => void } | Shortcut[];
}

@observer
export class KeyboardShortcuts extends Component<IProps> {
  shortcuts: {};
  @observable layer: ShortcutLayer;

  componentDidMount() {
    shortcutManager.debug = this.props.debug || false;
    this.layer = shortcutManager.addLayer(this.props.shortcuts);
  }

  componentDidUpdate(props: IProps) {
    shortcutManager.debug = this.props.debug || false;

    if (!comparer.structural(props.shortcuts, this.props.shortcuts)) {
      this.layer = shortcutManager.updateLayer(
        this.layer,
        this.props.shortcuts
      );
    }
  }

  componentWillUnmount() {
    shortcutManager.removeLayer(this.layer);
  }

  render() {
    return null;
  }
}
