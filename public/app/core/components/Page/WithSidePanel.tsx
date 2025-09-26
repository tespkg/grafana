import { css, cx } from '@emotion/css';
import React, {useEffect, useRef} from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import {DivScrollElement, ScrollRefElement} from "../NativeScrollbar";

export type Props = {
  children: React.ReactNode;
  sidePanel: React.ReactNode;
  onSetScrollRef?: (ref: ScrollRefElement) => void;
  divId?: string;
};

export function WithSidePanel(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { children, sidePanel, onSetScrollRef } = props;
  const styles = useStyles2(getStyles);

  useEffect(() => {
    if (onSetScrollRef) {
      onSetScrollRef(new DivScrollElement(document.documentElement));
    }
  }, [ref, onSetScrollRef]);

  return (
    <div className={cx('dashboard-grid--container', styles.container)}>
      <div className={cx('dashboard-grid--side-panel', styles.sidePanel)}>{sidePanel}</div>
      <div className={cx('dashboard-grid--content', styles.content)}>{children}</div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      width: '100%',
      flexGrow: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      [theme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    }),
    sidePanel: css({
      flex: '0 0 auto',
    }),
    content: css({
      flexGrow: 1,
      display: 'flex',
    }),
  };
};
