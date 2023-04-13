import { css, cx } from '@emotion/css';
import { Map as OpenLayersMap } from 'ol';
import React, { ReactNode, useCallback, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, Checkbox, IconButton, useStyles2, VerticalGroup } from '@grafana/ui';

import { MapLayerState } from '../types';

type Props = {
  map: OpenLayersMap;
  layers: MapLayerState[];
};

export const LayerControlOverlay = ({ map, layers }: Props) => {
  const styles = useStyles2(getStyles);

  const [active, setActive] = useState<boolean>(false);
  const toggleMenu = () => setActive(!active);

  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);
  const layerControls: ReactNode[] = [];

  layers.forEach((layer) => {
    if (!layer.isBasemap) {
      const visible = layer.layer.getVisible();
      layerControls.push(
        <Checkbox
          key={layer.getName()}
          label={layer.getName()}
          checked={visible}
          onChange={() => {
            layer.layer.setVisible(!visible);
            forceUpdate();
          }}
        />
      );
    }
  });

  return (
    <div className={cx(styles.infoWrap, { [styles.infoWrapClosed]: !active })}>
      {active ? (
        <div>
          <div className={styles.rowGroup}>
            <VerticalGroup>{layerControls}</VerticalGroup>
            <Button className={styles.button} icon="times" variant="secondary" size="sm" onClick={toggleMenu} />
          </div>
        </div>
      ) : (
        <IconButton
          className={styles.icon}
          name="layer-group"
          tooltip="Show layers control"
          tooltipPlacement="left"
          onClick={toggleMenu}
        />
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  button: css`
    margin-left: auto;
  `,
  icon: css`
    background-color: ${theme.colors.secondary.main};
    display: inline-block;
    height: 19.25px;
    margin: 1px;
    width: 19.25px;
  `,
  infoWrap: css`
    color: ${theme.colors.text};
    background-color: ${theme.colors.background.secondary};
    border-radius: 4px;
    padding: 2px;
  `,
  infoWrapClosed: css`
    height: 25.25px;
    width: 25.25px;
  `,
  rowGroup: css`
    display: flex;
    justify-content: flex-end;
  `,
});
