import * as React from 'react';
import * as Redux from 'redux';

import { connect } from "react-redux";

import { getClickCount } from "../store/selectors/example";
import { countClick } from "../store/actions/example";

import { Link } from 'react-router-dom';
import { RootState } from '../store/reducers';

export interface OwnProps {}

interface StateProps {
  clickCount: number;
}
     
interface DispatchProps {
  countClick: () => void
}
 
type Props = StateProps & DispatchProps & OwnProps;

class ExampleComponent extends React.Component<Props, {}> {
  render() {
    const { clickCount, countClick } = this.props;

    return (
      <>
        <h1>This is an example extra route.</h1>
        <p>{clickCount} times clicked.</p>
        <button onClick={countClick}>Click to count!</button>
        <Link to="/">Back to home</Link>
      </>
    )
  }
}
 
function mapStateToProps(state: RootState): StateProps {
  return {
    clickCount: getClickCount(state),
  };
}
 
function mapDispatchToProps(dispatch: Redux.Dispatch<any>): DispatchProps {
  return {
    countClick: () => {
      return dispatch(countClick())
    },
  };
}
  
export const Example = connect<StateProps, any, Props, any>
  (mapStateToProps, mapDispatchToProps)(ExampleComponent)