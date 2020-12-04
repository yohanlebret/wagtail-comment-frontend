import { createSelector } from 'reselect';
import type { Comment } from '../state/comments'
import type { State } from '../state'

const getComments = (state: State) => state.comments.comments;

export function selectCommentsForContentPathFactory (contentPath: string) {
    return createSelector(
        getComments,
        (comments) => [...comments.values()].filter((comment: Comment) => comment.contentPath === contentPath)
    )
}