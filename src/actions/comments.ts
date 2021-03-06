import type {
    Comment,
    CommentUpdate,
    CommentReply,
    CommentReplyUpdate
} from '../state/comments';

export const ADD_COMMENT = 'add-comment';
export const UPDATE_COMMENT = 'update-comment';
export const DELETE_COMMENT = 'delete-comment';
export const SET_FOCUSED_COMMENT = 'set-focused-comment';
export const SET_PINNED_COMMENT = 'set-pinned-comment';

export const ADD_REPLY = 'add-reply';
export const UPDATE_REPLY = 'update-reply';
export const DELETE_REPLY = 'delete-reply';

export interface AddCommentAction {
    type: typeof ADD_COMMENT;
    comment: Comment;
}

export interface UpdateCommentAction {
    type: typeof UPDATE_COMMENT;
    commentId: number;
    update: CommentUpdate;
}

export interface DeleteCommentAction {
    type: typeof DELETE_COMMENT;
    commentId: number;
}

export interface SetFocusedCommentAction {
    type: typeof SET_FOCUSED_COMMENT;
    commentId: number | null;
}

export interface SetPinnedCommentAction {
    type: typeof SET_PINNED_COMMENT;
    commentId: number | null;
}

export interface AddReplyAction {
    type: typeof ADD_REPLY;
    commentId: number;
    reply: CommentReply;
}

export interface UpdateReplyAction {
    type: typeof UPDATE_REPLY;
    commentId: number;
    replyId: number;
    update: CommentReplyUpdate;
}

export interface DeleteReplyAction {
    type: typeof DELETE_REPLY;
    commentId: number;
    replyId: number;
}

export type Action =
    | AddCommentAction
    | UpdateCommentAction
    | DeleteCommentAction
    | SetFocusedCommentAction
    | SetPinnedCommentAction
    | AddReplyAction
    | UpdateReplyAction
    | DeleteReplyAction;

export function addComment(comment: Comment): AddCommentAction {
    return {
        type: ADD_COMMENT,
        comment
    };
}

export function updateComment(
    commentId: number,
    update: CommentUpdate
): UpdateCommentAction {
    return {
        type: UPDATE_COMMENT,
        commentId,
        update
    };
}

export function deleteComment(commentId: number): DeleteCommentAction {
    return {
        type: DELETE_COMMENT,
        commentId
    };
}

export function setFocusedComment(
    commentId: number | null
): SetFocusedCommentAction {
    return {
        type: SET_FOCUSED_COMMENT,
        commentId
    };
}

export function setPinnedComment(
    commentId: number | null
): SetPinnedCommentAction {
    return {
        type: SET_PINNED_COMMENT,
        commentId
    };
}

export function addReply(
    commentId: number,
    reply: CommentReply
): AddReplyAction {
    return {
        type: ADD_REPLY,
        commentId,
        reply
    };
}

export function updateReply(
    commentId: number,
    replyId: number,
    update: CommentReplyUpdate
): UpdateReplyAction {
    return {
        type: UPDATE_REPLY,
        commentId,
        replyId,
        update
    };
}

export function deleteReply(
    commentId: number,
    replyId: number
): DeleteReplyAction {
    return {
        type: DELETE_REPLY,
        commentId,
        replyId
    };
}
