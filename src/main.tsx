import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import root from 'react-shadow';

import type { Annotation } from './utils/annotation';
import { LayoutController } from './utils/layout';
import { getNextCommentId, getNextReplyId } from './utils/sequences';
import { Store, reducer } from './state';
import type {
    Comment,
} from './state/comments';
import {
    newCommentReply,
    newComment
} from './state/comments';
import {
    addComment,
    addReply,
    setFocusedComment,
    updateComment,
    setPinnedComment
} from './actions/comments';
import { selectCommentsForContentPathFactory } from './selectors';
import CommentComponent from './components/Comment';
import { CommentFormSetComponent } from './components/Form'
import TopBarComponent from './components/TopBar';

import styles from '!css-to-string-loader!css-loader!sass-loader!./main.scss';

export interface Widget {
    contentpath: string;
    setEnabled(enabled: boolean): void;
    onChangeComments(comments: Comment[]): void;
    getAnnotationForComment(comment: Comment): Annotation;
    onRegister(makeComment: (annotation: Annotation, contentpath: string) => void): void
}

export interface TranslatableStrings {
    SAVE: string;
    SAVING: string;
    CANCEL: string;
    DELETE: string;
    DELETING: string;
    SHOW_COMMENTS: string;
    EDIT: string;
    REPLY: string;
    RESOLVE: string;
    RETRY: string;
    DELETE_ERROR: string;
    CONFIRM_DELETE_COMMENT: string;
    SAVE_ERROR: string;
}

export const defaultStrings = {
    SAVE: 'Save',
    SAVING: 'Saving...',
    CANCEL: 'Cancel',
    DELETE: 'Delete',
    DELETING: 'Deleting...',
    SHOW_COMMENTS: 'Show comments',
    EDIT: 'Edit',
    REPLY: 'Reply',
    RESOLVE: 'Resolve',
    RETRY: 'Retry',
    DELETE_ERROR: 'Delete error',
    CONFIRM_DELETE_COMMENT: 'Are you sure?',
    SAVE_ERROR: 'Save error'
}

export interface InitialCommentReply {
    pk: number;
    user: any;
    text: string;
    created_at: string;
    updated_at: string;
}


export interface InitialComment {
    pk: number;
    user: any;
    text: string;
    created_at: string;
    updated_at: string;
    replies: InitialCommentReply[];
    contentpath: string;
}

function renderCommentsUi(
    store: Store,
    layout: LayoutController,
    comments: Comment[],
    strings: TranslatableStrings
): React.ReactElement {
    let {
        commentsEnabled,
        user
    } = store.getState().settings;
    let commentsToRender = comments;

    if (!commentsEnabled || !user) {
        commentsToRender = [];
    }
    // Hide all resolved/deleted comments
    commentsToRender = commentsToRender.filter(({ deleted }) => !deleted);
    let commentsRendered = commentsToRender.map(comment => (
        <CommentComponent
            key={comment.localId}
            store={store}
            layout={layout}
            user={user}
            comment={comment}
            strings={strings}
        />
    ));

    return (
        <root.div>
            <link
                href="https://fonts.googleapis.com/css?family=Open+Sans&amp;display=swap"
                rel="stylesheet"
            />
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <TopBarComponent store={store} strings={strings} />
            <ol className="comments-list">{commentsRendered}</ol>
        </root.div>
    );
}

