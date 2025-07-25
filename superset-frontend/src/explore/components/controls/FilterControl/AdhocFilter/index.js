/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  CUSTOM_OPERATORS,
  DISABLE_INPUT_OPERATORS,
  OPERATOR_ENUM_TO_OPERATOR_TYPE,
} from 'src/explore/constants';
import { translateToSql } from '../utils/translateToSQL';
import { Clauses, ExpressionTypes } from '../types';

const CUSTOM_OPERATIONS = [...CUSTOM_OPERATORS].map(
  op => OPERATOR_ENUM_TO_OPERATOR_TYPE[op].operation,
);

export default class AdhocFilter {
  constructor(adhocFilter) {
    this.expressionType = adhocFilter.expressionType || ExpressionTypes.Simple;
    if (this.expressionType === ExpressionTypes.Simple) {
      this.subject = adhocFilter.subject;
      this.operator = adhocFilter.operator?.toUpperCase();
      this.operatorId = adhocFilter.operatorId;
      this.comparator = adhocFilter.comparator;
      if (DISABLE_INPUT_OPERATORS.indexOf(adhocFilter.operatorId) >= 0) {
        this.comparator = undefined;
      }
      this.clause = adhocFilter.clause || Clauses.Where;
      this.sqlExpression = null;
    } else if (this.expressionType === ExpressionTypes.Sql) {
      this.sqlExpression =
        typeof adhocFilter.sqlExpression === 'string'
          ? adhocFilter.sqlExpression
          : translateToSql(adhocFilter, { useSimple: true });
      this.clause = adhocFilter.clause;
      if (
        adhocFilter.operator &&
        CUSTOM_OPERATIONS.indexOf(adhocFilter.operator) >= 0
      ) {
        this.subject = adhocFilter.subject;
        this.operator = adhocFilter.operator;
        this.operatorId = adhocFilter.operatorId;
      } else {
        this.subject = null;
        this.operator = null;
      }
      this.comparator = null;
    }
    this.isExtra = !!adhocFilter.isExtra;
    this.isNew = !!adhocFilter.isNew;
    this.datasourceWarning = !!adhocFilter.datasourceWarning;
    this.deck_slices = adhocFilter?.deck_slices;
    this.layerFilterScope = adhocFilter?.layerFilterScope;

    this.filterOptionName =
      adhocFilter.filterOptionName ||
      `filter_${Math.random().toString(36).substring(2, 15)}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
  }

  duplicateWith(nextFields) {
    return new AdhocFilter({
      ...this,
      // all duplicated fields are not new (i.e. will not open popup automatically)
      isNew: false,
      ...nextFields,
    });
  }

  equals(adhocFilter) {
    return (
      adhocFilter.clause === this.clause &&
      adhocFilter.expressionType === this.expressionType &&
      adhocFilter.sqlExpression === this.sqlExpression &&
      adhocFilter.operator === this.operator &&
      adhocFilter.operatorId === this.operatorId &&
      adhocFilter.comparator === this.comparator &&
      adhocFilter.subject === this.subject
    );
  }

  isValid() {
    if (this.expressionType === ExpressionTypes.Simple) {
      // operators where the comparator is not used
      if (
        DISABLE_INPUT_OPERATORS.map(
          op => OPERATOR_ENUM_TO_OPERATOR_TYPE[op].operation,
        ).indexOf(this.operator) >= 0
      ) {
        return !!this.subject;
      }

      if (this.operator && this.subject && this.clause) {
        if (Array.isArray(this.comparator)) {
          // A non-empty array of values ('IN' or 'NOT IN' clauses)
          return this.comparator.length > 0;
        }
        // A value has been selected or typed
        return this.comparator !== null;
      }
    }

    return (
      this.expressionType === ExpressionTypes.Sql &&
      !!(this.sqlExpression && this.clause)
    );
  }

  getDefaultLabel() {
    const label = this.translateToSql();
    return label.length < 43 ? label : `${label.substring(0, 40)}...`;
  }

  getTooltipTitle() {
    return this.translateToSql();
  }

  translateToSql() {
    return translateToSql(this);
  }
}
