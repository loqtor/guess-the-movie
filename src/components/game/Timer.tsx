import React, { Component } from 'react';

interface IProps {
  time: number;
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

    return (<p>{timeLeft}</p>);
  }
}