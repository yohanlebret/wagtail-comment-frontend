import * as React from 'react';

import { Store } from '../../state';
import { updateGlobalSettings } from '../../actions/settings';

import Checkbox from '../widgets/Checkbox';
import { TranslatableStrings } from '../../main';

export interface TopBarProps {
    store: Store;
    strings: TranslatableStrings;
}

export default class TopBarComponent extends React.Component<TopBarProps> {
    render() {
        let { store, strings } = this.props;

        let onChangeCommentsEnabled = (checked: boolean) => {
            store.dispatch(
                updateGlobalSettings({
                    commentsEnabled: checked
                })
            );
        };

        let onChangeShowResolvedComments = (checked: boolean) => {
            store.dispatch(
                updateGlobalSettings({
                    showResolvedComments: checked
                })
            );
        };

        let {
            commentsEnabled,
            showResolvedComments
        } = store.getState().settings;

        return (
            <div className="comments-topbar">
                <ul className="comments-topbar__settings">
                    <li>
                        <Checkbox
                            id="show-comments"
                            label={strings.SHOW_COMMENTS}
                            onChange={onChangeCommentsEnabled}
                            checked={commentsEnabled}
                        />
                    </li>
                    <li>
                        <Checkbox
                            id="show-resolved-comments"
                            label={strings.SHOW_RESOLVED_COMMENTS}
                            onChange={onChangeShowResolvedComments}
                            checked={showResolvedComments}
                        />
                    </li>
                </ul>
            </div>
        );
    }
}
