import React from 'react';
import dateFormat from 'dateformat';

import type { Store } from '../../state';
import type { Comment, CommentReply, Author } from '../../state/comments';
import { updateReply, deleteReply } from '../../actions/comments';
import type { TranslatableStrings } from '../../main';

export async function saveCommentReply(
  comment: Comment,
  reply: CommentReply,
  store: Store
) {
  store.dispatch(
    updateReply(comment.localId, reply.localId, {
      mode: 'saving',
    })
  );

  try {
    store.dispatch(
      updateReply(comment.localId, reply.localId, {
        mode: 'default',
        text: reply.newText,
        author: reply.author,
      })
    );
  } catch (err) {
    console.error(err);
    store.dispatch(
      updateReply(comment.localId, reply.localId, {
        mode: 'save_error',
      })
    );
  }
}

async function deleteCommentReply(
  comment: Comment,
  reply: CommentReply,
  store: Store
) {
  store.dispatch(
    updateReply(comment.localId, reply.localId, {
      mode: 'deleting',
    })
  );

  try {
    store.dispatch(deleteReply(comment.localId, reply.localId));
  } catch (err) {
    store.dispatch(
      updateReply(comment.localId, reply.localId, {
        mode: 'delete_error',
      })
    );
  }
}

export interface CommentReplyProps {
  comment: Comment;
  reply: CommentReply;
  store: Store;
  user: Author;
  strings: TranslatableStrings;
}

export default class CommentReplyComponent extends React.Component<CommentReplyProps> {
  renderAuthorDate(): React.ReactFragment {
    const { reply } = this.props;

    const author = reply.author ? reply.author.name + ' -' : '';

    return (
      <p className="comment-reply__author-date">
        {author} {dateFormat(reply.date, 'h:MM mmmm d')}
      </p>
    );
  }

  renderEditing(): React.ReactFragment {
    const { comment, reply, store, strings } = this.props;

    const onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.preventDefault();

      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          newText: e.target.value,
        })
      );
    };

    const onSave = async (e: React.FormEvent) => {
      e.preventDefault();
      await saveCommentReply(comment, reply, store);
    };

    const onCancel = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          mode: 'default',
          newText: reply.text,
        })
      );
    };

    return (
      <form onSubmit={onSave}>
        <textarea
          className="comment-reply__input"
          value={reply.newText}
          onChange={onChangeText}
          style={{ resize: 'none' }}
        />
        <div className="comment-reply__actions">
          <button
            type="submit"
            className="comment-reply__button comment-reply__button--primary"
          >
            {strings.SAVE}
          </button>
          <button
            type="button"
            className="comment-reply__button"
            onClick={onCancel}
          >
            {strings.CANCEL}
          </button>
        </div>
      </form>
    );
  }

  renderSaving(): React.ReactFragment {
    const { reply, strings } = this.props;

    return (
      <>
        <p className="comment-reply__text">{reply.text}</p>
        {this.renderAuthorDate()}
        <div className="comment-reply__progress">{strings.SAVING}</div>
      </>
    );
  }

  renderSaveError(): React.ReactFragment {
    const { comment, reply, store, strings } = this.props;

    const onClickRetry = async (e: React.MouseEvent) => {
      e.preventDefault();

      await saveCommentReply(comment, reply, store);
    };

    return (
      <>
        <p className="comment-reply__text">{reply.text}</p>
        {this.renderAuthorDate()}
        <div className="comment-reply__error">
          {strings.SAVE_ERROR}
          <button
            type="button"
            className="comment-reply__button"
            onClick={onClickRetry}
          >
            {strings.RETRY}
          </button>
        </div>
      </>
    );
  }

  renderDeleteConfirm(): React.ReactFragment {
    const { comment, reply, store, strings } = this.props;

    const onClickDelete = async (e: React.MouseEvent) => {
      e.preventDefault();

      await deleteCommentReply(comment, reply, store);
    };

    const onClickCancel = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          mode: 'default',
        })
      );
    };

    return (
      <>
        <p className="comment-reply__text">{reply.text}</p>
        {this.renderAuthorDate()}
        <div className="comment-reply__confirm-delete">
          {strings.CONFIRM_DELETE_COMMENT}
          <button
            type="button"
            className="comment-reply__button comment-reply__button--red"
            onClick={onClickDelete}
          >
            {strings.DELETE}
          </button>
          <button
            type="button"
            className="comment-reply__button"
            onClick={onClickCancel}
          >
            {strings.CANCEL}
          </button>
        </div>
      </>
    );
  }

  renderDeleting(): React.ReactFragment {
    const { reply, strings } = this.props;

    return (
      <>
        <p className="comment-reply__text">{reply.text}</p>
        {this.renderAuthorDate()}
        <div className="comment-reply__progress">{strings.DELETING}</div>
      </>
    );
  }

  renderDeleteError(): React.ReactFragment {
    const { comment, reply, store, strings } = this.props;

    const onClickRetry = async (e: React.MouseEvent) => {
      e.preventDefault();

      await deleteCommentReply(comment, reply, store);
    };

    const onClickCancel = async (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          mode: 'default',
        })
      );
    };

    return (
      <>
        <p className="comment-reply__text">{reply.text}</p>
        {this.renderAuthorDate()}
        <div className="comment-reply__error">
          {strings.DELETE_ERROR}
          <button
            type="button"
            className="comment-reply__button"
            onClick={onClickCancel}
          >
            {strings.CANCEL}
          </button>
          <button
            type="button"
            className="comment-reply__button"
            onClick={onClickRetry}
          >
            {strings.RETRY}
          </button>
        </div>
      </>
    );
  }

  renderDefault(): React.ReactFragment {
    const { comment, reply, store, strings } = this.props;

    const onClickEdit = async (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          mode: 'editing',
          newText: reply.text,
        })
      );
    };

    const onClickDelete = async (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateReply(comment.localId, reply.localId, {
          mode: 'delete_confirm',
        })
      );
    };

    let actions = <></>;
    if (reply.author === null || this.props.user.id === reply.author.id) {
      actions = (
        <div className="comment-reply__actions">
          <button
            type="button"
            className="comment-reply__button comment-reply__button--primary"
            onClick={onClickEdit}
          >
            {strings.EDIT}
          </button>
          <button
            type="button"
            className="comment-reply__button"
            onClick={onClickDelete}
          >
            {strings.DELETE}
          </button>
        </div>
      );
    }

    return (
      <>
        <p className="comment-reply__text">{reply.text}</p>
        {this.renderAuthorDate()}
        {actions}
      </>
    );
  }

  render() {
    let inner: React.ReactFragment;

    switch (this.props.reply.mode) {
    case 'editing':
      inner = this.renderEditing();
      break;

    case 'saving':
      inner = this.renderSaving();
      break;

    case 'save_error':
      inner = this.renderSaveError();
      break;

    case 'delete_confirm':
      inner = this.renderDeleteConfirm();
      break;

    case 'deleting':
      inner = this.renderDeleting();
      break;

    case 'delete_error':
      inner = this.renderDeleteError();
      break;

    default:
      inner = this.renderDefault();
      break;
    }

    return (
      <li
        key={this.props.reply.localId}
        className={`comment-reply comment-reply--mode-${this.props.reply.mode}`}
        data-reply-id={this.props.reply.localId}
      >
        {inner}
      </li>
    );
  }
}
