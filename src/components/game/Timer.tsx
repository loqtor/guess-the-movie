import React, { Component } from 'react';

interface IProps {
  time: number;
  onTimeUp: () => void;
}

interface IState {
  timeLeft: number;
}

export const Timer = class Timer extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      timeLeft: props.time,
    };
  }

  tickTimer = () => {
    const { timeLeft } = this.state;

    this.setState({
      timeLeft: timeLeft - 1,
    }, () => {
      setTimeout(() => {
        if (timeLeft > 1) {
          this.tickTimer();
        } else {
          const { onTimeUp } = this.props;

          onTimeUp();
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
    setTimeout(() => {
      this.tickTimer();
    }, 1000);
  }

  render() {
    const { timeLeft } = this.state;

    return (<p>{timeLeft}</p>);
  }
}