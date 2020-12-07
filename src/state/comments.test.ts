import type { Comment, CommentsState, CommentMode, CommentReply, CommentReplyMode } from './comments'
import { reducer } from './comments'
import { createStore } from 'redux';

import * as actions from '../actions/comments';

test('Initial comments state empty', () => {
  const state = createStore(reducer).getState();
  expect(state.focusedComment).toBe(null);
  expect(state.pinnedComment).toBe(null);
  expect(state.comments.size).toBe(0);
});

export const basicCommentsState: CommentsState = {
  focusedComment: 1,
  pinnedComment: 1,
  comments: new Map(
    [
      [1, {
        contentpath: 'test_contentpath',
        localId: 1,
        annotation: null,
        remoteId: 1,
        mode: 'default' as CommentMode,
        deleted: false,
        author: {id: 1, name: "test user"},
        date: 0,
        text: 'test text',
        newReply: '',
        editPreviousText: '',
        replies: new Map(
          [
            [2, {
              localId: 2,
              remoteId: 2,
              mode: 'default' as CommentReplyMode,
              author: {id: 1, name: "test user"},
              date: 0,
              text: 'a reply',
              editPreviousText: '',
              deleted: false,
            } as CommentReply
            ],
            [3, {
              localId: 3,
              remoteId: null,
              mode: 'default' as CommentReplyMode,
              author: {id: 1, name: "test user"},
              date: 0,
              text: 'another reply',
              editPreviousText: '',
              deleted: false,
            } as CommentReply
            ]
          ]
        )
      } as Comment
      ],
      [4, {
        contentpath: 'test_contentpath_2',
        localId: 4,
        annotation: null,
        remoteId: null,
        mode: 'default' as CommentMode,
        deleted: false,
        author: {id: 1, name: "test user"},
        date: 0,
        text: 'unsaved comment',
        newReply: '',
        editPreviousText: '',
        replies: new Map()
      } as Comment
      ]
    ]
  ) 
}

test('New comment added to state', () => {
  const newComment = {
    contentpath: 'test_contentpath',
    localId: 5,
    annotation: null,
    remoteId: null,
    mode: 'default' as CommentMode,
    deleted: false,
    author: {id: 1, name: "test user"},
    date: 0,
    text: 'new comment',
    newReply: '',
    editPreviousText: '',
    replies: new Map()
  } as Comment;
  const commentAction = actions.addComment(newComment);
  const newState = reducer(basicCommentsState, commentAction);
  expect(newState.comments.get(newComment.localId)).toBe(newComment);
});

test('Existing comment updated', () => {
  const commentUpdate = {
    mode: 'editing' as CommentMode
  }
  const updateAction = actions.updateComment(1, commentUpdate);
  const newState = reducer(basicCommentsState, updateAction);
  expect(newState.comments.get(1).mode).toBe('editing');
})

test('Local comment deleted', () => {
  // Test that deleting a comment without a remoteId removes it from the state entirely
  const deleteAction = actions.deleteComment(4);
  const newState = reducer(basicCommentsState, deleteAction);
  expect(newState.comments.has(4)).toBe(false);
})

test('Remote comment deleted', () => {
  // Test that deleting a comment without a remoteId does not remove it from the state, but marks it as deleted
  const deleteAction = actions.deleteComment(1);
  const newState = reducer(basicCommentsState, deleteAction);
  expect(newState.comments.has(1)).toBe(true);
  expect(newState.comments.get(1).deleted).toBe(true);
  expect(newState.focusedComment).toBe(null);
})

test('Comment focused', () => {
  const focusAction = actions.setFocusedComment(4);
  const newState = reducer(basicCommentsState, focusAction);
  expect(newState.focusedComment).toBe(4);
})

test('Reply added', () => {
  const reply = {
    localId: 10,
    remoteId: null,
    mode: 'default' as CommentReplyMode,
    author: {id: 1, name: "test user"},
    date: 0,
    text: 'a new reply',
    editPreviousText: '',
    deleted: false,
  } as CommentReply
  const addAction = actions.addReply(1, reply)
  const newState = reducer(basicCommentsState, addAction);
  expect(newState.comments.get(1).replies.has(10)).toBe(true);
  expect(newState.comments.get(1).replies.get(10)).toBe(reply);
})

test('Reply updated', () => {
  const replyUpdate = {
    mode: 'editing' as CommentReplyMode,
  }
  const updateAction = actions.updateReply(1, 2, replyUpdate)
  const newState = reducer(basicCommentsState, updateAction);
  expect(newState.comments.get(1).replies.get(2).mode).toBe('editing');
})

test('Local reply deleted', () => {
  // Test that the delete action deletes a reply that hasn't yet been saved to the db from the state entirely
  const deleteAction = actions.deleteReply(1, 3)
  const newState = reducer(basicCommentsState, deleteAction);
  expect(newState.comments.get(1).replies.has(3)).toBe(false);
})

test('Remote reply deleted', () => {
  // Test that the delete action deletes a reply that has been saved to the db by marking it as deleted instead
  const deleteAction = actions.deleteReply(1, 2)
  const newState = reducer(basicCommentsState, deleteAction);
  expect(newState.comments.get(1).replies.has(2)).toBe(true);
  expect(newState.comments.get(1).replies.get(2).deleted).toBe(true);
})