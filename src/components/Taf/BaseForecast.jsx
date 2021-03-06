import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TAF_TEMPLATES, TAF_TYPES } from './TafTemplates';
import TafCell from './TafCell';
import cloneDeep from 'lodash.clonedeep';
import { jsonToTacForPeriod, jsonToTacForLocation, jsonToTacForWind, jsonToTacForCavok, jsonToTacForVerticalVisibility, jsonToTacForVisibility, jsonToTacForWeather, jsonToTacForClouds } from './TafFieldsConverter';
import moment from 'moment';
/*
  BaseForecast of TAF editor, it is the top row visible in the UI.
*/
class BaseForecast extends Component {
  render () {
    const { tafMetadata, tafForecast, focusedFieldName, inputRef, editable, invalidFields } = this.props;
    let issueTime = 'Not yet issued';
    if (tafMetadata.hasOwnProperty('issueTime')) {
      if (tafMetadata.issueTime !== 'not yet issued') {
        const momentIssueTime = moment.utc(tafMetadata.issueTime);
        if (momentIssueTime.isValid()) {
          issueTime = momentIssueTime.format('DD/MM HH:mm [UTC]');
        }
      }
    }
    const columns = [
      {
        name: 'sortable',
        value: '',
        disabled: true,
        classes: ['noselect']
      },
      {
        name: 'metadata-type',
        value: tafMetadata.hasOwnProperty('type') ? tafMetadata.type || '' : '',
        disabled: true,
        classes: ['TACnotEditable']
      },
      {
        name: 'metadata-location',
        value: tafMetadata.hasOwnProperty('location') ? jsonToTacForLocation(tafMetadata.location, true) || '' : '',
        disabled: !editable || (tafMetadata.type !== 'concept' && tafMetadata.type !== 'normal' && tafMetadata.type)
      },
      {
        name: 'metadata-issueTime',
        value: issueTime,
        disabled: true,
        classes: ['TACnotEditable']
      },
      {
        name: 'metadata-validity',
        value: tafMetadata.hasOwnProperty('validityStart') && tafMetadata.hasOwnProperty('validityEnd') ? jsonToTacForPeriod(tafMetadata.validityStart, tafMetadata.validityEnd) || '' : '',
        disabled: true,
        classes: ['TACnotEditable']
      },
      {
        name: 'forecast-wind',
        value: tafForecast.hasOwnProperty('wind') ? jsonToTacForWind(tafForecast.wind, true) || '' : '',
        disabled: !editable,
        classes: []
      },
      {
        name: 'forecast-visibility',
        value: (tafForecast.hasOwnProperty('caVOK') || tafForecast.hasOwnProperty('visibility'))
          ? jsonToTacForCavok(tafForecast.caVOK) || (jsonToTacForVisibility(tafForecast.visibility, true) || '')
          : '',
        disabled: !editable,
        classes: []
      }
    ];
    for (let weatherIndex = 0; weatherIndex < 3; weatherIndex++) {
      columns.push({
        name: 'forecast-weather-' + weatherIndex,
        value: tafForecast.hasOwnProperty('weather')
          ? (Array.isArray(tafForecast.weather) && tafForecast.weather.length > weatherIndex
            ? jsonToTacForWeather(tafForecast.weather[weatherIndex], true) || ''
            : weatherIndex === 0
              ? jsonToTacForWeather(tafForecast.weather, true) || '' // NSW
              : '')
          : '',
        disabled: !editable || (jsonToTacForWeather(tafForecast.weather) && weatherIndex !== 0),
        classes: []
      });
    }
    for (let cloudsIndex = 0; cloudsIndex < 4; cloudsIndex++) {
      columns.push({
        name: 'forecast-clouds-' + cloudsIndex,
        value: tafForecast.hasOwnProperty('vertical_visibility') || tafForecast.hasOwnProperty('clouds')
          ? jsonToTacForVerticalVisibility(tafForecast.vertical_visibility) ||
          (Array.isArray(tafForecast.clouds) && tafForecast.clouds.length > cloudsIndex
            ? jsonToTacForClouds(tafForecast.clouds[cloudsIndex], true) || ''
            : cloudsIndex === 0
              ? jsonToTacForClouds(tafForecast.clouds, true) || '' // NSC
              : '')
          : '',
        disabled: !editable || (jsonToTacForClouds(tafForecast.clouds) && cloudsIndex !== 0) ||
          (jsonToTacForVerticalVisibility(tafForecast.vertical_visibility) && cloudsIndex !== 0),
        classes: [(jsonToTacForVerticalVisibility(tafForecast.vertical_visibility) && cloudsIndex !== 0) ? 'hideValue' : null]
      });
    }
    columns.push(
      {
        name: 'removable',
        value: '',
        disabled: true,
        classes: ['noselect']
      }
    );
    columns.forEach((column) => {
      column.autoFocus = column.name === focusedFieldName;
      const isInvalid = invalidFields.includes(column.name);
      column.invalid = isInvalid;
      if (isInvalid) {
        column.classes.push('TACColumnError');
      }
    });

    return <tr>
      {columns.map((col) =>
        <TafCell classes={col.classes} key={col.name} name={col.name} inputRef={inputRef} value={col.value} disabled={col.disabled} autoFocus={col.autoFocus} />
      )}
    </tr>;
  }
};

BaseForecast.defaultProps = {
  tafMetadata: cloneDeep(TAF_TEMPLATES.METADATA),
  tafForecast: cloneDeep(TAF_TEMPLATES.FORECAST),
  focusedFieldName: null,
  inputRef: () => { },
  editable: false,
  invalidFields: []
};

BaseForecast.propTypes = {
  tafMetadata: TAF_TYPES.METADATA.isRequired,
  tafForecast: TAF_TYPES.FORECAST.isRequired,
  focusedFieldName: PropTypes.string,
  inputRef: PropTypes.func,
  editable: PropTypes.bool,
  invalidFields: PropTypes.array
};

export default BaseForecast;
