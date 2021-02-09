import type { Annotation } from '../utils/annotation';
import * as actions from '../actions/comments';
import { update } from './utils';

export interface Author {
  id: any;
  name: string;
}

export type CommentReplyMode =
  | 'default'
  | 'editing'
  | 'saving'
  | 'delete_confirm'
  | 'deleting'
  | 'deleted'
  | 'save_error'
  | 'delete_error';

export interface CommentReply {
  localId: number;
  remoteId: number | null;
  mode: CommentReplyMode;
  author: Author | null;
  date: number;
  text: string;
  newText: string;
  deleted: boolean;
}

export interface NewReplyOptions {
  remoteId?: number | null;
  mode?: CommentReplyMode;
  text?: string;
}

export function newCommentReply(
  localId: number,
  author: Author | null,
  date: number,
  {
    remoteId = null,
    mode = 'default',
    text = '',
  }: NewReplyOptions
): CommentReply {
  return {
    localId,
    remoteId,
    mode,
    author,
    date,
    text,
    newText: '',
    deleted: false,
  };
}

export type CommentReplyUpdate = Partial<CommentReply>;

export type CommentMode =
  | 'default'
  | 'creating'
  | 'editing'
  | 'saving'
  | 'delete_confirm'
  | 'deleting'
  | 'deleted'
  | 'save_error'
  | 'delete_error';

export interface Comment {
  contentpath: string;
  localId: number;
  annotation: Annotation | null;
  remoteId: number | null;
  mode: CommentMode;
  deleted: boolean;
  author: Author | null;
  date: number | null;
  text: string;
  replies: Map<number, CommentReply>;
  newReply: string;
  newText: string;
  remoteReplyCount: number;
}

export interface NewCommentOptions {
  remoteId?: number | null;
  mode?: CommentMode;
  text?: string;
  replies?: Map<number, CommentReply>;
}

export function newComment(
  contentpath: string,
  localId: number,
  annotation: Annotation | null,
  author: Author | null,
  date: number,
  {
    remoteId = null,
    mode = 'default',
    text = '',
    replies = new Map(),
  }: NewCommentOptions
): Comment {
  return {
    contentpath,
    localId,
    annotation,
    remoteId,
    mode,
    author,
    date,
    text,
    replies,
    newReply: '',
    newText: '',
    deleted: false,
    remoteReplyCount: Array.from(replies.values()).reduce(
      (n, reply) => (reply.remoteId !== null ? n + 1 : n),
      0
    ),
  };
}

export type CommentUpdate = Partial<Comment>;

export interface CommentsState {
  comments: Map<number, Comment>;
  focusedComment: number | null;
  pinnedComment: number | null;
  remoteCommentCount: number; // This is redundant, but stored for efficiency as it will change only as the app adds its loaded comments
}

function initialState(): CommentsState {
  return {
    comments: new Map(),
    focusedComment: null,
    pinnedComment: null,
    remoteCommentCount: 0,
  };
}

function cloneComments(state: CommentsState): CommentsState {
  // Returns a new state with the comments list cloned
  return update(state, { comments: new Map(state.comments.entries()) });
}

function cloneReplies(comment: Comment): Comment {
  // Returns a new comment with the replies list cloned
  return update(comment, { replies: new Map(comment.replies.entries()) });
}

export function reducer(
  state: CommentsState | undefined,
  action: actions.Action
) {
  let newState = state;
  if (typeof newState === 'undefined') {
    newState = initialState();
  }

  switch (action.type) {
  case actions.ADD_COMMENT:
    newState = cloneComments(newState);
    newState.comments.set(action.comment.localId, action.comment);
    if (action.comment.remoteId) {
      newState.remoteCommentCount += 1;
    }
    break;

  case actions.UPDATE_COMMENT:
    if (!newState.comments.has(action.commentId)) {
      break;
    }
    newState = cloneComments(newState);
    newState.comments.set(
      action.commentId,
      update(newState.comments.get(action.commentId), action.update)
    );

    break;

  case actions.DELETE_COMMENT:
    if (!newState.comments.has(action.commentId)) {
      break;
    }
    newState = cloneComments(newState);
    if (!newState.comments.get(action.commentId).remoteId) {
      // If the comment doesn't exist in the database, there's no need to keep it around locally
      newState.comments.delete(action.commentId);
    } else {
      // Otherwise mark it as deleted so we can output this to the form to delete it on the backend too
      newState.comments.set(
        action.commentId,
        update(newState.comments.get(action.commentId), { deleted: true })
      );
    }

    // Unset focusedComment if the focused comment is the one being deleted
    if (state.focusedComment === action.commentId) {
      newState.focusedComment = null;
    }
    break;

  case actions.SET_FOCUSED_COMMENT:
    newState = cloneComments(newState);
    newState.focusedComment = action.commentId;
    break;

  case actions.SET_PINNED_COMMENT:
    newState = update(newState, {
      pinnedComment: action.commentId,
    });
    break;

  case actions.ADD_REPLY: {
    if (!newState.comments.has(action.commentId)) {
      break;
    }
    newState = cloneComments(newState);
    const comment = cloneReplies(newState.comments.get(action.commentId));
    if (action.reply.remoteId) {
      comment.remoteReplyCount += 1;
    }
    newState.comments.set(action.commentId, comment);
    newState.comments
      .get(action.commentId)
      .replies.set(action.reply.localId, action.reply);
    break;
  }
  case actions.UPDATE_REPLY:
    if (!newState.comments.has(action.commentId)) {
      break;
    }
    if (
      !newState.comments.get(action.commentId).replies.has(action.replyId)
    ) {
      break;
    }
    newState = cloneComments(newState);
    newState.comments.set(
      action.commentId,
      cloneReplies(newState.comments.get(action.commentId))
    );
    newState.comments
      .get(action.commentId)
      .replies.set(
        action.replyId,
        update(
          newState.comments.get(action.commentId).replies.get(action.replyId),
          action.update
        )
      );
    break;

  case actions.DELETE_REPLY: {
    if (!newState.comments.has(action.commentId)) {
      break;
    }
    if (
      !newState.comments.get(action.commentId).replies.has(action.replyId)
    ) {
      break;
    }
    newState = cloneComments(newState);
    newState.comments.set(
      action.commentId,
      cloneReplies(newState.comments.get(action.commentId))
    );
    const reply = newState.comments
      .get(action.commentId)
      .replies.get(action.replyId);
    if (!reply.remoteId) {
      // The reply doesn't exist in the database, so we don't need to store it locally
      newState.comments.get(action.commentId).replies.delete(action.replyId);
    } else {
      newState.comments
        .get(action.commentId)
        .replies.set(action.replyId, update(reply, { deleted: true }));
    }
    break;
  }
  default:
    // Do nothing (linting wants an explicit default)
  }

  return newState;
}
