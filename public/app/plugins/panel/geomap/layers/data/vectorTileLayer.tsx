/**
 * There are two approaches to render a vector tile layer:
 *
 * 1. use data from data.series, which would be ready when we render the layer. However this approach can't render
 *    layers that are too big, as there is no tiling possible
 * 2. create a new API to render tiles dynamically, only returning the tiles that intersects with the current view.
 *    However, this approach has two issues:
 *
 *    a. we need to rely on the data query to give us the query to run. But at this point the query is already run. If
 *       the results are huge, which is the use case we're aiming for, we have already queried the whole data set.
 *    b. we need a way to pass the query to the backend, we can't just give the backend the datasource id and ask it to
 *       query data needed, because we might want to filter the data down using SQL.
 */
import MVT from 'ol/format/MVT';
import VectorTileLayer from 'ol/layer/VectorTile';
import Map from 'ol/Map';
import * as olStyle from 'ol/style';
import VectorTileSource from 'ol/source/VectorTile';
import VectorTile from 'ol/VectorTile';
import React, { FC } from 'react';
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';

import {
  EventBus,
  GrafanaTheme2,
  MapLayerOptions,
  MapLayerRegistryItem,
  PluginState,
  StandardEditorProps,
} from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { CodeEditor, CodeEditorSuggestionItem, CodeEditorSuggestionItemKind, Field } from '@grafana/ui';

/**
 * Format
 */
enum Format {
  NONE = 'none',
  AUTO = 'auto',
}

export interface VectorTileConfig {
  formatStyle: Format;
  styleHeight: number;
  style?: string;
  replaceLimit?: boolean;
  geomColumn?: string;
  idColumn?: string;
  srid?: number;
  attrs?: string[];
}

const defaultStyle = `
 const fill = new Fill({
   color: 'rgba(255,255,255,0.4)',
 });
 const stroke = new Stroke({
   color: '#3399CC',
   width: 1.25,
 });
 const styles = [
   new Style({
     image: new Circle({
       fill: fill,
       stroke: stroke,
       radius: 5,
     }),
     fill: fill,
     stroke: stroke,
   }),
 ];
 return styles;
`;

export const defaultConfig: VectorTileConfig = {
  formatStyle: Format.AUTO,
  styleHeight: 300,
  style: defaultStyle,
  replaceLimit: true,
  geomColumn: 'geom',
  idColumn: '',
  srid: 4326,
  attrs: [],
};

const tileApiUrl = '/api/ds/tile/{z}/{x}/{y}';

export const VECTOR_TILE_LAYER_ID = 'vector-tile-layer';

const { Circle, Fill, Icon, IconImage, Image, RegularShape, Stroke, Style, Text } = olStyle;

