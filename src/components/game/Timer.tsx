import React, { Component } from 'react';
import classnames from 'classnames';

interface IProps {
  classes?: string;
  time: number;
  timeRunningOutClasses?: string;
  timeRunningOutClassesThreshold?: number;
  unformatted?: boolean;
  onTimeUp: () => void;
}

interface IState {
  timeLeft: number;
}

export const Timer = class Timer extends Component<IProps, IState> {
  timeout!: number;

  constructor(props: IProps) {
    super(props);

    this.state = {
      timeLeft: props.time,
    };
  }

  clearTimeout = () => {
    window.clearTimeout(this.timeout);
  }

  tickTimer = () => {
    const { timeLeft } = this.state;

    this.setState({
      timeLeft: timeLeft - 1,
    }, () => {
      this.timeout = window.setTimeout(() => {
        if (timeLeft > 1) {
          this.tickTimer();
        } else {
          const { onTimeUp } = this.props;

          onTimeUp();
          
          this.clearTimeout();
        }
      }, 1000);
    });
  }

  componentDidMount() {
    /**
     * Otherwise the start time would not be seen
     * before the game starts (i.e.: if the time is 60 the user would
     * only see from 59 ahead)
     */
    this.timeout = window.setTimeout(() => {
      this.tickTimer();
    }, 1000);
  }

  componentWillUnmount() {
    this.clearTimeout();
  }

  render() {
    const { timeLeft } = this.state;
    const { classes, timeRunningOutClasses, timeRunningOutClassesThreshold, unformatted } = this.props;
    const finalClasses = classnames(classes, {
      [timeRunningOutClasses || '']: (timeRunningOutClassesThreshold || timeRunningOutClassesThreshold === 0) && timeLeft <= timeRunningOutClassesThreshold,
    });

    if (unformatted) {
      return (<p className={finalClasses}>{timeLeft}</p>);
    }

    return (<p className={finalClasses}>{formatTime(timeLeft)}</p>);
  }
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const secondsFormatted = seconds < 10 ? `0${seconds}` : seconds;

  return `${minutes}:${secondsFormatted}`;
}