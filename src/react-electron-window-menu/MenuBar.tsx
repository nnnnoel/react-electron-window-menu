import * as React from 'react';
import { IREWMenu } from './common/@types';
import ContextMenu from './ContextMenu';

interface IState {
  active: boolean;
  openedMenuIndex: number;
}
interface IKeyDownAttr {
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  which: number;
}

class MenuBar extends React.Component<IREWMenu.IMenuBarProps, IState> {
  childMenu: IREWMenu.IContextMenu[];
  containerRef: React.RefObject<HTMLDivElement>;
  keydownInfo: string;

  constructor(props: IREWMenu.IMenuBarProps) {
    super(props);

    this.childMenu = [];
    this.containerRef = React.createRef();
    this.state = {
      active: false,
      openedMenuIndex: -1,
    };
  }

  onMousedownBody = (ev: MouseEvent) => {
    var el = ev.target;
    if (this.containerRef.current) {
      if (el && el instanceof Node && !this.containerRef.current.contains(el)) {
        this.setState({ active: false, openedMenuIndex: -1 });
        document.body.removeEventListener('mousedown', this.onMousedownBody);
        window.removeEventListener('keydown', this.onKeyDownWindow);
      }
    }
  };

  onKeyDownWindow = (ev: KeyboardEvent) => {
    const { altKey, shiftKey, ctrlKey, metaKey, which } = ev;
    this.keydownInfo = [shiftKey, ctrlKey, metaKey, which].join('-');
  };

  onKeyUpWindow = (ev: KeyboardEvent) => {
    const { altKey, shiftKey, ctrlKey, metaKey, which } = ev;
    const keyupInfo = [shiftKey, ctrlKey, metaKey, which].join('-');
    console.log(this.keydownInfo, keyupInfo, this.keydownInfo === keyupInfo);
  };

  handleMenuBarActive = () => {
    this.setState({
      active: true,
    });

    document.body.addEventListener('mousedown', this.onMousedownBody);
  };

  handleMenuClick = (e: React.MouseEvent, menuIndex: number) => {
    this.handleSubmenuPopup(e, menuIndex);
  };

  handleMenuOver = (e: React.MouseEvent, menuIndex: number) => {
    const { active } = this.state;
    if (!active) {
      return;
    }
    this.handleSubmenuPopup(e, menuIndex);
  };

  handleSubmenuPopup = (e: React.MouseEvent, menuIndex: number) => {
    const { items = [] } = this.props;
    const item = items[menuIndex];
    const submenu = this.childMenu[menuIndex];
    if (!submenu || !item) {
      return;
    }
    if (!e.currentTarget) {
      return;
    }
    if (!this.containerRef.current) {
      return;
    }

    const { openedMenuIndex = -1 } = this.state;
    const { pageXOffset, pageYOffset } = window;
    const { left, top, height } = e.currentTarget.getBoundingClientRect();

    if (openedMenuIndex !== menuIndex) {
      this.childMenu[openedMenuIndex] &&
        this.childMenu[openedMenuIndex].close();
    }
    // submenu.setMenu(item.submenu || []);
    submenu.popup({ x: left + pageXOffset, y: top + height + pageYOffset });

    this.setState({
      openedMenuIndex: menuIndex,
    });
  };

  initSubmenu = () => {
    const {
      items = [],
      submenu: { style: _submenuStyle = {}, placement = 'bottom' } = {},
    } = this.props;

    const submenuStyle = {
      ..._submenuStyle,
    };

    if (placement === 'bottom') {
      submenuStyle.borderTopLeftRadius = 0;
      submenuStyle.borderTopRightRadius = 0;
      submenuStyle.marginTop = 0;
    }

    this.childMenu = [];
    items.forEach((menu, i) => {
      const submenu = new ContextMenu({
        id: `menu-${i}`,
        style: submenuStyle,
        placement,
      });
      submenu.setMenu(menu.submenu || []);
      this.childMenu.push(submenu);
    });
  };

  componentDidMount() {
    this.initSubmenu();

    window.addEventListener('keydown', this.onKeyDownWindow, false);
    window.addEventListener('keyup', this.onKeyUpWindow, false);
  }

  componentDidUpdate(prevProps: IREWMenu.IMenuBarProps) {
    if (prevProps.items !== this.props.items) {
      this.initSubmenu();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDownWindow);
    window.removeEventListener('keyup', this.onKeyUpWindow);
  }

  render() {
    const { active, openedMenuIndex } = this.state;
    const { items = [], style } = this.props;
    const menuBarStyle = {
      ...style,
    };
    return (
      <div
        ref={this.containerRef}
        className={`rewm-menubar${active ? ' rewm-menubar-active' : ''}`}
        style={menuBarStyle}
      >
        {items.map((menu, mi) => {
          return (
            <div
              className={`${openedMenuIndex === mi ? 'active' : ''}`}
              key={mi}
              data-menubar-item
              onMouseDown={() => {
                this.handleMenuBarActive();
              }}
              onClick={e => {
                this.handleMenuClick(e, mi);
              }}
              onMouseOver={e => {
                this.handleMenuOver(e, mi);
              }}
            >
              {menu.label}
            </div>
          );
        })}
      </div>
    );
  }
}

export default MenuBar;
