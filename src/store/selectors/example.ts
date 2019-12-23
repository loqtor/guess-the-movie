import { RootState } from "../reducers";

export const getClickCount = (state: RootState) => {
  return state.example.clickCount;
};