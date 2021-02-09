import * as actions from '../actions/settings';
import type { Author } from './comments';
import { update } from './utils';

export interface SettingsState {
  user: Author | null;
  commentsEnabled: boolean;
  showResolvedComments: boolean;
}

export type SettingsStateUpdate = Partial<SettingsState>;

export function initialState(): SettingsState {
  return {
    user: null,
    commentsEnabled: true,
    showResolvedComments: false,
  };
}

export function reducer(
  state: SettingsState | undefined,
  action: actions.Action
) {
  let newState = state;
  if (typeof state === 'undefined') {
    newState = initialState();
  }

  switch (action.type) {
  case actions.UPDATE_GLOBAL_SETTINGS:
    newState = update(state, action.update);
    break;

  default:
    // Do nothing (linting wants this to be explicit)
  }

  return newState;
}
