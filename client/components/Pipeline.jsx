/**
 * Pipeline card
 */

import React from 'react';

import RaisedButton from 'material-ui/lib/raised-button';
import { CircularProgress } from 'material-ui/lib';
import { Card, CardHeader, CardText } from 'material-ui/lib/card';
import Colors from 'material-ui/lib/styles/colors';

import Moment from 'moment';

// Weather icon indicator
const weatherIconStatuses = ['mdi-weather-sunny', 'mdi-weather-partlycloudy', 'mdi-weather-cloudy', 'mdi-weather-cloudy', 'mdi-weather-pouring', 'mdi-weather-lightning'];

// FIXME: Break out to style.css
const styles = {
  cardSuccess: {
    background: Colors.greenA700,
    marginBottom: '1rem'
  },
  cardFailure: {
    background: Colors.redA700,
    marginBottom: '1rem'
  },
  cardInactive: {
    background: Colors.yellowA700,
    marginBottom: '1rem'
  },
  cardTitle: {
    color: '#fff',
    fontSize: '1.2em'
  },
  cardSubTitle: {
    color: '#fff',
    fontSize: '1em',
    fontWeight: 100
  },
  progress: {
    color: '#fff',
    float: 'right'
  }
};

export default class Pipeline extends React.Component {

  /**
   * Calculates which weather icon to use for a pipeline based on 5 latest build results
   * 
   * @param pipeline
   */
  weatherIcon(pipeline) {
    return weatherIconStatuses[5];
  }

  render() {
    let pipeline = this.props.pipeline;
    let progress = pipeline.status === 'building' ?  (
      <div className='col-xs-6'><CircularProgress className="progress" color="#fff" size={0.5} /></div>)
      : null;
    let style;
    switch (pipeline.status) {
      case 'failed':
        style = styles.cardFailure;
        break;
      case 'paused':
        style = styles.cardInactive;
        break;
      default:
        style = styles.cardSuccess;
        break;
    }
    return (
      <Card style={style}>
        <CardHeader
          className="buildtitle"
          title={pipeline.name}
          titleStyle={styles.cardTitle}
          subtitle={pipeline.status}
          subtitleStyle={styles.cardSubTitle}>
          <i className={this.weatherIcon(pipeline) + ' mdi mdi-48px buildstatus'}></i>
        </CardHeader>
        <CardText>
          <div className="buildinfo">
            <div className={pipeline.status === 'building' ? 'col-xs-6' : 'col-xs-12'}>
              <p>
                <i className="mdi mdi-clock mdi-24px"></i>
                <span>{ Moment(pipeline.buildtime).fromNow() }</span>
              </p>
              <p>
                <i className="mdi mdi-worker mdi-24px"></i>
                <span>{pipeline.author}</span>
              </p>
            </div>
            {progress}
          </div>
        </CardText>
      </Card>
    );
  }
}
