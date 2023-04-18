import { css } from '@emotion/css';
import React, { CSSProperties } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

export interface OverlayProps {
  topRight1?: React.ReactNode[];
  topRight2?: React.ReactNode[];
  bottomLeft?: React.ReactNode[];
  blStyle?: CSSProperties;
  hasTitle?: boolean;
}

export const GeomapOverlay = ({ topRight1, topRight2, bottomLeft, blStyle, hasTitle }: OverlayProps) => {
  const topRight1Exists = (topRight1 && topRight1.length > 0) ?? false;
  const styles = useStyles2(getStyles(topRight1Exists, hasTitle));
  return (
    <div className={styles.overlay}>
      {Boolean(topRight1?.length) && <div className={styles.TR1}>{topRight1}</div>}
      {Boolean(topRight2?.length) && <div className={styles.TR2}>{topRight2}</div>}
      {Boolean(bottomLeft?.length) && (
        <div className={styles.BL} style={blStyle}>
          {bottomLeft}
        </div>
      )}
    </div>
  );
};

const getStyles = (topRight1Exists: boolean, hasTitle?: boolean) => (theme: GrafanaTheme2) => ({
  overlay: css`
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 500;
    pointer-events: none;
  `,
  TR1: css`
    right: 0.5em;
    pointer-events: auto;
    position: absolute;
    top: ${hasTitle ? '0.5' : '1.5'}em;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  `,
  TR2: css`
    position: absolute;
    top: ${topRight1Exists ? '80' : '8'}px;
    right: 8px;
    pointer-events: auto;
  `,
  BL: css`
    position: absolute;
    bottom: 8px;
    left: 8px;
    pointer-events: auto;
  `,
});
