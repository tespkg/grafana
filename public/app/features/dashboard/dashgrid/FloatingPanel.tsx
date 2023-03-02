import React, { CSSProperties, useState } from 'react';
import Draggable from 'react-draggable';
import ReactGridLayout from 'react-grid-layout';
import { Resizable } from 'react-resizable';

import { config } from '@grafana/runtime';
import { GRID_CELL_HEIGHT, GRID_COLUMN_COUNT } from 'app/core/constants';

import { PanelModel } from '../state';

export type Props = {
  panels: PanelModel[];
  onDragStop: (item: ReactGridLayout.Layout, layout: ReactGridLayout.Layout[]) => void;
  onResizeStop: (item: ReactGridLayout.Layout, layout: ReactGridLayout.Layout[]) => void;
  children: (panel: PanelModel, width: number, height: number) => React.ReactNode;
};

const portalStyle: CSSProperties = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  position: 'fixed',
  zIndex: config.theme2.zIndex.navbarFixed,
};

export const FloatingPanels = (props: Props) => {
  const positionParams: PositionParams = {
    cols: GRID_COLUMN_COUNT,
    containerPadding: [0, 0],
    containerWidth: window.innerWidth,
    margin: [0, 0],
    maxRows: 100,
    rowHeight: GRID_CELL_HEIGHT,
  };

  const handleDragStop = (panel: PanelModel, top: number, left: number) => {
    const { x, y } = calcXY(positionParams, top, left, panel.gridPos.w, panel.gridPos.h);
    console.log('dragStop', { ...panel.gridPos, x, y, i: panel.key });
    props.onDragStop({ ...panel.gridPos, x, y, i: panel.key }, []);
  };
  const handleResizeStop = (panel: PanelModel, width: number, height: number) => {
    const { w, h } = calcWH(positionParams, width, height, panel.gridPos.x, panel.gridPos.y);
    console.log('resizeStop', { ...panel.gridPos, w, h, i: panel.key });
    props.onResizeStop({ ...panel.gridPos, w, h, i: panel.key }, []);
  };

  return (
    <div style={portalStyle}>
      {props.panels.map((panel) => {
        const pos = calcGridItemPosition(
          positionParams,
          panel.gridPos.x,
          panel.gridPos.y,
          panel.gridPos.w,
          panel.gridPos.h
        );
        console.log(panel.gridPos, pos);
        return (
          <FloatingPanelItem
            panel={panel}
            key={panel.id}
            width={pos.width}
            height={pos.height}
            left={pos.left}
            top={pos.top}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
          >
            {props.children}
          </FloatingPanelItem>
        );
      })}
    </div>
  );
};

type ItemProps = {
  width: number;
  height: number;
  top: number;
  left: number;
  panel: PanelModel;
  children: (panel: PanelModel, width: number, height: number) => React.ReactNode;
  onDragStop: (panel: PanelModel, x: number, y: number) => void;
  onResizeStop: (panel: PanelModel, width: number, height: number) => void;
};

const FloatingPanelItem = (props: ItemProps) => {
  const [{ width, height }, setSize] = useState({ width: props.width, height: props.height });
  // const [{ top, left }, setPosition] = useState({ top: props.top, left: props.left });

  // sync props
  // if (props.width !== width || props.height !== height) {
  //   setSize({ width: props.width, height: props.height });
  // }
  // if (props.top !== top || props.left !== left) {
  //   setPosition({ top: props.top, left: props.left });
  // }

  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <Draggable
      defaultPosition={{ x: props.left, y: props.top }}
      // position={{ x: left, y: top }}
      // onDrag={(_e, data) => setPosition({ top: data.y, left: data.x })}
      // bounds idea: https://github.com/react-grid-layout/react-draggable/issues/535#issuecomment-1046270273
      bounds="body"
      onStop={(_e, data) => props.onDragStop(props.panel, data.x, data.y)}
      handle={'.grid-drag-handle'}
      cancel={'.react-resizable-handle,.grid-drag-cancel'}
      nodeRef={ref}
    >
      <Resizable
        width={width}
        height={height}
        maxConstraints={[window.innerWidth, window.innerHeight]}
        onResize={(_e, data) => setSize(data.size)}
        onResizeStop={(_e, data) => props.onResizeStop(props.panel, data.size.width, data.size.height)}
      >
        <div ref={ref} className="react-grid-item" style={{ width, height }}>
          {props.children(props.panel, width, height)}
        </div>
      </Resizable>
    </Draggable>
  );
};

FloatingPanelItem.displayName = 'FloatingPanelItem';

