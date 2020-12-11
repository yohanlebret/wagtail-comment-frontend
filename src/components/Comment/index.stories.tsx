import React from 'react';
import { createStore } from 'redux';

import { Store, reducer } from '../../state';

import {
  RenderCommentsForStorybook,
  addTestComment,
} from '../../utils/storybook';

export default { title: 'Comment' };

export function addNewComment() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'creating',
    focused: true,
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function comment() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'default',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function commentFromSomeoneElse() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'default',
    text: 'An example comment',
    author: {
      id: 2,
      name: 'Someone else',
    },
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function focused() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'default',
    text: 'An example comment',
    focused: true,
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function saving() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'saving',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function saveError() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'save_error',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function deleteConfirm() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'delete_confirm',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function deleting() {
  const store: Store = createStore(reducer);

  addTestComment(store, {
    mode: 'deleting',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}

export function deleteError() {
  const store: Store = createStore(reducer);
  addTestComment(store, {
    mode: 'delete_error',
    text: 'An example comment',
  });

  return <RenderCommentsForStorybook store={store} />;
}
