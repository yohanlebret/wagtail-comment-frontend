import { Action as CommentsAction } from './comments';
import { Action as SettingsActon } from './settings';

export type Action = CommentsAction | SettingsActon;
