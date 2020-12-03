import { combineReducers } from 'redux';
import type { Store as reduxStore } from 'redux';

import { reducer as commentsReducer } from './comments';
import { reducer as settingsReducer } from './settings';
import type { Action } from '../actions';

export type State = ReturnType<typeof reducer>

export let reducer = combineReducers({
    comments: commentsReducer,
    settings: settingsReducer,
});

export type Store = reduxStore<State, Action>;