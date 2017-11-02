import React, { PureComponent } from 'react';
import moment from 'moment';
import { Row, Col } from 'reactstrap';
import PropTypes from 'prop-types';
import MomentPropTypes from 'react-moment-proptypes';

class TimeSchedule extends PureComponent {
  constructor (props) {
    super(props);

    this.getOffset = this.getOffset.bind(this);
    this.getDuration = this.getDuration.bind(this);
    this.compareByStart = this.compareByStart.bind(this);
  }

  /**
   * Compares items by start, in subsequent order
   * @param {object} itemA An item with a moment as property 'start'
   * @param {object} itemB Another item a moment as property 'start'
   * @return {number} The result of the comparison
   */
  compareByStart (itemA, itemB) {
    return itemB.start.isBefore(itemA.start)
      ? 1
      : itemB.start.isAfter(itemA.start)
        ? -1
        : 0;
  }

  /**
   * Calculate the offset in percentages
   * @param {number} baseOffsetAsPercentage The additional offset to get to the start / null position
   * @param {moment} baseStart The moment which is mapped / equals the start / null position
   * @param {moment} start The moment to get the offset for
   * @param {moment.duration} tickInterval The moment.duration as the interval of the snapping in time
   * @param {number} intervalSizeAsPercentage The size of the interval of the snapping in percentages
   * @return {number} The offset as a percentage
   */
  getOffset (baseOffsetAsPercentage, baseStart, start, tickInterval, intervalSizeAsPercentage) {
    return baseOffsetAsPercentage + (start.diff(baseStart, 'minutes') / tickInterval.asMinutes()) * intervalSizeAsPercentage;
  }

  /**
   * Calculate the duration in percentages
   * @param {moment} start The start moment for the duration
   * @param {moment} end The end moment for the duration
   * @param {moment.duration} tickInterval The moment.duration as the interval of the snapping in time
   * @param {number} intervalSizeAsPercentage The size of the interval of the snapping in percentages
   * @return {number} The duration as a percentage
   */
  getDuration (start, end, tickInterval, intervalSizeAsPercentage) {
    return end.diff(start, 'minutes') / tickInterval.asMinutes() * intervalSizeAsPercentage;
  }

