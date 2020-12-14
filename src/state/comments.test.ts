import { basicCommentsState } from '../__fixtures__/state';
import {
  Comment,
  CommentReply,
  CommentReplyUpdate,
  CommentUpdate,
  reducer,
} from './comments';
import { createStore } from 'redux';

import * as actions from '../actions/comments';

test('Initial comments state empty', () => {
  const state = createStore(reducer).getState();
  expect(state.focusedComment).toBe(null);
  expect(state.pinnedComment).toBe(null);
  expect(state.comments.size).toBe(0);
  expect(state.remoteCommentCount).toBe(0);
});

test('New comment added to state', () => {
  const newComment: Comment = {
    contentpath: 'test_contentpath',
    localId: 5,
    annotation: null,
    remoteId: null,
    mode: 'default',
    deleted: false,
    author: { id: 1, name: 'test user' },
    date: 0,
    text: 'new comment',
    newReply: '',
    newText: '',
    remoteReplyCount: 0,
    replies: new Map(),
  };
  const commentAction = actions.addComment(newComment);
  const newState = reducer(basicCommentsState, commentAction);
  expect(newState.comments.get(newComment.localId)).toBe(newComment);
  expect(newState.remoteCommentCount).toBe(
    basicCommentsState.remoteCommentCount
  );
});

test('Remote comment added to state', () => {
  const newComment: Comment = {
    contentpath: 'test_contentpath',
    localId: 5,
    annotation: null,
    remoteId: 10,
    mode: 'default',
    deleted: false,
    author: { id: 1, name: 'test user' },
    date: 0,
    text: 'new comment',
    newReply: '',
    newText: '',
    remoteReplyCount: 0,
    replies: new Map(),
  };
  const commentAction = actions.addComment(newComment);
  const newState = reducer(basicCommentsState, commentAction);
  expect(newState.comments.get(newComment.localId)).toBe(newComment);
  expect(newState.remoteCommentCount).toBe(
    basicCommentsState.remoteCommentCount + 1
  );
});

test('Existing comment updated', () => {
  const commentUpdate: CommentUpdate = {
    mode: 'editing',
  };
  const updateAction = actions.updateComment(1, commentUpdate);
  const newState = reducer(basicCommentsState, updateAction);
  expect(newState.comments.get(1).mode).toBe('editing');
});

test('Local comment deleted', () => {
  // Test that deleting a comment without a remoteId removes it from the state entirely
  const deleteAction = actions.deleteComment(4);
  const newState = reducer(basicCommentsState, deleteAction);
  expect(newState.comments.has(4)).toBe(false);
});

test('Remote comment deleted', () => {
  // Test that deleting a comment without a remoteId does not remove it from the state, but marks it as deleted
  const deleteAction = actions.deleteComment(1);
  const newState = reducer(basicCommentsState, deleteAction);
  expect(newState.comments.has(1)).toBe(true);
  expect(newState.comments.get(1).deleted).toBe(true);
  expect(newState.focusedComment).toBe(null);
  expect(newState.remoteCommentCount).toBe(
    basicCommentsState.remoteCommentCount
  );
});

test('Comment focused', () => {
  const focusAction = actions.setFocusedComment(4);
  const newState = reducer(basicCommentsState, focusAction);
  expect(newState.focusedComment).toBe(4);
});

test('Reply added', () => {
  const reply: CommentReply = {
    localId: 10,
    remoteId: null,
    mode: 'default',
    author: { id: 1, name: 'test user' },
    date: 0,
    text: 'a new reply',
    newText: '',
    deleted: false,
  };
  const addAction = actions.addReply(1, reply);
  const newState = reducer(basicCommentsState, addAction);
  expect(newState.comments.get(1).replies.has(10)).toBe(true);
  expect(newState.comments.get(1).replies.get(10)).toBe(reply);
});

test('Remote reply added', () => {
  const reply: CommentReply = {
    localId: 10,
    remoteId: 1,
    mode: 'default',
    author: { id: 1, name: 'test user' },
    date: 0,
    text: 'a new reply',
    newText: '',
    deleted: false,
  };
  const addAction = actions.addReply(1, reply);
  const newState = reducer(basicCommentsState, addAction);
  expect(newState.comments.get(1).replies.has(10)).toBe(true);
  expect(newState.comments.get(1).replies.get(10)).toBe(reply);
  expect(newState.comments.get(1).remoteReplyCount).toBe(
    basicCommentsState.comments.get(1).remoteReplyCount + 1
  );
});

test('Reply updated', () => {
  const replyUpdate: CommentReplyUpdate = {
    mode: 'editing',
  };
  const updateAction = actions.updateReply(1, 2, replyUpdate);
  const newState = reducer(basicCommentsState, updateAction);
  expect(newState.comments.get(1).replies.get(2).mode).toBe('editing');
});

test('Local reply deleted', () => {
  // Test that the delete action deletes a reply that hasn't yet been saved to the db from the state entirely
  const deleteAction = actions.deleteReply(1, 3);
  const newState = reducer(basicCommentsState, deleteAction);
  expect(newState.comments.get(1).replies.has(3)).toBe(false);
});

test('Remote reply deleted', () => {
  // Test that the delete action deletes a reply that has been saved to the db by marking it as deleted instead
  const deleteAction = actions.deleteReply(1, 2);
  const newState = reducer(basicCommentsState, deleteAction);
  expect(newState.comments.get(1).replies.has(2)).toBe(true);
  expect(newState.comments.get(1).replies.get(2).deleted).toBe(true);
  expect(newState.comments.get(1).remoteReplyCount).toBe(
    basicCommentsState.comments.get(1).remoteReplyCount
  );
});
