import React from 'react';
import { createStore } from 'redux';

import { Store, reducer } from '../../state';
import { Styling } from '../../utils/storybook';

import TopBarComponent from './index';

import { defaultStrings } from '../../main'

export default { title: 'TopBar' };

function RenderTopBarForStorybook({ store }: { store: Store }) {
    let [state, setState] = React.useState(store.getState());
    store.subscribe(() => {
        setState(store.getState());
    });

    return (
        <>
            <Styling />
            <TopBarComponent store={store} strings={defaultStrings} {...state.settings} />
        </>
    );
}

export function topBar() {
    let store: Store = createStore(reducer);

    return <RenderTopBarForStorybook store={store} />;
}
