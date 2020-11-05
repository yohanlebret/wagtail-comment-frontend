import { createSelector } from 'reselect';
import { Comment } from '../state/comments'
import { State } from '../state'

const getComments = (state: State) => state.comments.comments;

export function selectCommentsForContentPathFactory (contentPath: string) {
    return createSelector(
        getComments,
        (comments: Map<number, Comment>) => [...comments.values()].filter((comment: Comment) => comment.contentPath === contentPath)
    )
}