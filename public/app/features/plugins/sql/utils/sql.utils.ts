import {
  QueryEditorExpressionType,
  QueryEditorFunctionExpression,
  QueryEditorGroupByExpression,
  QueryEditorPropertyExpression,
  QueryEditorPropertyType,
} from '../expressions';
import { SQLExpression } from '../types';

export function createSelectClause(
  sqlColumns: NonNullable<SQLExpression['columns']>,
  escapeIdentifiers?: boolean
): string {
  const columns = sqlColumns.map((c) => {
    let rawColumn = '';
    if (c.name && c.alias) {
      rawColumn += `${c.name}(${c.parameters?.map((p) => `${escapeValue(p.name, escapeIdentifiers)}`)}) AS ${c.alias}`;
    } else if (c.name) {
      rawColumn += `${c.name}(${c.parameters?.map((p) => `${escapeValue(p.name, escapeIdentifiers)}`)})`;
    } else if (c.alias) {
      rawColumn += `${c.parameters?.map((p) => `${escapeValue(p.name, escapeIdentifiers)}`)} AS ${c.alias}`;
    } else {
      rawColumn += `${c.parameters?.map((p) => `${escapeValue(p.name, escapeIdentifiers)}`)}`;
    }
    return rawColumn;
  });
  return `SELECT ${columns.join(', ')} `;
}

export const haveColumns = (columns: SQLExpression['columns']): columns is NonNullable<SQLExpression['columns']> => {
  if (!columns) {
    return false;
  }

  const haveColumn = columns.some((c) => c.parameters?.length || c.parameters?.some((p) => p.name));
  const haveFunction = columns.some((c) => c.name);
  return haveColumn || haveFunction;
};

/**
 * Creates a GroupByExpression for a specified field
 */
export function setGroupByField(field?: string): QueryEditorGroupByExpression {
  return {
    type: QueryEditorExpressionType.GroupBy,
    property: {
      type: QueryEditorPropertyType.String,
      name: field,
    },
  };
}

/**
 * Creates a PropertyExpression for a specified field
 */
export function setPropertyField(field?: string): QueryEditorPropertyExpression {
  return {
    type: QueryEditorExpressionType.Property,
    property: {
      type: QueryEditorPropertyType.String,
      name: field,
    },
  };
}

export function createFunctionField(functionName?: string): QueryEditorFunctionExpression {
  return {
    type: QueryEditorExpressionType.Function,
    name: functionName,
    parameters: [],
  };
}

// Puts backticks (`) around the string value.
export function escapeValue(value?: string, escapeIdentifiers = false) {
  if (!value || value === '*') {
    return value;
  }
  return escapeIdentifiers === true ? `\`${value}\`` : value;
}
