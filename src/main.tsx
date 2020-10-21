import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createStore } from 'redux';
import root from 'react-shadow';

import { Annotation, AnnotatableSection } from './utils/annotation';
import { LayoutController } from './utils/layout';
import { getNextCommentId, getNextReplyId } from './utils/sequences';
import { Store, reducer } from './state';
import {
    Author,
    Comment,
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
import CommentComponent from './components/Comment';
import TopBarComponent from './components/TopBar';

import * as styles from '!css-to-string-loader!css-loader!sass-loader!./main.scss';


export interface InitialCommentReply {
    id: number;
    author: Author;
    text: string;
    created_at: string;
    updated_at: string;
}


export interface InitialComment {
    id: number;
    author: Author;
    quote: string;
    text: string;
    created_at: string;
    updated_at: string;
    resolved_at: string;
    replies: InitialCommentReply[];
    content_path: string;
    start_xpath: string;
    start_offset: number;
    end_xpath: string;
    end_offset: number;
}

function renderCommentsUi(
    store: Store,
    layout: LayoutController,
    comments: Comment[],
): React.ReactElement {
    let {
        commentsEnabled,
        showResolvedComments,
        user
    } = store.getState().settings;
    let commentsToRender = comments;

    if (!commentsEnabled || !user) {
        commentsToRender = [];
    } else if (!showResolvedComments) {
        // Hide all resolved comments unless they were resolved this session
        commentsToRender = commentsToRender.filter(comment => {
            return !(
                comment.resolvedAt !== null && !comment.resolvedThisSession
            );
        });
    }
    let commentsRendered = commentsToRender.map(comment => (
        <CommentComponent
            key={comment.localId}
            store={store}
            layout={layout}
            user={user}
            comment={comment}
        />
    ));

    return (
        <root.div>
            <link
                href="https://fonts.googleapis.com/css?family=Open+Sans&amp;display=swap"
                rel="stylesheet"
            />
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <TopBarComponent store={store} />
            <ol className="comments-list">{commentsRendered}</ol>
        </root.div>
    );
}

export function initCommentsApp(
    element: HTMLElement,
    author: Author,
    initialComments: InitialComment[],
    addAnnotatableSections: (
        addAnnotatableSection: (
            contentPath: string,
            element: HTMLElement
        ) => void
    ) => void,
) {
    let annotatableSections: { [contentPath: string]: AnnotatableSection } = {};
    let focusedComment: number | null = null;
    let pinnedComment: number | null = null;

    let store: Store = createStore(reducer, {settings: {
        user: author,
        commentsEnabled: true,
        showResolvedComments: false
    }});
    let layout = new LayoutController();


    // Check if there is "comment" query parameter.
    // If this is set, the user has clicked on a "View on frontend" link of an
    // individual comment. We should focus this comment and scroll to it
    let urlParams = new URLSearchParams(window.location.search);
    let initialFocusedCommentId: number | null = null;
    if (urlParams.has('comment')) {
        initialFocusedCommentId = parseInt(urlParams.get('comment'));
    }

    let render = () => {
        let state = store.getState();
        let commentList: Comment[] = Array.from(
            state.comments.comments.values()
        );

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
            // so it is moved alongside it's annotation
            layout.setPinnedComment(state.comments.pinnedComment);

            pinnedComment = state.comments.pinnedComment;
        }

        ReactDOM.render(
            renderCommentsUi(
                store,
                layout,
                commentList,
            ),
            element,
            () => {
                // Render again if layout has changed (eg, a comment was added, deleted or resized)
                // This will just update the "top" style attributes in the comments to get them to move
                if (layout.isDirty) {
                    layout.refresh();

                    ReactDOM.render(
                        renderCommentsUi(
                            store,
                            layout,
                            commentList,
                        ),
                        element
                    );
                }
            }
        );
    };

    render();

    store.subscribe(render);

    let makeNewComment = (annotation: Annotation) => {
        let commentId = getNextCommentId();

        // Focus and pin comment when annotation is clicked
        annotation.setOnClickHandler(() => {
            store.dispatch(setFocusedComment(commentId));
            store.dispatch(setPinnedComment(commentId));
        });

        // Let layout engine know the annotation so it would position the comment correctly
        layout.setCommentAnnotation(commentId, annotation);

        // Create the comment
        store.dispatch(
            addComment(
                newComment(commentId, annotation, store.getState().settings.user, Date.now(), {
                    mode: 'creating'
                })
            )
        );

        // Focus and pin the comment
        store.dispatch(setFocusedComment(commentId));
        store.dispatch(setPinnedComment(commentId));
    };

    let selectionEnabled = () => {
        return store.getState().settings.commentsEnabled;
    };

    addAnnotatableSections((contentPath, element) => {
        annotatableSections[contentPath] = new AnnotatableSection(
            contentPath,
            element,
            makeNewComment,
            selectionEnabled
        );
    });

    // Fetch existing comments
    for (let comment of initialComments) {
        let section = annotatableSections[comment.content_path];
        if (!section) {
            continue;
        }

        // Create annotation
        let annotation = section.addAnnotation({
            quote: comment.quote,
            ranges: [
                {
                    start: comment.start_xpath,
                    startOffset: comment.start_offset,
                    end: comment.end_xpath,
                    endOffset: comment.end_offset
                }
            ]
        });

        let commentId = getNextCommentId();

        // Focus and pin comment when annotation is clicked
        annotation.setOnClickHandler(() => {
            store.dispatch(setFocusedComment(commentId));
            store.dispatch(setPinnedComment(commentId));
        });

        // Let layout engine know the annotation so it would position the comment correctly
        layout.setCommentAnnotation(commentId, annotation);

        // Create comment
        store.dispatch(
            addComment(
                newComment(
                    commentId,
                    annotation,
                    comment.author,
                    Date.parse(comment.created_at),
                    {
                        remoteId: comment.id,
                        resolvedAt: comment.resolved_at
                            ? Date.parse(comment.resolved_at)
                            : null,
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
                        reply.author,
                        Date.parse(reply.created_at),
                        { remoteId: reply.id, text: reply.text }
                    )
                )
            );
        }

        // If this is the initial focused comment. Focus and pin it
        // TODO: Scroll to this comment
        if (
            initialFocusedCommentId &&
            comment.id == initialFocusedCommentId
        ) {
            store.dispatch(setFocusedComment(commentId));
            store.dispatch(setPinnedComment(commentId));

            // HACK: If the comment is resolved. Set that comments "resolvedInThisSession" field so it displays
            if (comment.resolved_at !== null) {
                store.dispatch(
                    updateComment(commentId, { resolvedThisSession: true })
                );
            }
        }
    }


    // Unfocus when document body is clicked
    document.body.addEventListener('click', e => {
        if (e.target instanceof HTMLElement) {
            // ignore if click target is a comment or a highlight
            if (
                !e.target.closest('#comments, .annotator-hl, .annotator-adder')
            ) {
                // Running store.dispatch directly here seems to prevent the event from being handled anywhere else
                setTimeout(() => {
                    store.dispatch(setFocusedComment(null));
                    store.dispatch(setPinnedComment(null));
                }, 1);
            }
        }
    });
}

