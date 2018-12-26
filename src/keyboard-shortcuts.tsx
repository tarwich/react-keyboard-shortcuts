import { observer } from 'mobx-react';
import { createElement, Component } from 'react';
import { ShortcutManager, Shortcut } from './shortcut-manager';
import { observable } from 'mobx';

const shortcutManager = new ShortcutManager();

interface IProps {
  shortcuts: { [chord: string]: () => void } | Shortcut[];
}

@observer
export class KeyboardShortcuts extends Component<IProps> {
  shortcuts: {};
  @observable layer: Shortcut[] = [];

  componentDidMount() {
    this.layer = shortcutManager.addLayer(this.props.shortcuts);
  }

  componentDidUpdate(props: any) {
    if (props !== this.props) {
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
    return <span />;
  }
}