export function initCommentsApp(
    element: HTMLElement,
    outputElement: HTMLElement,
    userId: any,
    initialComments: InitialComment[],
    authors: Map<string, string>,
    strings: TranslatableStrings | null
) {
    let focusedComment: number | null = null;
    let pinnedComment: number | null = null;
    const user = {
        id: userId,
        name: authors.get(String(userId))
    }

    let store: Store = createStore(reducer, {settings: {
        user: user,
        commentsEnabled: true,
    }});
    let layout = new LayoutController();

    if (!strings) {
        strings = defaultStrings;
    }


    // Check if there is "comment" query parameter.
    // If this is set, the user has clicked on a "View on frontend" link of an
    // individual comment. We should focus this comment and scroll to it
    let urlParams = new URLSearchParams(window.location.search);
    let initialFocusedCommentId: number | null = null;
    if (urlParams.has('comment')) {
        initialFocusedCommentId = parseInt(urlParams.get('comment'));
    }

    let render = () => {
        const state = store.getState();
        const commentList: Comment[] = Array.from(
            state.comments.comments.values()
        );

        ReactDOM.render(<CommentFormSetComponent comments={commentList} remoteCommentCount={state.comments.remoteCommentCount} />, outputElement);

        // Check if the focused comment has changed
        if (state.comments.focusedComment != focusedComment) {
            // Unfocus previously focused annotation
            if (focusedComment) {
                // Note: the comment may have just been deleted. In that case,
                // don't worry about unfocusing the annotation as that will be
                // deleted
                if (state.comments.comments.has(focusedComment)) {
                    const annotation = state.comments.comments.get(
                        focusedComment
                    ).annotation;

                    if (annotation) {
                        annotation.onUnfocus();
                    }
                }
            }

            // Focus the new focused annotation
            if (state.comments.focusedComment) {
                const annotation = state.comments.comments.get(
                    state.comments.focusedComment
                ).annotation;

                if (annotation) {
                    annotation.onFocus();
                }
            }

            focusedComment = state.comments.focusedComment;
        }

        // Check if the pinned comment has changed
        if (state.comments.pinnedComment != pinnedComment) {
            // Tell layout controller about the pinned comment
            // so it is moved alongside its annotation
            layout.setPinnedComment(state.comments.pinnedComment);

            pinnedComment = state.comments.pinnedComment;
        }

        ReactDOM.render(
            renderCommentsUi(
                store,
                layout,
                commentList,
                strings
            ),
            element,
            () => {
                // Render again if layout has changed (eg, a comment was added, deleted or resized)
                // This will just update the "top" style attributes in the comments to get them to move
                if (layout.refresh()) {
                    ReactDOM.render(
                        renderCommentsUi(
                            store,
                            layout,
                            commentList,
                            strings
                        ),
                        element
                    );
                }
            }
        );
    };

    // Fetch existing comments
    for (let comment of initialComments) {

        let commentId = getNextCommentId();

        // Create comment
        store.dispatch(
            addComment(
                newComment(
                    comment.contentpath,
                    commentId,
                    null,
                    {id: comment.user, name: authors.get(String(comment.user))},
                    Date.parse(comment.created_at),
                    {
                        remoteId: comment.pk,
                        text: comment.text
                    }
                )
            )
        );

        // Create replies
        for (let reply of comment.replies) {
            store.dispatch(
                addReply(
                    commentId,
                    newCommentReply(
                        getNextReplyId(),
                        {id: reply.user, name: authors.get(String(reply.user))},
                        Date.parse(reply.created_at),
                        { remoteId: reply.pk, text: reply.text }
                    )
                )
            );
        }

        // If this is the initial focused comment. Focus and pin it
        // TODO: Scroll to this comment
        if (
            initialFocusedCommentId &&
            comment.pk == initialFocusedCommentId
        ) {
            store.dispatch(setFocusedComment(commentId));
            store.dispatch(setPinnedComment(commentId));
        }
    }

    let attachAnnotationLayout = (annotation: Annotation, commentId: number) => {
        // Attach an annotation to an existing comment in the layout

        // Focus and pin comment when annotation is clicked
        annotation.setOnClickHandler(() => {
            store.dispatch(setFocusedComment(commentId));
            store.dispatch(setPinnedComment(commentId));
        });

        // Let layout engine know the annotation so it would position the comment correctly
        layout.setCommentAnnotation(commentId, annotation);
    };

    let makeComment = (annotation: Annotation, contentpath: string) => {
        let commentId = getNextCommentId();

        attachAnnotationLayout(annotation, commentId);

        // Create the comment
        store.dispatch(
            addComment(
                newComment(contentpath, commentId, annotation, store.getState().settings.user, Date.now(), {
                    mode: 'creating'
                })
            )
        );
    

        // Focus and pin the comment
        store.dispatch(setFocusedComment(commentId));
        store.dispatch(setPinnedComment(commentId));
    };

    let registerWidget = (widget: Widget) => {
        let state = store.getState()
        let currentlyEnabled = state.settings.commentsEnabled;
        widget.setEnabled(currentlyEnabled);
        let unsubscribeWidgetEnable = store.subscribe(() => {
            let previouslyEnabled = currentlyEnabled;
            currentlyEnabled = store.getState().settings.commentsEnabled;
            if (previouslyEnabled !== currentlyEnabled) {
                widget.setEnabled(currentlyEnabled);
            }
        })
        const selectCommentsForContentPath = selectCommentsForContentPathFactory(widget.contentpath)
        let currentComments = selectCommentsForContentPath(state);
        let unsubscribeWidgetComments = store.subscribe(() => {
            let previousComments = currentComments;
            currentComments = selectCommentsForContentPath(store.getState());
            if (previousComments !== currentComments) {
                widget.onChangeComments(currentComments);
            }
        })
        state.comments.comments.forEach((comment) => {
            if (comment.contentpath == widget.contentpath) {
                const annotation = widget.getAnnotationForComment(comment);
                attachAnnotationLayout(annotation, comment.localId);
                store.dispatch(
                    updateComment(
                        comment.localId, {annotation: annotation}
                    )
                );
            }
        })

        widget.onRegister(makeComment);

        return {unsubscribeWidgetEnable, unsubscribeWidgetComments}
    }

    render();

    store.subscribe(render);

    // Unfocus when document body is clicked
    document.body.addEventListener('click', e => {
        if (e.target instanceof HTMLElement) {
            // ignore if click target is a comment or an annotation
            if (
                !e.target.closest('#comments, [data-annotation]')
            ) {
                // Running store.dispatch directly here seems to prevent the event from being handled anywhere else
                setTimeout(() => {
                    store.dispatch(setFocusedComment(null));
                    store.dispatch(setPinnedComment(null));
                }, 1);
            }
        }
    });

    return {makeComment, registerWidget}
}

