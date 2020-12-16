import React from 'react';
import ReactDOM from 'react-dom';
import dateFormat from 'dateformat';

import type { Store } from '../../state';
import { Author, Comment, newCommentReply } from '../../state/comments';
import {
  updateComment,
  deleteComment,
  setFocusedComment,
  addReply,
  setPinnedComment,
} from '../../actions/comments';
import { LayoutController } from '../../utils/layout';
import { getNextReplyId } from '../../utils/sequences';
import CommentReplyComponent, { addRemoteWarningMessage as addRemoteReplyWarningMessage } from '../CommentReply';
import CommentMessage from '../CommentMessage';
import type { TranslatableStrings } from '../../main';

function addRemoteWarningMessage(
  comment: Comment,
  message: string,
  store: Store,
  addIfLocal = false,
  onFinish?: () => void
) {
  if (addIfLocal || comment.remoteId !== null) {
    // Only add the warning message if the comment actually exists in the db - editing a comment you've created
    // locally, for instance, requires no such warning
    store.dispatch(
      updateComment(comment.localId, {
        message: message,
      })
    );
    window.setTimeout(() => {
      store.dispatch(
        updateComment(comment.localId, {
          message: '',
        })
      );
      if (onFinish !== undefined) {
        onFinish();
      }
    },
    1500);
  } else if (onFinish !== undefined) {
    onFinish();
  }
}

async function saveComment(comment: Comment, store: Store, strings: TranslatableStrings, forceWarning = false) {
  store.dispatch(
    updateComment(comment.localId, {
      mode: 'saving',
    })
  );

  try {
    store.dispatch(
      updateComment(comment.localId, {
        mode: 'default',
        text: comment.newText,
        remoteId: comment.remoteId,
        author: comment.author,
        date: comment.date,
      })
    );
    addRemoteWarningMessage(comment, strings.SAVE_COMMENT_WARNING, store, forceWarning);
  } catch (err) {
    console.error(err);
    store.dispatch(
      updateComment(comment.localId, {
        mode: 'save_error',
      })
    );
  }
}

async function doDeleteComment(comment: Comment, store: Store, strings: TranslatableStrings) {
  store.dispatch(
    updateComment(comment.localId, {
      mode: 'deleting',
    })
  );
  addRemoteWarningMessage(comment, strings.SAVE_COMMENT_WARNING, store, false, () => {
    // Only try to delete the comment when the message times out
    try {
      store.dispatch(deleteComment(comment.localId));
      if (comment.annotation) {
        comment.annotation.onDelete();
      }
    } catch (err) {
      console.error(err);
      store.dispatch(
        updateComment(comment.localId, {
          mode: 'delete_error',
        })
      );
    }
  });
}

export interface CommentProps {
  store: Store;
  comment: Comment;
  isFocused: boolean;
  layout: LayoutController;
  user: Author;
  strings: TranslatableStrings;
}

export default class CommentComponent extends React.Component<CommentProps> {
  renderAuthorDate(): React.ReactFragment {
    const { comment } = this.props;

    const author = comment.author ? comment.author.name + ' - ' : '';

    return (
      <p className="comment__author-date">
        {author}
        {dateFormat(comment.date, 'h:MM mmmm d')}
      </p>
    );
  }

  renderMessage(): React.ReactFragment {
    const { comment } = this.props;

    if (comment.message !== '') {
      return <CommentMessage message={comment.message} />;
    }
    return null;
  }

