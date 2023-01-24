// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     public/app/plugins/gen.go
// Using jennies:
//     TSTypesJenny
//     PluginTSTypesJenny
//
// Run 'make gen-cue' from repository root to regenerate.

import * as common from '@grafana/schema';

export const DataQueryModelVersion = Object.freeze([0, 0]);

export interface AzureMonitorQuery extends common.DataQuery {
  azureLogAnalytics?: AzureLogsQuery;
  azureMonitor?: AzureMetricQuery;
  azureResourceGraph?: AzureResourceGraphQuery;
  grafanaTemplateVariableFn?: GrafanaTemplateVariableQuery;
  namespace?: string;
  query?: AzureQueryType;
  resource?: string;
  /**
   * Template variables params
   */
  resourceGroup?: string;
  subscription?: string;
  /**
   * ARG uses multiple subscriptions
   */
  subscriptions?: Array<string>;
}

export const defaultAzureMonitorQuery: Partial<AzureMonitorQuery> = {
  subscriptions: [],
};

/**
 * GrafanaTemplateVariableFn is deprecated
 */
export enum AzureQueryType {
  AzureMonitor = 'Azure Monitor',
  AzureResourceGraph = 'Azure Resource Graph',
  GrafanaTemplateVariableFn = 'Grafana Template Variable Function',
  LogAnalytics = 'Azure Log Analytics',
  MetricNamesQuery = 'Azure Metric Names',
  NamespacesQuery = 'Azure Namespaces',
  ResourceGroupsQuery = 'Azure Resource Groups',
  ResourceNamesQuery = 'Azure Resource Names',
  SubscriptionsQuery = 'Azure Subscriptions',
  WorkspacesQuery = 'Azure Workspaces',
}

/**
 * Azure Monitor Metrics sub-query properties
 */
export interface AzureMetricQuery {
  aggregation?: string;
  alias?: string;
  allowedTimeGrainsMs?: Array<number>;
  /**
   * used as the value for the metricNamespace param when different from the resource namespace
   */
  customNamespace?: string;
  /**
   * @deprecated This property was migrated to dimensionFilters and should only be accessed in the migration
   */
  dimension?: string;
  /**
   * @deprecated This property was migrated to dimensionFilters and should only be accessed in the migration
   */
  dimensionFilter?: string;
  dimensionFilters?: Array<AzureMetricDimension>;
  /**
   * @deprecated Use metricNamespace instead
   */
  metricDefinition?: string;
  metricName?: string;
  /**
   * metricNamespace is used as the resource type (or resource namespace).
   * It"s usually equal to the target metric namespace.
   * Kept the name of the variable as metricNamespace to avoid backward incompatibility issues.
   */
  metricNamespace?: string;
  region?: string;
  /**
   * @deprecated Use resources instead
   */
  resourceGroup?: string;
  /**
   * @deprecated Use resources instead
   */
  resourceName?: string;
  /**
   * @deprecated Use resourceGroup, resourceName and metricNamespace instead
   */
  resourceUri?: string;
  resources?: Array<AzureMonitorResource>;
  timeGrain?: string;
  /**
   * @deprecated
   */
  timeGrainUnit?: string;
  top?: string;
}

export const defaultAzureMetricQuery: Partial<AzureMetricQuery> = {
  allowedTimeGrainsMs: [],
  dimensionFilters: [],
  resources: [],
};

/**
 * Azure Monitor Logs sub-query properties
 */
export interface AzureLogsQuery {
  query?: string;
  /**
   * @deprecated Use resources instead
   */
  resource?: string;
  resources?: Array<string>;
  resultFormat?: string;
  workspace?: string;
}

export const defaultAzureLogsQuery: Partial<AzureLogsQuery> = {
  resources: [],
};

export interface AzureResourceGraphQuery {
  query?: string;
  resultFormat?: string;
}

export interface AzureMonitorResource {
  metricNamespace?: string;
  region?: string;
  resourceGroup?: string;
  resourceName?: string;
  subscription?: string;
}

export interface AzureMetricDimension {
  dimension: string;
  /**
   * @deprecated filter is deprecated in favour of filters to support multiselect
   */
  filter?: string;
  filters?: Array<string>;
  operator: string;
}

export const defaultAzureMetricDimension: Partial<AzureMetricDimension> = {
  filters: [],
};

export type GrafanaTemplateVariableQueryType = ('AppInsightsMetricNameQuery' | 'AppInsightsGroupByQuery' | 'SubscriptionsQuery' | 'ResourceGroupsQuery' | 'ResourceNamesQuery' | 'MetricNamespaceQuery' | 'MetricNamesQuery' | 'WorkspacesQuery' | 'UnknownQuery');

export interface BaseGrafanaTemplateVariableQuery {
  rawQuery?: string;
}

export interface UnknownQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'UnknownQuery';
}

export interface AppInsightsMetricNameQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'AppInsightsMetricNameQuery';
}

export interface AppInsightsGroupByQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'AppInsightsGroupByQuery';
  metricName: string;
}

export interface SubscriptionsQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'SubscriptionsQuery';
}

export interface ResourceGroupsQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'ResourceGroupsQuery';
  subscription: string;
}

export interface ResourceNamesQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'ResourceNamesQuery';
  metricNamespace: string;
  resourceGroup: string;
  subscription: string;
}

export interface MetricNamespaceQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'MetricNamespaceQuery';
  metricNamespace?: string;
  resourceGroup: string;
  resourceName?: string;
  subscription: string;
}

/**
 * @deprecated Use MetricNamespaceQuery instead
 */
export interface MetricDefinitionsQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'MetricDefinitionsQuery';
  metricNamespace?: string;
  resourceGroup: string;
  resourceName?: string;
  subscription: string;
}

export interface MetricNamesQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'MetricNamesQuery';
  metricNamespace: string;
  resourceGroup: string;
  resourceName: string;
  subscription: string;
}

export interface WorkspacesQuery extends BaseGrafanaTemplateVariableQuery {
  kind: 'WorkspacesQuery';
  subscription: string;
}

export type GrafanaTemplateVariableQuery = (AppInsightsMetricNameQuery | AppInsightsGroupByQuery | SubscriptionsQuery | ResourceGroupsQuery | ResourceNamesQuery | MetricNamespaceQuery | MetricDefinitionsQuery | MetricNamesQuery | WorkspacesQuery | UnknownQuery);

export interface Azure Monitor {}