/*************************************************************
Adapted from react-grid-layout

The MIT License (MIT)

Copyright (c) 2016 Samuel Reed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

type Position = {
  left: number;
  top: number;
  width: number;
  height: number;
};
type PositionParams = {
  margin: [number, number];
  containerPadding: [number, number];
  containerWidth: number;
  cols: number;
  rowHeight: number;
  maxRows: number;
};

// Helper for generating column width
function calcGridColWidth(positionParams: PositionParams): number {
  const { margin, containerPadding, containerWidth, cols } = positionParams;
  return (containerWidth - margin[0] * (cols - 1) - containerPadding[0] * 2) / cols;
}

// This can either be called:
// calcGridItemWHPx(w, colWidth, margin[0])
// or
// calcGridItemWHPx(h, rowHeight, margin[1])
function calcGridItemWHPx(gridUnits: number, colOrRowSize: number, marginPx: number): number {
  // 0 * Infinity === NaN, which causes problems with resize contraints
  if (!Number.isFinite(gridUnits)) {
    return gridUnits;
  }
  return Math.round(colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx);
}

/**
 * Return position on the page given an x, y, w, h.
 * left, top, width, height are all in pixels.
 * @param  {PositionParams} positionParams  Parameters of grid needed for coordinates calculations.
 * @param  {Number}  x                      X coordinate in grid units.
 * @param  {Number}  y                      Y coordinate in grid units.
 * @param  {Number}  w                      W coordinate in grid units.
 * @param  {Number}  h                      H coordinate in grid units.
 * @return {Position}                       Object containing coords.
 */
function calcGridItemPosition(
  positionParams: PositionParams,
  x: number,
  y: number,
  w: number,
  h: number,
  state?: { dragging?: Position; resizing?: Position }
): Position {
  const { margin, containerPadding, rowHeight } = positionParams;
  const colWidth = calcGridColWidth(positionParams);
  const out: any = {};

  // If resizing, use the exact width and height as returned from resizing callbacks.
  if (state && state.resizing) {
    out.width = Math.round(state.resizing.width);
    out.height = Math.round(state.resizing.height);
  }
  // Otherwise, calculate from grid units.
  else {
    out.width = calcGridItemWHPx(w, colWidth, margin[0]);
    out.height = calcGridItemWHPx(h, rowHeight, margin[1]);
  }

  // If dragging, use the exact width and height as returned from dragging callbacks.
  if (state && state.dragging) {
    out.top = Math.round(state.dragging.top);
    out.left = Math.round(state.dragging.left);
  }
  // Otherwise, calculate from grid units.
  else {
    out.top = Math.round((rowHeight + margin[1]) * y + containerPadding[1]);
    out.left = Math.round((colWidth + margin[0]) * x + containerPadding[0]);
  }

  return out;
}

/**
 * Translate x and y coordinates from pixels to grid units.
 * @param  {PositionParams} positionParams  Parameters of grid needed for coordinates calculations.
 * @param  {Number} top                     Top position (relative to parent) in pixels.
 * @param  {Number} left                    Left position (relative to parent) in pixels.
 * @param  {Number} w                       W coordinate in grid units.
 * @param  {Number} h                       H coordinate in grid units.
 * @return {Object}                         x and y in grid units.
 */
export function calcXY(
  positionParams: PositionParams,
  top: number,
  left: number,
  w: number,
  h: number
): { x: number; y: number } {
  const { margin, cols, rowHeight, maxRows } = positionParams;
  const colWidth = calcGridColWidth(positionParams);

  // left = colWidth * x + margin * (x + 1)
  // l = cx + m(x+1)
  // l = cx + mx + m
  // l - m = cx + mx
  // l - m = x(c + m)
  // (l - m) / (c + m) = x
  // x = (left - margin) / (coldWidth + margin)
  let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
  let y = Math.round((top - margin[1]) / (rowHeight + margin[1]));

  // Capping
  x = clamp(x, 0, cols - w);
  y = clamp(y, 0, maxRows - h);
  return { x, y };
}

/**
 * Given a height and width in pixel values, calculate grid units.
 * @param  {PositionParams} positionParams  Parameters of grid needed for coordinates calcluations.
 * @param  {Number} height                  Height in pixels.
 * @param  {Number} width                   Width in pixels.
 * @param  {Number} x                       X coordinate in grid units.
 * @param  {Number} y                       Y coordinate in grid units.
 * @return {Object}                         w, h as grid units.
 */
export function calcWH(
  positionParams: PositionParams,
  width: number,
  height: number,
  x: number,
  y: number
): { w: number; h: number } {
  const { margin, maxRows, cols, rowHeight } = positionParams;
  const colWidth = calcGridColWidth(positionParams);

  // width = colWidth * w - (margin * (w - 1))
  // ...
  // w = (width + margin) / (colWidth + margin)
  let w = Math.round((width + margin[0]) / (colWidth + margin[0]));
  let h = Math.round((height + margin[1]) / (rowHeight + margin[1]));

  // Capping
  w = clamp(w, 0, cols - x);
  h = clamp(h, 0, maxRows - y);
  return { w, h };
}

// Similar to _.clamp
export function clamp(num: number, lowerBound: number, upperBound: number): number {
  return Math.max(Math.min(num, upperBound), lowerBound);
}
