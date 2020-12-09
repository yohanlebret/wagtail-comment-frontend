import React from 'react';

import type {
    Comment,
    CommentReply,
} from '../../state/comments';


export interface CommentFormSetProps {
    comments: Comment[];
}

export function CommentFormSetComponent(props: CommentFormSetProps) {
    const [initialNumber] = React.useState(props.comments.filter(comment => {return comment.remoteId != null}).length);
    const prefix = "comments";

    const commentForms = props.comments.map((comment, formNumber) => (
        <CommentFormComponent
            key={comment.localId}
            comment={comment}
            formNumber={formNumber}
        />
    ));

    return (<>
        <PrefixedHiddenInput
            fieldName="TOTAL_FORMS"
            value={props.comments.length}
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="INITIAL_FORMS"
            value={initialNumber}
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="MIN_NUM_FORMS"
            value="0"
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="MAX_NUM_FORMS"
            value=""
            prefix={prefix}
        />
        {commentForms}
    </>)
}

interface PrefixedHiddenInputProps {
    prefix: string;
    value: number|string;
    fieldName: string;
}

function PrefixedHiddenInput(props: PrefixedHiddenInputProps) {
    return (<input
        type="hidden"
        name={`${props.prefix}-${props.fieldName}`}
        value={props.value} 
        id={`id_${props.prefix}-${props.fieldName}`}
    />)
}

export interface CommentReplyFormComponentProps {
    reply: CommentReply;
    prefix: string;
    formNumber: number;
}

export function CommentReplyFormComponent(props: CommentReplyFormComponentProps) {
    const reply = props.reply
    const prefix = `${props.prefix}-${props.formNumber}`
    return (<fieldset>
        <PrefixedHiddenInput
            fieldName="DELETE"
            value={reply.deleted ? 1 : ""}
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="id"
            value={reply.remoteId}
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="text"
            value={reply.text}
            prefix={prefix}
        />
    </fieldset>)
}

export interface CommentReplyFormSetProps {
    replies: CommentReply[];
    prefix: string;
}

export function CommentReplyFormSetComponent(props: CommentReplyFormSetProps) {
    const [initialNumber] = React.useState(props.replies.filter(comment => {return comment.remoteId != null}).length);
    const prefix = `${props.prefix}-replies`

    const commentForms = props.replies.map((reply, formNumber) => (
        <CommentReplyFormComponent
            key={reply.localId}
            formNumber={formNumber}
            reply={reply}
            prefix={prefix}
        />
    ));

    return (<>
        <PrefixedHiddenInput
            fieldName="TOTAL_FORMS"
            value={props.replies.length}
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="INITIAL_FORMS"
            value={initialNumber}
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="MIN_NUM_FORMS"
            value="0"
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="MAX_NUM_FORMS"
            value=""
            prefix={prefix}
        />
        {commentForms}
    </>)
}

export interface CommentFormProps {
    comment: Comment;
    formNumber: number;
}

export function CommentFormComponent(props: CommentFormProps) {
    const comment = props.comment
    const prefix = `comments-${props.formNumber}`

    return (<fieldset>
        <PrefixedHiddenInput
            fieldName="DELETE"
            value={comment.deleted ? 1 : ""}
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="id"
            value={comment.remoteId}
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="contentpath"
            value={comment.contentpath}
            prefix={prefix}
        />
        <PrefixedHiddenInput
            fieldName="text"
            value={comment.text}
            prefix={prefix}
        />
        <CommentReplyFormSetComponent
            replies={Array.from(comment.replies.values())}
            prefix={prefix}
        />
    </fieldset>)
}