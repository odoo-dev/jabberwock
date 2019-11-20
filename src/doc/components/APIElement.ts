import * as owl from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import githubSrc from './../assets/img/github.png';
import { useState } from 'owl-framework/src/hooks';
import { SignatureType } from './SignatureType';
import * as markdownIt from 'markdown-it';

interface APIElementProps {
    element: {
        id: number;
        kind: number;
        kindString: string;
        signatures: {
            comment: {
                return: string;
            };
            // todo: add flags
            id: number;
            kind: number;
            parameters: {
                id: number;
                name: string;
                kind: number;
                kindString: string;
                comment?: {
                    text: string;
                    shortText?: string;
                };
                // todo: add flags
            }[];
            // todo: add type
        }[];
        sources: {
            filename: string;
            line: number;
            character: number;
            packageName: string;
        }[];
        type: {
            type: string;
            name: string;
        };
        comment?: {
            text?: string;
        };
    };
    gitGithurUrl: () => string;
    md: markdownIt;
}

export class APIElement extends owl.Component<Env, APIElementProps> {
    static components = { SignatureType };
    asset = { githubSrc };
    state = useState({
        isFull: false,
    });

    isOpenable(): boolean {
        return (
            (this.props.element.signatures &&
                this.props.element.signatures[0] &&
                this.props.element.signatures[0].parameters &&
                this.props.element.signatures[0].parameters[0] &&
                this.props.element.signatures[0].parameters[0].comment &&
                (!!this.props.element.signatures[0].parameters[0].comment.text ||
                    !!this.props.element.signatures[0].parameters[0].comment.shortText)) ||
            this.hasCommentText()
        );
    }
    hasCommentText(): boolean {
        return this.props.element.comment && !!this.props.element.comment.text;
    }

    selectElement(): void {
        if (this.isOpenable()) {
            this.state.isFull = !this.state.isFull;
        }
    }
}
