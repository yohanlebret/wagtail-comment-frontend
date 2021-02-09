import { createSelector } from 'reselect';
import type { Comment } from '../state/comments';
import type { State } from '../state';

const getComments = (state: State) => state.comments.comments;

export function selectCommentsForContentPathFactory(contentpath: string) {
  return createSelector(getComments, (comments) =>
    [...comments.values()].filter(
      (comment: Comment) =>
        comment.contentpath === contentpath && !comment.deleted
    )
  );
}
