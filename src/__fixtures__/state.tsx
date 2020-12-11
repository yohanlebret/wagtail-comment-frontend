import type {
  Comment,
  CommentsState,
  CommentMode,
  CommentReply,
  CommentReplyMode,
} from '../state/comments';

export const basicCommentsState: CommentsState = {
  focusedComment: 1,
  pinnedComment: 1,
  remoteCommentCount: 1,
  comments: new Map([
    [
      1,
      {
        contentpath: 'test_contentpath',
        localId: 1,
        annotation: null,
        remoteId: 1,
        mode: 'default' as CommentMode,
        deleted: false,
        author: { id: 1, name: 'test user' },
        date: 0,
        text: 'test text',
        newReply: '',
        editPreviousText: '',
        remoteReplyCount: 1,
        replies: new Map([
          [
            2,
            {
              localId: 2,
              remoteId: 2,
              mode: 'default' as CommentReplyMode,
              author: { id: 1, name: 'test user' },
              date: 0,
              text: 'a reply',
              editPreviousText: '',
              deleted: false,
            } as CommentReply,
          ],
          [
            3,
            {
              localId: 3,
              remoteId: null,
              mode: 'default' as CommentReplyMode,
              author: { id: 1, name: 'test user' },
              date: 0,
              text: 'another reply',
              editPreviousText: '',
              deleted: false,
            } as CommentReply,
          ],
        ]),
      } as Comment,
    ],
    [
      4,
      {
        contentpath: 'test_contentpath_2',
        localId: 4,
        annotation: null,
        remoteId: null,
        mode: 'default' as CommentMode,
        deleted: false,
        author: { id: 1, name: 'test user' },
        date: 0,
        text: 'unsaved comment',
        newReply: '',
        editPreviousText: '',
        replies: new Map(),
        remoteReplyCount: 0,
      } as Comment,
    ],
  ]),
};