  render () {
    const { startMoment, endMoment, majorTickInterval, minorTickInterval, items, groups } = this.props;
    console.log('TimeSchedule props:', items);

    let majorTicks = [];
    let currentMajorTick = startMoment.clone().add(majorTickInterval);
    while (currentMajorTick.isBefore(endMoment)) {
      majorTicks.push(currentMajorTick.clone());
      currentMajorTick.add(majorTickInterval);
    }
    let minorTicks = [];
    let currentMinorTick = startMoment.clone().add(minorTickInterval);
    while (currentMinorTick.isBefore(endMoment)) {
      minorTicks.push(currentMinorTick.clone());
      currentMinorTick.add(minorTickInterval);
    }

    const numberOfMajorTickIntervals = majorTicks.length + 2; // one interval for the EndMoment, one for the (left/right) margins
    const marginMajorBasis = 100 / (2 * numberOfMajorTickIntervals); // each margin is half the size of an interval
    const intervalMajorBasis = 100 / numberOfMajorTickIntervals + '%';
    const numberOfMinorTickIntervals = minorTicks.length + 1 + (majorTickInterval.asMinutes() / minorTickInterval.asMinutes());
    const intervalMinorBasis = 100 / numberOfMinorTickIntervals;

    return <Row className='TimeSchedule'>
      <Col>
        {groups.map((groupName) => {
          let distinctRanges = [];
          return items.filter(item => item.group === groupName).length > 0
            ? <Row className={groupName + ' groupRow'} key={groupName} style={{ minHeight: '2.4rem' }}>
              <Col style={{ flex: 1, flexDirection: 'column' }}>
                {items.filter(item => item.group === groupName).sort(this.compareByStart).map((item, index) => {
                  let offset = this.getOffset(marginMajorBasis, startMoment, item.start, minorTickInterval, intervalMinorBasis);
                  let duration = this.getDuration(item.start, item.end, minorTickInterval, intervalMinorBasis);
                  let arrowClass = '';
                  if (!item.start.isBefore(item.end)) {
                    arrowClass += 'bothArrow';
                    duration = intervalMinorBasis;
                  }
                  if (offset < marginMajorBasis) {
                    arrowClass += 'leftArrow';
                    offset = marginMajorBasis - intervalMinorBasis;
                  }
                  if (offset > 100) {
                    arrowClass += 'rightArrow';
                    offset = 100 + intervalMinorBasis;
                    duration = intervalMinorBasis;
                  }
                  if (offset + duration > 100 + 2 * intervalMinorBasis) {
                    arrowClass += 'rightArrow';
                    duration = 100 + intervalMinorBasis - offset;
                  }
                  if (index > 0) {
                    offset += distinctRanges[index - 1].offset - marginMajorBasis + distinctRanges[index - 1].duration;
                  }
                  distinctRanges.push({ offset: offset, duration: duration });
                  offset += '%';
                  duration += '%';
                  return <Row key={groupName + ':' + index}>
                    <Col className={'scheduleGroup'} style={{ flexBasis: offset, maxWidth: offset }}>{groupName}</Col>
                    <Col className={'scheduleHighlight' + ' ' + arrowClass} style={{ flexBasis: duration, maxWidth: duration }}>{item.value}</Col>
                  </Row>;
                })}
              </Col>
            </Row>
            : null;
        })}
        {/**
           * Draw the axis
           */}
        <Row className='marks' style={{ marginTop: '1rem' }}>
          <Col style={{ flexBasis: marginMajorBasis + '%', maxWidth: marginMajorBasis + '%' }} />
          <Col className='tick' style={{ flexBasis: intervalMajorBasis, maxWidth: intervalMajorBasis }} />
          {majorTicks.map((tick, index) => <Col className='tick' key={'tickMajorTop' + index} style={{ flexBasis: intervalMajorBasis, maxWidth: intervalMajorBasis }} />)}
          <Col className='tick' style={{ flexBasis: marginMajorBasis + '%', maxWidth: marginMajorBasis + '%' }} />
        </Row>
        <Row className='axis marks'>
          <Col style={{ flexBasis: marginMajorBasis + '%', maxWidth: marginMajorBasis + '%' }} />
          <Col className='tick' style={{ flexBasis: intervalMinorBasis + '%', maxWidth: intervalMinorBasis + '%' }} />
          {minorTicks.map((tick, index) => <Col className='tick' key={'tickMinor' + index} style={{ flexBasis: intervalMinorBasis + '%', maxWidth: intervalMinorBasis + '%' }} />)}
          <Col className='tick' style={{ flexBasis: marginMajorBasis + '%', maxWidth: marginMajorBasis + '%' }} />
        </Row>
        <Row className='marks'>
          <Col style={{ flexBasis: marginMajorBasis + '%', maxWidth: marginMajorBasis + '%' }} />
          <Col className='tick' style={{ flexBasis: intervalMajorBasis, maxWidth: intervalMajorBasis }} />
          {majorTicks.map((tick, index) => <Col className='tick' key={'tickMajorBottom' + index} style={{ flexBasis: intervalMajorBasis, maxWidth: intervalMajorBasis }} />)}
          <Col className='tick' style={{ flexBasis: marginMajorBasis + '%', maxWidth: marginMajorBasis + '%' }} />
        </Row>
        <Row>
          <Col className='tick' style={{ flexBasis: intervalMajorBasis, maxWidth: intervalMajorBasis }}>{startMoment.format('DD-MM HH:mm')}</Col>
          {majorTicks.map((tick, index) => <Col className='tick' key={'tickMajorLabel' + index} style={{ flexBasis: intervalMajorBasis, maxWidth: intervalMajorBasis }}>{tick.format('HH:mm')}</Col>)}
          <Col className='tick' style={{ flexBasis: intervalMajorBasis, maxWidth: intervalMajorBasis }}>{endMoment.format('DD-MM HH:mm')}</Col>
        </Row>
      </Col>
    </Row>;
  }
}

TimeSchedule.defaultProps = {
  startMoment: moment().utc().subtract(12, 'hour'),
  endMoment: moment().utc().add(12, 'hour'),
  majorTickInterval: moment.duration(6, 'hour'),
  minorTickInterval: moment.duration(1, 'hour'),
  items: [ { start: moment().utc().subtract(6, 'hour'), end: moment().utc().add(6, 'hour'), group: 'default group', value: 'default value' } ],
  groups: ['default group']
};

TimeSchedule.propTypes = {
  startMoment: MomentPropTypes.momentObj,
  endMoment: MomentPropTypes.momentObj,
  majorTickInterval: MomentPropTypes.momentDurationObj,
  minorTickInterval: MomentPropTypes.momentDurationObj,
  items: PropTypes.arrayOf(PropTypes.shape({
    start: MomentPropTypes.momentObj,
    end: MomentPropTypes.momentObj,
    group: PropTypes.string,
    value: PropTypes.string,
    isParallel: PropTypes.bool
  })),
  groups: PropTypes.arrayOf(PropTypes.string)
};

export default TimeSchedule;
