import React from 'react';

import type { Store } from '../../state';
import { updateGlobalSettings } from '../../actions/settings';

import Checkbox from '../widgets/Checkbox';
import type { TranslatableStrings } from '../../main';

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

        let {
            commentsEnabled,
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
                </ul>
            </div>
        );
    }
}
