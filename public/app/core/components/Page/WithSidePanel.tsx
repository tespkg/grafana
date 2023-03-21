import { css, cx } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

export type Props = {
  children: React.ReactNode;
  sidePanel: React.ReactNode;
};

export function WithSidePanel(props: Props) {
  const { children, sidePanel } = props;
  const styles = useStyles2(getStyles);

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
      marginRight: theme.spacing(-1), // work around the main content having a left padding
    }),
    content: css({
      flexGrow: 1,
      display: 'flex',
    }),
  };
};