export const vectorTileLayer: MapLayerRegistryItem<VectorTileConfig> = {
  id: VECTOR_TILE_LAYER_ID,
  name: 'Vector Tile layer',
  description: 'Add a vector tile layer from geo data source, e.g. PostGIS',
  state: PluginState.alpha,
  isBaseMap: false,
  showLocation: false,
  hideOpacity: true,

  create: async (map: Map, options: MapLayerOptions<VectorTileConfig>, eventBus: EventBus, theme: GrafanaTheme2) => {
    console.log('create vector tile layer');
    const styleFunc = new Function(
      'olStyle',
      'Circle',
      'Fill',
      'Icon',
      'IconImage',
      'Image',
      'RegularShape',
      'Stroke',
      'Style',
      'Text',
      options.config?.style ?? defaultStyle
    );
    const style = styleFunc(olStyle, Circle, Fill, Icon, IconImage, Image, RegularShape, Stroke, Style, Text);
    const formData = new FormData();

    const source = new VectorTileSource({
      format: new MVT(),
      url: tileApiUrl,
      tileLoadFunction: (tile, url) => {
        const vtile = tile as VectorTile;
        // TODO(jackieli) could also use the tile.tileCoord to send z, x, y to server instead of url
        vtile.setLoader(function (extent, resolution, projection) {
          // post request to the tile api
          fetch(url, { method: 'POST', body: formData })
            .then(function (response) {
              response.arrayBuffer().then(function (data) {
                const format = vtile.getFormat(); // ol/format/MVT configured as source format
                const features = format.readFeatures(data, {
                  extent: extent,
                  featureProjection: projection,
                });
                vtile.setFeatures(features as any);
              });
            })
            .catch(vtile.onError.bind(vtile));
        });
      },
    });
    const layer = new VectorTileLayer({
      style,
    });

    return {
      init() {
        return layer;
      },
      update(data) {
        const { targets, scopedVars } = data.request ?? {};
        const target = targets?.find((t) => t.refId === options?.filterData?.options) ?? {};
        const { datasource, rawSql } = target as any;
        let executedQueryString = getTemplateSrv().replace(rawSql, scopedVars);
        if (!datasource || !executedQueryString) {
          layer.setSource(null);
          return;
        }
        // when the data source changes, we want to clear the cache of the source and let the map re-render
        // the following code seeems to do the trick
        source.clear();
        map.render();

        if (options.config?.replaceLimit) {
          executedQueryString = executedQueryString.replace(/LIMIT\s+\d+\s*;?$/i, '');
        }
        formData.set('query', executedQueryString);
        formData.set('dsUid', datasource.uid);
        formData.set('srid', options.config?.srid?.toString() ?? '4326');
        formData.set('format', 'pbf');
        formData.set('layerName', options.name);
        formData.set('geomColumn', options.config?.geomColumn ?? 'geom');
        formData.set('idColumn', options.config?.idColumn ?? 'gid');
        formData.set('attrs', options.config?.attrs?.join(',') ?? '');
        // source.setUrl(tileApiUrl + `?dsUid=${datasource.uid}&query=${executedQueryString}`);
        layer.setSource(source);
      },
      registerOptionsUI(builder) {
        builder
          // TODO(jackieli): change to use a MonacoEditor
          .addNumberInput({
            path: 'config.srid',
            name: 'SRID',
            description: `The SRID of the data. E.g. use SELECT Find_SRID('public', 'nyc_census_blocks', 'geom') to find out in PostGIS`,
            defaultValue: defaultConfig.srid,
          })
          .addSelect({
            path: 'config.geomColumn',
            name: 'Geometry column',
            description: 'Choose the geometry column to use',
            defaultValue: defaultConfig.geomColumn,
            settings: {
              options: [],
              getOptions: async (ctx) => {
                const fields = ctx.data.find((d) => d.refId === options.filterData?.options)?.fields || [];
                return fields.map((field) => ({ label: field.name, value: field.name }));
              },
            },
          })
          .addSelect({
            path: 'config.idColumn',
            name: 'ID column',
            description: 'Choose the id column to use',
            defaultValue: defaultConfig.idColumn,
            settings: {
              options: [],
              getOptions: async (ctx) => {
                const fields = ctx.data.find((d) => d.refId === options.filterData?.options)?.fields || [];
                return fields.map((field) => ({ label: field.name, value: field.name }));
              },
            },
          })
          .addMultiSelect({
            path: 'config.attrs',
            name: 'Attribute columns',
            description: 'Choose the columns to show as feature attributes',
            settings: {
              options: [],
              getOptions: async (ctx) => {
                const fields = ctx.data.find((d) => d.refId === options.filterData?.options)?.fields || [];
                return fields.map((field) => ({ label: field.name, value: field.name }));
              },
            },
          })
          .addBooleanSwitch({
            path: 'config.replaceLimit',
            name: 'Replace LIMIT statement',
            description:
              'If turned on, the outermost LIMIT statement will be eliminated. This is useful ' +
              'when the query is large, but the MVT requests would be small because of viewport clipping. ' +
              '',
            defaultValue: defaultConfig.replaceLimit,
          })
          .addSliderInput({
            path: 'config.styleHeight',
            name: 'Editor height',
            defaultValue: defaultConfig.styleHeight,
            settings: {
              min: 100,
              max: 2000,
            },
            category: ['Layer style'],
          })
          .addRadio({
            path: 'config.formatStyle',
            name: 'Auto format javascript',
            description: 'If turned on, the script will be formatted automatically',
            settings: { options: FormatOptions },
            defaultValue: defaultConfig.formatStyle,
            category: ['Layer style'],
          })
          .addCustomEditor({
            id: 'config.style',
            path: 'config.style',
            name: 'Layer style',
            description:
              'The style of the layer. Follow openlayers style config guides. It should return a value that can be accepted as the style argument of ol/layer/VectorTile#setStyle',
            defaultValue: defaultStyle,
            editor: StyleEditor,
            category: ['Layer style'],
          });
      },
    };
  },
};

