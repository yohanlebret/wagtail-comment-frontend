import React from 'react';
import { CSSTransition } from 'react-transition-group';

interface CommentMessageProps {
  message: string;
}

export default function CommentMessage({
  message
}: CommentMessageProps) {
  return (
    <CSSTransition
      in={message !== ''}
      timeout={400}
      classNames="comment-message-"
      unmountOnExit
    >
      <div className="comment-message" role="alert">
        {message}
      </div>
    </CSSTransition>
  );
}
