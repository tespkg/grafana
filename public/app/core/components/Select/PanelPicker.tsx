import { useCallback, useEffect, useState } from 'react';

import { SelectableValue } from '@grafana/data';
import { AsyncSelect, AsyncSelectProps } from '@grafana/ui';
import {VizPanel} from "@grafana/scenes";

interface Props extends Omit<AsyncSelectProps<VizPanel>, 'value' | 'onChange' | 'loadOptions' | ''> {
  value?: number;
  panels: VizPanel[];
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
  const [current, setCurrent] = useState<SelectableValue<VizPanel>>();

  useEffect(() => {
    // If there is no value, set the picker to the "None" state.
    if (!value) {
      setCurrent({ label: 'None' });
      return;
    }

    // If there is a value, find the corresponding panel and set it.
    const panel = panels.find((p) => parseInt(p.state.key?.replace('panel-', '') || '') === value);
    setCurrent({ value: panel, label: panel?.state?.title });

  }, [value, panels]);

  const onPicked = useCallback(
    (sel: SelectableValue<VizPanel>) => {
      setCurrent(sel);
      onChange?.(parseInt(sel?.value?.state.key?.replace('panel-', '') || ''));
    },
    [onChange, setCurrent]
  );

  const loadPanels = async (query = '') => {
    const options: Array<SelectableValue<VizPanel>> = panels
      .filter((p) => p?.state.title?.toLowerCase().includes(query.toLowerCase()))
      .map((p) => ({ value: p, label: p.state.title }));
    options.unshift({ label: 'None' });
    return options;
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
