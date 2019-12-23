import { EXAMPLE_TYPES } from "../actions/example";

export type ExampleState = {
  clickCount: number;
}

const initialState: ExampleState = {
  clickCount: 0,
};

export const example = (state = initialState, action: { payload: any, type: any}) => {
  switch (action.type) {
    case EXAMPLE_TYPES.COUNT_CLICK: 
      return {
        ...state,
        clickCount: state.clickCount + 1,
      };

    default:
      return state;
  }
};  