/**
 * Supported Languages
 */
const enum CodeLanguage {
  JAVASCRIPT = 'javascript',
  JSON = 'json',
}

/**
 * Format Options
 */
const FormatOptions = [
  { value: Format.AUTO, label: 'Auto' },
  { value: Format.NONE, label: 'Disabled' },
];

export const CodeEditorSuggestions: CodeEditorSuggestionItem[] = [
  { label: 'olStyle', kind: CodeEditorSuggestionItemKind.Property, detail: 'Openlayers ol/style module' },
  { label: 'Circle', kind: CodeEditorSuggestionItemKind.Property, detail: 'Openlayers ol/style/Circle module' },
  { label: 'Fill', kind: CodeEditorSuggestionItemKind.Property, detail: 'Openlayers ol/style/Fill module' },
  { label: 'Icon', kind: CodeEditorSuggestionItemKind.Property, detail: 'Openlayers ol/style/Icon module' },
  { label: 'IconImage', kind: CodeEditorSuggestionItemKind.Property, detail: 'Openlayers ol/style/IconImage module' },
  { label: 'Image', kind: CodeEditorSuggestionItemKind.Property, detail: 'Openlayers ol/style/Image module' },
  {
    label: 'RegularShape',
    kind: CodeEditorSuggestionItemKind.Property,
    detail: 'Openlayers ol/style/RegularShape module',
  },
  { label: 'Stroke', kind: CodeEditorSuggestionItemKind.Property, detail: 'Openlayers ol/style/Stroke module' },
  { label: 'Style', kind: CodeEditorSuggestionItemKind.Property, detail: 'Openlayers ol/style/Style module' },
  { label: 'Text ', kind: CodeEditorSuggestionItemKind.Property, detail: 'Openlayers ol/style/Text  module' },

  // { label: 'data', kind: CodeEditorSuggestionItemKind.Property, detail: 'Data frame' },
];

const StyleEditor: FC<StandardEditorProps<string, any, MapLayerOptions<VectorTileConfig>>> = ({
  item,
  context,
  value,
  onChange,
}) => {
  /**
   * Template Service to get Variables
   */
  const templateSrv = getTemplateSrv();

  /**
   * Format On Mount
   */
  const onEditorMount = (editor: monacoType.editor.IStandaloneCodeEditor) => {
    if (context.options?.config?.formatStyle !== Format.AUTO) {
      return;
    }

    setTimeout(() => {
      editor.getAction('editor.action.formatDocument').run();
    }, 100);
  };

  /**
   * Suggestions
   */
  const getSuggestions = (): CodeEditorSuggestionItem[] => {
    /**
     * Add Variables
     */
    const suggestions = templateSrv.getVariables().map((variable) => {
      return {
        label: `\$\{${variable.name}\}`,
        kind: CodeEditorSuggestionItemKind.Property,
        detail: variable.description ? variable.description : variable.label,
      };
    });

    return [...CodeEditorSuggestions, ...suggestions];
  };

  /**
   * Format Options
   */
  const monacoOptions =
    context.options?.config?.formatStyle === Format.AUTO
      ? { formatOnPaste: true, formatOnType: true }
      : { formatOnPaste: false, formatOnType: false };

  return (
    <Field label={item.name} description={item.description}>
      <CodeEditor
        language={CodeLanguage.JAVASCRIPT}
        showLineNumbers={true}
        showMiniMap={(value && value.length) > 100}
        value={value}
        height={`${context.options?.config?.styleHeight ?? defaultConfig.styleHeight}px`}
        onBlur={onChange}
        onSave={onChange}
        monacoOptions={monacoOptions}
        onEditorDidMount={onEditorMount}
        getSuggestions={getSuggestions}
      />
    </Field>
  );
};
