import React, { useCallback, useEffect, useState } from 'react';

import { PanelModel, SelectableValue } from '@grafana/data';
import { AsyncSelect, AsyncSelectProps } from '@grafana/ui';

interface Props extends Omit<AsyncSelectProps<PanelModel>, 'value' | 'onChange' | 'loadOptions' | ''> {
  value?: PanelModel['id'];
  panels: PanelModel[];
  onChange?: (value?: number) => void;
}

export const PanelPicker = ({
  value,
  onChange,
  panels,
  placeholder = 'Select Panel',
  noOptionsMessage = 'No Floating Panel found',
  ...props
}: Props) => {
  const [current, setCurrent] = useState<SelectableValue<PanelModel>>();

  useEffect(() => {
    const panel = panels.find((p) => p.id === value);
    setCurrent({ value: panel, label: panel?.title });
  }, [value, panels]);

  const onPicked = useCallback(
    (sel: SelectableValue<PanelModel>) => {
      setCurrent(sel);
      onChange?.(sel?.value?.id);
    },
    [onChange, setCurrent]
  );

  const loadPanels = async (query = '') => {
    const options: Array<SelectableValue<PanelModel>> = panels
      .filter((p) => p.title?.toLowerCase().includes(query.toLowerCase()))
      .map((p) => ({ value: p, label: p.title }));
    return options.concat({ label: 'None' });
  };

  return (
    <AsyncSelect
      loadOptions={loadPanels}
      onChange={onPicked}
      placeholder={placeholder}
      noOptionsMessage={noOptionsMessage}
      value={current}
      defaultOptions={true}
      {...props}
    />
  );
};
