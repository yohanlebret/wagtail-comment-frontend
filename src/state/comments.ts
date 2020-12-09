import type { Annotation } from '../utils/annotation';
import * as actions from '../actions/comments';

type Partial<T> = {
    [P in keyof T]?: T[P];
};

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
    editPreviousText: string;
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
        remoteId = <number | null>null,
        mode = <CommentReplyMode>'default',
        text = ''
    }: NewReplyOptions
): CommentReply {
    return {
        localId,
        remoteId,
        mode,
        author,
        date,
        text,
        editPreviousText: '',
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
    editPreviousText: string;
    isFocused: boolean;
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
        remoteId = <number | null>null,
        mode = <CommentMode>'default',
        text = '',
        replies = <Map<number, CommentReply>>new Map()
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
        editPreviousText: '',
        isFocused: false,
        deleted: false,
        remoteReplyCount: Array.from(replies.values()).reduce((n, reply) => reply.remoteId !== null ? n + 1 : n, 0)
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
        remoteCommentCount: 0
    };
}

function update<T>(base: T, update: Partial<T>): T {
    return Object.assign({}, base, update);
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
    if (typeof state === 'undefined') {
        state = initialState();
    }

    switch (action.type) {
        case actions.ADD_COMMENT:
            state = cloneComments(state);
            state.comments.set(action.comment.localId, action.comment);
            if (action.comment.remoteId) {
                state.remoteCommentCount += 1;
            }
            break;

        case actions.UPDATE_COMMENT:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            state = cloneComments(state);
            state.comments.set(
                action.commentId,
                update(state.comments.get(action.commentId), action.update)
            );

            break;

        case actions.DELETE_COMMENT:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            state = cloneComments(state);
            if (!state.comments.get(action.commentId).remoteId) {
                // If the comment doesn't exist in the database, there's no need to keep it around locally
                state.comments.delete(action.commentId);
            } else {
                // Otherwise mark it as deleted so we can output this to the form to delete it on the backend too
                state.comments.set(
                    action.commentId,
                    update(state.comments.get(action.commentId), {deleted: true})
                );
            }

            // Unset focusedComment if the focused comment is the one being deleted
            if (state.focusedComment == action.commentId) {
                state.focusedComment = null;
            }
            break;

        case actions.SET_FOCUSED_COMMENT:
            state = cloneComments(state);

            // Unset isFocused on previous focused comment
            if (state.focusedComment) {
                // Unset isFocused on previous focused comment
                state.comments.set(
                    state.focusedComment,
                    update(state.comments.get(state.focusedComment), {
                        isFocused: false
                    })
                );

                state.focusedComment = null;
            }

            // Set isFocused on focused comment
            if (action.commentId && state.comments.has(action.commentId)) {
                state.comments.set(
                    action.commentId,
                    update(state.comments.get(action.commentId), {
                        isFocused: true
                    })
                );

                state.focusedComment = action.commentId;
            }
            break;

        case actions.SET_PINNED_COMMENT:
            state = update(state, {
                pinnedComment: action.commentId
            });
            break;

        case actions.ADD_REPLY:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            state = cloneComments(state);
            const comment = cloneReplies(state.comments.get(action.commentId))
            if (action.reply.remoteId) {
                comment.remoteReplyCount += 1;
            }
            state.comments.set(
                action.commentId,
                comment
            );
            state.comments
                .get(action.commentId)
                .replies.set(action.reply.localId, action.reply);
            break;

        case actions.UPDATE_REPLY:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            if (
                !state.comments
                    .get(action.commentId)
                    .replies.has(action.replyId)
            ) {
                break;
            }
            state = cloneComments(state);
            state.comments.set(
                action.commentId,
                cloneReplies(state.comments.get(action.commentId))
            );
            state.comments
                .get(action.commentId)
                .replies.set(
                    action.replyId,
                    update(
                        state.comments
                            .get(action.commentId)
                            .replies.get(action.replyId),
                        action.update
                    )
                );
            break;

        case actions.DELETE_REPLY:
            if (!state.comments.has(action.commentId)) {
                break;
            }
            if (
                !state.comments
                    .get(action.commentId)
                    .replies.has(action.replyId)
            ) {
                break;
            }
            state = cloneComments(state);
            state.comments.set(
                action.commentId,
                cloneReplies(state.comments.get(action.commentId))
            );
            const reply = state.comments.get(action.commentId).replies.get(action.replyId)
            if (!reply.remoteId) {
                // The reply doesn't exist in the database, so we don't need to store it locally
                state.comments.get(action.commentId).replies.delete(action.replyId);
            } else {
                state.comments
                .get(action.commentId)
                .replies.set(
                    action.replyId,
                    update(
                        reply,
                        {deleted: true}
                    )
                );
            }
            break;
    }

    return state;
}
