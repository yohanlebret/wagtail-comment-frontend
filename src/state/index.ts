import { combineReducers, Store } from 'redux';

import { reducer as commentsReducer, CommentsState } from './comments';
import { reducer as settingsReducer, SettingsState } from './settings';
import { Action } from '../actions';

export interface State {
    comments: CommentsState;
    settings: SettingsState;
}

export let reducer = combineReducers({
    comments: commentsReducer,
    settings: settingsReducer,
});

export type Store = Store<State, Action>;
