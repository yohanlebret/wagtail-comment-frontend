import React from 'react';

interface CommentMessageProps {
  message: string;
}

export default function CommentMessage({
  message
}: CommentMessageProps) {
  return (
    <div className="comment__overlay" role="alert">
      {message}
    </div>
  );
}