  renderReplies({ hideNewReply = false } = {}): React.ReactFragment {
    const { comment, isFocused, store, user, strings } = this.props;

    if (!comment.remoteId) {
      // Hide replies UI if the comment itself isn't saved yet
      return <></>;
    }

    const onChangeNewReply = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          newReply: e.target.value,
        })
      );
    };

    const sendReply = async (e: React.FormEvent) => {
      e.preventDefault();

      const replyId = getNextReplyId();
      const reply = newCommentReply(replyId, null, Date.now(), {
        text: comment.newReply,
        mode: 'default',
      });
      store.dispatch(addReply(comment.localId, reply));
      addRemoteReplyWarningMessage(comment, reply, strings.SAVE_COMMENT_WARNING, store, true);

      store.dispatch(
        updateComment(comment.localId, {
          newReply: '',
        })
      );
    };

    const onClickCancelReply = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          newReply: '',
        })
      );
    };

    const replies = [];
    let replyBeingEdited = false;
    for (const reply of comment.replies.values()) {
      if (reply.mode === 'saving' || reply.mode === 'editing') {
        replyBeingEdited = true;
      }

      if (!reply.deleted) {
        replies.push(
          <CommentReplyComponent
            key={reply.localId}
            store={store}
            user={user}
            comment={comment}
            reply={reply}
            strings={strings}
          />
        );
      }
    }

    // Hide new reply if a reply is being edited as well
    const newReplyHidden = hideNewReply || replyBeingEdited;

    let replyActions = <></>;
    let replyForm = <></>;
    let replyTextarea = <></>;
    if (!newReplyHidden && (isFocused || comment.newReply)) {
      replyTextarea = (
        <textarea
          className="comment__reply-input"
          placeholder="Enter your reply..."
          value={comment.newReply}
          onChange={onChangeNewReply}
          style={{ resize: 'none' }}
        />
      );
      if (comment.newReply.length > 0) {
        replyActions = (
          <div className="comment__reply-actions">
            <button
              type="submit"
              className="comment__button comment__button--primary"
            >
              {strings.REPLY}
            </button>
            <button
              type="button"
              onClick={onClickCancelReply}
              className="comment__button"
            >
              {strings.CANCEL}
            </button>
          </div>
        );
      }
      replyForm = (
        <form className="comment__reply-form" onSubmit={sendReply}>
          {replyTextarea}
          {replyActions}
        </form>
      );
    }

    return (
      <>
        <ul className="comment__replies">{replies}</ul>
        {replyForm}
      </>
    );
  }

  renderCreating(): React.ReactFragment {
    const { comment, store, strings } = this.props;

    const onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          newText: e.target.value,
        })
      );
    };

    const onSave = async (e: React.FormEvent) => {
      e.preventDefault();
      await saveComment(comment, store, strings, true);
    };

    const onCancel = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(deleteComment(comment.localId));

      if (comment.annotation) {
        comment.annotation.onDelete();
      }
    };

    return (
      <>
        <div className="comment__container--mode-creating">
          {this.renderMessage()}
          <form onSubmit={onSave}>
            <textarea
              className="comment__input"
              value={comment.newText}
              onChange={onChangeText}
              style={{ resize: 'none' }}
              placeholder="Enter your comments..."
            />
            <div className="comment__actions">
              <button
                type="submit"
                className="comment__button comment__button--primary"
              >
                {strings.SAVE}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="comment__button"
              >
                {strings.CANCEL}
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  renderEditing(): React.ReactFragment {
    const { comment, store, strings } = this.props;

    const onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          newText: e.target.value,
        })
      );
    };

    const onSave = async (e: React.FormEvent) => {
      e.preventDefault();

      await saveComment(comment, store, strings);
    };

    const onCancel = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          mode: 'default',
          newText: comment.text,
        })
      );
    };

    return (
      <>
        <div className="comment__container">
          {this.renderMessage()}
          <form onSubmit={onSave}>
            <textarea
              className="comment__input"
              value={comment.newText}
              onChange={onChangeText}
              style={{ resize: 'none' }}
            />
            <div className="comment__actions">
              <button
                type="submit"
                className="comment__button comment__button--primary"
              >
                {strings.SAVE}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="comment__button"
              >
                {strings.CANCEL}
              </button>
            </div>
          </form>
        </div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderSaving(): React.ReactFragment {
    const { comment, strings } = this.props;

    return (
      <>
        <div className="comment__container">
          {this.renderMessage()}
          <p className="comment__text">{comment.text}</p>
          {this.renderAuthorDate()}
          <div className="comment__progress">{strings.SAVING}</div>
        </div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderSaveError(): React.ReactFragment {
    const { comment, store, strings } = this.props;

    const onClickRetry = async (e: React.MouseEvent) => {
      e.preventDefault();

      await saveComment(comment, store, strings);
    };

    return (
      <>
        <div className="comment__container">
          {this.renderMessage()}
          <p className="comment__text">{comment.text}</p>
          {this.renderAuthorDate()}
          <div className="comment__error">
            {strings.SAVE_ERROR}
            <button
              type="button"
              className="comment__button"
              onClick={onClickRetry}
            >
              {strings.RETRY}
            </button>
          </div>
        </div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderDeleteConfirm(): React.ReactFragment {
    const { comment, store, strings } = this.props;

    const onClickDelete = async (e: React.MouseEvent) => {
      e.preventDefault();

      await doDeleteComment(comment, store, strings);
    };

    const onClickCancel = (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          mode: 'default',
        })
      );
    };

    return (
      <>
        <div className="comment__container">
          {this.renderMessage()}
          <p className="comment__text">{comment.text}</p>
          {this.renderAuthorDate()}
          <div className="comment__confirm-delete">
            {strings.CONFIRM_DELETE_COMMENT}
            <button
              type="button"
              className="comment__button comment__button--red"
              onClick={onClickDelete}
            >
              {strings.DELETE}
            </button>
            <button
              type="button"
              className="comment__button"
              onClick={onClickCancel}
            >
              {strings.CANCEL}
            </button>
          </div>
        </div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderDeleting(): React.ReactFragment {
    const { comment, strings } = this.props;

    return (
      <>
        <div className="comment__container">
          {this.renderMessage()}
          <p className="comment__text">{comment.text}</p>
          {this.renderAuthorDate()}
          <div className="comment__progress">{strings.DELETING}</div>
        </div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderDeleteError(): React.ReactFragment {
    const { comment, store, strings } = this.props;

    const onClickRetry = async (e: React.MouseEvent) => {
      e.preventDefault();

      await doDeleteComment(comment, store, strings);
    };

    const onClickCancel = async (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          mode: 'default',
        })
      );
    };

    return (
      <>
        <div className="comment__container">
          {this.renderMessage()}
          <p className="comment__text">{comment.text}</p>
          {this.renderAuthorDate()}
          <div className="comment__error">
            {strings.DELETE_ERROR}
            <button
              type="button"
              className="comment__button"
              onClick={onClickCancel}
            >
              {strings.CANCEL}
            </button>
            <button
              type="button"
              className="comment__button"
              onClick={onClickRetry}
            >
              {strings.RETRY}
            </button>
          </div>
        </div>
        {this.renderReplies({ hideNewReply: true })}
      </>
    );
  }

  renderDefault(): React.ReactFragment {
    const { comment, store, strings } = this.props;

    const onClickEdit = async (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          mode: 'editing',
          newText: comment.text,
        })
      );
    };

    const onClickDelete = async (e: React.MouseEvent) => {
      e.preventDefault();

      store.dispatch(
        updateComment(comment.localId, {
          mode: 'delete_confirm',
        })
      );
    };

    const onClickResolve = async (e: React.MouseEvent) => {
      e.preventDefault();

      await doDeleteComment(comment, store, strings);
    };

    let actions = <></>;
    if (comment.author === null || this.props.user.id === comment.author.id) {
      actions = (
        <>
          <button
            type="button"
            className="comment__button comment__button--primary"
            onClick={onClickEdit}
          >
            {strings.EDIT}
          </button>
          <button
            type="button"
            className="comment__button"
            onClick={onClickDelete}
          >
            {strings.DELETE}
          </button>
        </>
      );
    }

    return (
      <>
        <div className="comment__container">
          {this.renderMessage()}
          <p className="comment__text">{comment.text}</p>
          {this.renderAuthorDate()}
          <div className="comment__actions">
            {actions}
            <div className="comment__resolved">
              <button
                type="button"
                className="comment__button"
                onClick={onClickResolve}
              >
                {strings.RESOLVE}
              </button>
            </div>
          </div>
        </div>
        {this.renderReplies()}
      </>
    );
  }

  render() {
    let inner: React.ReactFragment;

    switch (this.props.comment.mode) {
    case 'creating':
      inner = this.renderCreating();
      break;

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

    const onClick = () => {
      this.props.store.dispatch(setFocusedComment(this.props.comment.localId));
    };

    const onDoubleClick = () => {
      this.props.store.dispatch(setPinnedComment(this.props.comment.localId));
    };

    const top = this.props.layout.getCommentPosition(
      this.props.comment.localId
    );
    const right = this.props.isFocused ? 50 : 0;
    return (
      <li
        key={this.props.comment.localId}
        className={`comment comment--mode-${this.props.comment.mode}`}
        style={{
          position: 'absolute',
          top: `${top}px`,
          right: `${right}px`,
        }}
        data-comment-id={this.props.comment.localId}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
        {inner}
      </li>
    );
  }

  componentDidMount() {
    const element = ReactDOM.findDOMNode(this);

    if (element instanceof HTMLElement) {
      // If this is a new comment, focus in the edit box
      if (this.props.comment.mode === 'creating') {
        const textAreaElement = element.querySelector('textarea');

        if (textAreaElement instanceof HTMLTextAreaElement) {
          textAreaElement.focus();
        }
      }

      this.props.layout.setCommentElement(this.props.comment.localId, element);
      this.props.layout.setCommentHeight(
        this.props.comment.localId,
        element.offsetHeight
      );
    }

    if (this.props.comment.annotation) {
      this.props.comment.annotation.show();
    }
  }

  componentWillUnmount() {
    this.props.layout.setCommentElement(this.props.comment.localId, null);

    if (this.props.comment.annotation) {
      this.props.comment.annotation.hide();
    }
  }

  componentDidUpdate() {
    const element = ReactDOM.findDOMNode(this);

    // Keep height up to date so that other comments will be moved out of the way
    if (element instanceof HTMLElement) {
      this.props.layout.setCommentHeight(
        this.props.comment.localId,
        element.offsetHeight
      );
    }
  }
}
