import { css, cx } from '@emotion/css';
import React, { useEffect, useState } from 'react';
import { Resizable } from 'react-resizable';
import { useLocalStorage, useMeasure, useWindowSize } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { SectionNavToggle } from 'app/core/components/PageNew/SectionNavToggle';
import { GRID_CELL_HEIGHT, GRID_COLUMN_COUNT } from 'app/core/constants';

import { DashboardModel } from '../state';

import { DashboardPanel } from './DashboardPanel';
import { calcGridItemPosition, calcWH, PositionParams } from './FloatingPanel';

export type Props = {
  dashboard: DashboardModel;
};

export function SidePanel(props: Props) {
  const styles = useStyles2(getStyles);

  const [measureRef, { width: measuredWidth, height: measuredHeight }] = useMeasure();

  // const [isExpanded, onToggleExpand] = useLocalStorage<boolean>('grafana-sidepanel-expand', true);
  const { isExpanded, onToggleExpand } = useExpandToggle();
  const theme = useTheme2();
  const isSmallScreen = window.matchMedia(`(max-width: ${theme.breakpoints.values.md}px)`).matches;
  const { width: windowWidth } = useWindowSize();

  const { dashboard } = props;
  const panel = dashboard.panels.find((p) => p.id === dashboard.sidePanel);
  if (!panel || panel.isEditing || panel.isViewing) {
    // TODO: should we render if height is not here?
    return null;
  }

  const positionParams: PositionParams = {
    cols: GRID_COLUMN_COUNT,
    containerPadding: [0, 0],
    containerWidth: windowWidth,
    margin: [0, 0],
    maxRows: 100,
    rowHeight: GRID_CELL_HEIGHT,
  };
  const pos = calcGridItemPosition(positionParams, panel.gridPos.x, panel.gridPos.y, panel.gridPos.w, panel.gridPos.h);

  // When we're on big screen, we're using flex rows, we need to use the width of the original panel measured from the
  // react-grid-layout. This way we dont need to expose a resizable handle for user to be able to control the width. And
  // we need to have only the height measured by the measureRef.
  // When we're on small screen, we will only use static width & height, which is measured via measureRef.
  const panelWidth = isSmallScreen ? measuredWidth : pos.width;
  const panelHeight = measuredHeight; // always need the measured height

  const handleResizeStop = (width: number, height: number) => {
    const { w, h } = calcWH(positionParams, width, height, panel.gridPos.x, panel.gridPos.y);
    panel.updateGridPos({ ...panel.gridPos, w, h });
  };

  const renderNav = (width: number) => (
    <nav className={cx(styles.nav, { [styles.navExpanded]: isExpanded })} style={{ width: isExpanded ? width : 0 }}>
      <DashboardPanel
        stateKey={panel.key}
        panel={panel}
        dashboard={dashboard}
        isEditing={false}
        isViewing={false}
        width={width}
        height={panelHeight}
      />
    </nav>
  );

  let nav;
  if (isSmallScreen) {
    nav = renderNav(panelWidth);
  } else {
    nav = (
      <SidePanelResize width={panelWidth} height={panelHeight} onResizeStop={handleResizeStop}>
        {renderNav}
      </SidePanelResize>
    );
  }

  return (
    <div className={styles.navContainer}>
      <div className={styles.measure} ref={measureRef as any} />
      {nav}
      <SectionNavToggle
        className={cx(styles.collapseIcon, {
          [styles.collapseIconExpanded]: isExpanded,
        })}
        isExpanded={Boolean(isExpanded)}
        onClick={onToggleExpand}
      />
    </div>
  );
}

type SidePanelResizeProps = {
  width: number;
  height: number;
  onResizeStop: (width: number, height: number) => void;
  children: (width: number, height: number) => React.ReactNode;
};

// only width is resizable, height is ignored
function SidePanelResize({ width: pw, height: ph, onResizeStop, children }: SidePanelResizeProps) {
  const [width, setWidth] = useState(pw);
  return (
    <Resizable
      width={width}
      height={ph}
      axis="x"
      resizeHandles={['e']}
      handle={
        <div
          className={cx(
            'react-resizable-handle',
            css`
              width: 2px;
              position: absolute;
              right: 0;
              top: 0;
              height: 100%;
              cursor: ew-resize;
              visibility: inherit;
            `
          )}
        />
      }
      maxConstraints={[window.innerWidth / 2, window.innerHeight / 2]} // half screen at most
      onResize={(_e, data) => setWidth(data.size.width)}
      onResizeStop={(_e, data) => onResizeStop(data.size.width, pw)}
    >
      {children(width, pw)}
    </Resizable>
  );
}

function useExpandToggle() {
  const theme = useTheme2();

  const isSmallScreen = window.matchMedia(`(max-width: ${theme.breakpoints.values.lg}px)`).matches;
  const [sidePanelExpaneded, setSidePanelExpanded] = useLocalStorage<boolean>(
    'grafana.sidePanel.expanded',
    !isSmallScreen
  );
  const [isExpanded, setIsExpanded] = useState(!isSmallScreen && sidePanelExpaneded);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${theme.breakpoints.values.lg}px)`);
    const onMediaQueryChange = (e: MediaQueryListEvent) => setIsExpanded(e.matches ? false : sidePanelExpaneded);
    mediaQuery.addEventListener('change', onMediaQueryChange);
    return () => mediaQuery.removeEventListener('change', onMediaQueryChange);
  }, [sidePanelExpaneded, theme.breakpoints.values.lg]);

  const onToggleExpand = () => {
    setSidePanelExpanded(!isExpanded);
    setIsExpanded(!isExpanded);
  };

  return { isExpanded, onToggleExpand };
}

const getStyles = (theme: GrafanaTheme2) => ({
  navContainer: css({
    display: 'flex',
    flexDirection: 'column',
    height: 'unset',
    position: 'relative', // for height measure
    [theme.breakpoints.up('md')]: {
      flexDirection: 'row',
      height: '100%',
    },
  }),
  measure: css({
    position: 'absolute',
    height: '50vh',
    width: '100%',
    [theme.breakpoints.up('md')]: {
      height: '100%',
      width: 'unset',
    },
  }),
  nav: css({
    transition: theme.transitions.create(['width', 'max-height']),
    maxHeight: 0,
    visibility: 'hidden',
    [theme.breakpoints.up('md')]: {
      maxHeight: 'unset',
    },
  }),
  navExpanded: css({
    maxHeight: '50vh',
    visibility: 'visible',
    [theme.breakpoints.up('md')]: {
      maxHeight: 'unset',
      flex: 1,
    },
  }),
  collapseIcon: css({
    alignSelf: 'center',
    margin: theme.spacing(1, 0),
    position: 'relative',
    top: theme.spacing(0),
    transform: 'rotate(90deg)',
    transition: theme.transitions.create('opacity'),

    [theme.breakpoints.up('md')]: {
      alignSelf: 'flex-start',
      left: 0,
      margin: theme.spacing(0, 0, 0, 1),
      top: theme.spacing(2),
      transform: 'none',
    },

    'div:hover > &, &:focus': {
      opacity: 1,
    },
  }),
  collapseIconExpanded: css({
    [theme.breakpoints.up('md')]: {
      opacity: 0,
    },
  }),
});
