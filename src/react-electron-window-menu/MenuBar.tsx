import * as React from 'react';
import { IREWMenu } from './common/@types';
import { REWMenuEnums } from './common/@enums';
import ContextMenu from './ContextMenu';
import getMenuLabelName from './common/getMenuLabelName';

interface IState {
  active?: boolean;
  altKeyPressed?: boolean;
  openedMenuIndex?: number;
  focusMenuIndex?: number;
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
      altKeyPressed: false,
      openedMenuIndex: -1,
      focusMenuIndex: -1,
    };
  }

  onMousedownBody = (ev: MouseEvent) => {
    var el = ev.target;
    if (this.containerRef.current) {
      if (el && el instanceof Node && !this.containerRef.current.contains(el)) {
        const { openedMenuIndex = -1 } = this.state;
        if (openedMenuIndex > -1) {
          const submenu = this.childMenu[openedMenuIndex];
          if (submenu.contains(el)) {
            return;
          }
        }

        this.setState({
          active: false,
          altKeyPressed: false,
          openedMenuIndex: -1,
        });
      }
    }
  };

  onKeyDownWindow = (ev: KeyboardEvent) => {
    const { altKeyPressed, focusMenuIndex = 0 } = this.state;
    const { items = [] } = this.props;
    const { altKey, shiftKey, ctrlKey, metaKey, which } = ev;
    this.keydownInfo = [shiftKey, ctrlKey, metaKey, which].join('-');

    switch (which) {
      case REWMenuEnums.KeyCodes.ESC:
        this.handleReset();
        return;
      default:
        break;
    }

    if (altKey && which !== 18) {
      // console.log('keyaction', which);
    } else if (altKeyPressed) {
      switch (which) {
        case REWMenuEnums.KeyCodes.RIGHT_ARROW:
          ev.preventDefault();
          this.setState({
            focusMenuIndex:
              focusMenuIndex + 1 < items.length ? focusMenuIndex + 1 : 0,
          });

          break;
        case REWMenuEnums.KeyCodes.LEFT_ARROW:
          ev.preventDefault();
          this.setState({
            focusMenuIndex:
              focusMenuIndex === 0 ? items.length - 1 : focusMenuIndex - 1,
          });
          break;

        case REWMenuEnums.KeyCodes.DOWN_ARROW:
          ev.preventDefault();
          if (this.containerRef.current) {
            const el = this.containerRef.current.querySelector(
              `[data-menubar-item="${focusMenuIndex}"]`,
            );
            if (!el) {
              return;
            }
            this.handleSubmenuPopup(el, focusMenuIndex);
          }
          break;
        default:
          break;
      }
    }
  };

  onKeyUpWindow = (ev: KeyboardEvent) => {
    const { altKey, shiftKey, ctrlKey, metaKey, which } = ev;
    const keyupInfo = [shiftKey, ctrlKey, metaKey, which].join('-');

    if (this.keydownInfo === keyupInfo && which === 18) {
      console.log('altkey', which);
      this.setAltKeyPressed(!this.state.altKeyPressed);
    }
  };

  setAltKeyPressed = (pressed: boolean) => {
    if (pressed) {
      this.setState({
        active: true,
        altKeyPressed: true,
        focusMenuIndex: 0,
      });
    } else {
      this.handleReset();
    }
  };

  setFocusMenuIndex = (menuIndex: number) => {
    this.setState({
      focusMenuIndex: menuIndex,
    });
  };

  handleMenuClick = (ev: React.MouseEvent, menuIndex: number) => {
    const { openedMenuIndex } = this.state;
    if (openedMenuIndex !== menuIndex) {
      this.handleSubmenuPopup(ev.currentTarget, menuIndex);
    } else {
      this.handleReset();
    }
  };

  handleMenuOver = (ev: React.MouseEvent, menuIndex: number) => {
    const { active, focusMenuIndex } = this.state;
    if (!active) {
      return;
    }
    if (focusMenuIndex !== menuIndex) {
      this.handleSubmenuPopup(ev.currentTarget, menuIndex);
    }
  };

  handleSubmenuPopup = (el: Element, menuIndex: number) => {
    const { items = [] } = this.props;
    const item = items[menuIndex];
    const submenu = this.childMenu[menuIndex];
    if (!submenu || !item) {
      return;
    }

    if (!this.containerRef.current) {
      return;
    }

    const { openedMenuIndex = -1, focusMenuIndex = -1 } = this.state;
    const { pageXOffset, pageYOffset } = window;
    const { left, top, height } = el.getBoundingClientRect();

    if (openedMenuIndex !== menuIndex) {
      this.childMenu[openedMenuIndex] &&
        this.childMenu[openedMenuIndex].close();
    }

    submenu.popup({ x: left + pageXOffset, y: top + height + pageYOffset });

    this.setState({
      active: true,
      openedMenuIndex: menuIndex,
      focusMenuIndex: menuIndex,
    });
  };

  handleReset = () => {
    const { openedMenuIndex = -1 } = this.state;
    if (openedMenuIndex > -1) {
      const { items = [] } = this.props;
      const item = items[openedMenuIndex];
      const submenu = this.childMenu[openedMenuIndex];
      submenu.close();
    }

    this.setState({
      active: false,
      altKeyPressed: false,
      focusMenuIndex: -1,
      openedMenuIndex: -1,
    });
  };

  onClickSubmenu = (menuItem: IREWMenu.IMenuItem) => {
    const { openedMenuIndex } = this.state;
    console.log('onClickSubmenu', menuItem);
    this.handleReset();
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
        onClick: menuItem => {
          this.onClickSubmenu(menuItem);
        },
      });
      submenu.setMenu(menu.submenu || []);
      this.childMenu.push(submenu);
    });
  };

  componentDidMount() {
    const { enableAltKeyAction } = this.props;
    this.initSubmenu();

    window.addEventListener('keydown', this.onKeyDownWindow, false);

    if (enableAltKeyAction) {
      window.addEventListener('keyup', this.onKeyUpWindow, false);
    }
  }

  componentDidUpdate(prevProps: IREWMenu.IMenuBarProps, prevState: IState) {
    const {
      focusMenuIndex = -1,
      openedMenuIndex = -1,
      active = false,
    } = this.state;

    if (prevProps.items !== this.props.items) {
      this.initSubmenu();
    }

    if (
      prevState.focusMenuIndex !== this.state.focusMenuIndex &&
      openedMenuIndex > -1
    ) {
      if (this.containerRef.current) {
        const el = this.containerRef.current.querySelector(
          `[data-menubar-item="${focusMenuIndex}"]`,
        );
        if (!el) {
          return;
        }
        this.handleSubmenuPopup(el, focusMenuIndex);
      }
    }

    if (prevState.active !== active) {
      if (active) {
        document.body.addEventListener('mousedown', this.onMousedownBody);
      } else {
        document.body.removeEventListener('mousedown', this.onMousedownBody);
      }
    }
  }

  componentWillUnmount() {
    const { enableAltKeyAction } = this.props;
    window.removeEventListener('keydown', this.onKeyDownWindow);
    if (enableAltKeyAction) {
      window.removeEventListener('keyup', this.onKeyUpWindow);
    }
  }

  render() {
    const {
      active,
      altKeyPressed,
      openedMenuIndex,
      focusMenuIndex,
    } = this.state;
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
              className={`${focusMenuIndex === mi ? 'active' : ''}`}
              key={mi}
              data-menubar-item={mi}
              onClick={e => {
                this.handleMenuClick(e, mi);
              }}
              onMouseOver={e => {
                this.handleMenuOver(e, mi);
              }}
            >
              {getMenuLabelName(menu.label, altKeyPressed)}
            </div>
          );
        })}
      </div>
    );
  }
}

export default MenuBar;
