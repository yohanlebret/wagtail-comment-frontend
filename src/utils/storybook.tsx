import React from 'react';

import { Store } from '../state';
import {
  addComment,
  setFocusedComment,
  setPinnedComment,
  addReply,
} from '../actions/comments';
import {
  Author,
  Comment,
  NewCommentOptions,
  newComment,
  newCommentReply,
  NewReplyOptions,
} from '../state/comments';
import { LayoutController } from '../utils/layout';
import { getNextCommentId } from './sequences';
import { defaultStrings } from '../main';

import styles from '!css-to-string-loader!css-loader!sass-loader!./../main.scss';
import CommentComponent from '../components/Comment/index';

export function Styling() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css?family=Open+Sans&amp;display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: styles }} />
    </>
  );
}

export function RenderCommentsForStorybook({
  store,
  author,
}: {
  store: Store;
  author?: Author;
}) {
  const [state, setState] = React.useState(store.getState());
  store.subscribe(() => {
    setState(store.getState());
  });

  const layout = new LayoutController();

  if (!author) {
    author = {
      id: 1,
      name: 'Admin',
    };
  }

  const commentsToRender: Comment[] = Array.from(
    state.comments.comments.values()
  );

  const commentsRendered = commentsToRender.map((comment) => (
    <CommentComponent
      key={comment.localId}
      store={store}
      layout={layout}
      user={author}
      comment={comment}
      isFocused={comment.localId === state.comments.focusedComment}
      strings={defaultStrings}
    />
  ));

  return (
    <>
      <Styling />
      <ol className="comments-list">{commentsRendered}</ol>
    </>
  );
}

interface AddTestCommentOptions extends NewCommentOptions {
  focused?: boolean;
  author?: Author;
}

export function addTestComment(
  store: Store,
  options: AddTestCommentOptions
): number {
  const commentId = getNextCommentId();

  const author = options.author || {
    id: 1,
    name: 'Admin',
  };

  // We must have a remoteId unless the comment is being created
  if (options.mode !== 'creating' && options.remoteId === undefined) {
    options.remoteId = commentId;
  }

  // Comment must be focused if the mode is anything other than default
  if (options.mode !== 'default' && options.focused === undefined) {
    options.focused = true;
  }

  store.dispatch(
    addComment(newComment('test', commentId, null, author, Date.now(), options))
  );

  if (options.focused) {
    store.dispatch(setFocusedComment(commentId));
    store.dispatch(setPinnedComment(commentId));
  }

  return commentId;
}

interface AddTestReplyOptions extends NewReplyOptions {
  focused?: boolean;
  author?: Author;
}

export function addTestReply(
  store: Store,
  commentId: number,
  options: AddTestReplyOptions
) {
  const author = options.author || {
    id: 1,
    name: 'Admin',
  };

  if (!options.remoteId) {
    options.remoteId = 1;
  }

  store.dispatch(
    addReply(commentId, newCommentReply(1, author, Date.now(), options))
  );
}
