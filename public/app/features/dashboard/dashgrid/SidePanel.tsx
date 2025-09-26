import { css, cx } from '@emotion/css';
import React, { useEffect, useState } from 'react';
import { Resizable } from 'react-resizable';
import { useLocalStorage, useMeasure } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { SectionNavToggle } from 'app/core/components/Page/SectionNavToggle';
import {VizPanel} from "@grafana/scenes";


export type Props = {
    panel?: VizPanel;
};

export function SidePanel(props: Props) {
    const styles = useStyles2(getStyles);
    const {panel} = props;

    const [measureRef, { width: measuredWidth, height: measuredHeight }] = useMeasure();
    const { isExpanded, onToggleExpand } = useExpandToggle();
    const theme = useTheme2();
    const isSmallScreen = window.matchMedia(`(max-width: ${theme.breakpoints.values.md}px)`).matches;
    // Removed unused windowWidth

    if (!panel) {
        return null;
    }

    // For side panel, we'll use a default width or the measured width
    const defaultPanelWidth = 400; // Default width for side panel
    const panelWidth = isSmallScreen ? measuredWidth : (measuredWidth || defaultPanelWidth);
    const panelHeight = measuredHeight;

    const handleResizeStop = (width: number, height: number) => {
        // Save the user's preferred side panel width
        localStorage.setItem('grafana.sidePanel.width', width.toString());
    };

    const renderNav = (width: number) => {
        // Create a sized container for the panel
        const panelContainer = (
            <div style={{ width: width, height: panelHeight }}>
                <panel.Component model={panel} />
            </div>
        );

        return (
            <nav className={cx(styles.nav, { [styles.navExpanded]: isExpanded })} style={{ width: isExpanded ? width : 0 }}>
                {panelContainer}
            </nav>
        );
    };

    let nav;
    if (isSmallScreen) {
        nav = renderNav(panelWidth);
    } else {
        nav = (
            <SidePanelResize width={panelWidth} height={panelHeight} onResizeStop={handleResizeStop}>
                {(width, height) => renderNav(width)}
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
                        'react-resizable-handle--side-panel',
                        css`
              width: 5px;
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
            maxConstraints={[window.innerWidth / 2, window.innerHeight / 2]}
            onResize={(_e, data) => setWidth(data.size.width)}
            onResizeStop={(_e, data) => onResizeStop(data.size.width, ph)}
        >
            {children(width, ph)}
        </Resizable>
    );
}

function useExpandToggle() {
    const theme = useTheme2();
    const isSmallScreen = window.matchMedia(`(max-width: ${theme.breakpoints.values.lg}px)`).matches;

    const [sidePanelExpanded, setSidePanelExpanded] = useLocalStorage<boolean>(
        'grafana.sidePanel.expanded',
        !isSmallScreen
    );
    const [isExpanded, setIsExpanded] = useState(!isSmallScreen && sidePanelExpanded);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${theme.breakpoints.values.lg}px)`);
        const onMediaQueryChange = (e: MediaQueryListEvent) => setIsExpanded(e.matches ? false : sidePanelExpanded);
        mediaQuery.addEventListener('change', onMediaQueryChange);
        return () => mediaQuery.removeEventListener('change', onMediaQueryChange);
    }, [sidePanelExpanded, theme.breakpoints.values.lg]);

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
        position: 'relative',
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