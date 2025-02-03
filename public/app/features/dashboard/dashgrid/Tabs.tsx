import {css} from '@emotion/css';
import React from 'react';
import {useMeasure} from 'react-use';

import {useStyles2} from '@grafana/ui';

import {DashboardModel} from "../state";

import {DashboardPanel} from "./DashboardPanel";

export type Props = {
  dashboard: DashboardModel;
};

export function Tabs(props: Props) {
  const styles = useStyles2(getStyles);
  const [measureRef, {width: measuredWidth, height: measuredHeight}] = useMeasure();

  const {dashboard} = props;
  const panel = dashboard.panels.find((p) => p.id === dashboard.tabs);
  if (!panel || panel.isEditing || panel.isViewing) {
    return null;
  }

  return (
    <div className={styles.tabContainer}>
      <div className={styles.measure} ref={measureRef as any}/>
      <DashboardPanel
        stateKey={panel.key}
        panel={panel}
        dashboard={dashboard}
        isEditing={false}
        isViewing={false}
        height={measuredHeight} width={measuredWidth}
      />
    </div>
  );
}

const getStyles = () => ({
  tabContainer: css({
    display: 'block',
  }),
  measure: css({
    position: 'absolute',
    height: '55px',
    width: '100%',
  }),
});
