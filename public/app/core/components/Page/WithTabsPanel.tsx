import {css, cx} from '@emotion/css';
import React from 'react';

import {useStyles2} from '@grafana/ui';

export type Props = {
  tabs: React.ReactNode;
};

export function WithTabsPanel(props: Props) {
  const {tabs} = props;
  const styles = useStyles2(getStyles);

  return (
    <div className={cx('dashboard-tabs--container', styles.tabContainer)}>{tabs}</div>
  );
}

const getStyles = () => {
  return {
    tabContainer: css({
      width: '100%',
      minHeight: 0,
      background: "#fff",
      borderBottom: "1px solid #e4e5e6",
      '.panel-header': {
        display: 'none'
      }
    }),
  };
};
