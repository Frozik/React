import { CompositeDecorator, Editor, EditorState, RichUtils, getVisibleSelectionRect } from "draft-js";
import { defer, isEqual } from "lodash";
import * as React from "react";
import { findDOMNode } from "react-dom";

import ElementHelper from "./../../helpers/element-helper";
import KeyCodes from "./../../helpers/key-codes";
import BlockToolbar from "./block-toolbar";
import linkDecorator from "./link-decorator";
import SelectionToolbar  from "./selection-toolbar";

import { editor } from "./styles/index.scss";

interface IRichEditorState {
    blockRect?: ClientRect;
    editorRect?: ClientRect;
    editorState?: EditorState;
    selectionRect?: ClientRect;
}

interface IRichEditorProps {}

export default class RichEditor extends React.Component<IRichEditorProps, IRichEditorState> {
    public constructor(props: IRichEditorProps) {
        super(props);

        const compositeDecorator = new CompositeDecorator([
            linkDecorator,
        ]);

        const editorState = EditorState.createEmpty(compositeDecorator);

        this.state = { editorState };
    }

    public render() {
        const { blockRect, editorRect, editorState, selectionRect } = this.state;

        return (
            <div className={editor}>
                <SelectionToolbar
                    editorRect={editorRect}
                    editorState={editorState}
                    selectionRect={selectionRect}
                    updateEditorState={this.editorStateChanged.bind(this)}
                />

                <BlockToolbar
                    blockRect={blockRect}
                    editorRect={editorRect}
                    editorState={editorState}
                    updateEditorState={this.editorStateChanged.bind(this)}
                />

                <Editor
                    handleKeyCommand={this.handleKeyCommand.bind(this)}
                    handleReturn={this.handleReturn.bind(this)}
                    onTab={this.handleTab.bind(this)}
                    editorState={editorState}
                    onChange={this.editorStateChanged.bind(this)}
                    onFocus={this.deferUpdateToolbars.bind(this, editorState)}
                    onBlur={this.deferResetToolbars.bind(this)}
                    spellCheck
                />
            </div>
        );
    }

    protected editorStateChanged(editorState: EditorState) {
        this.setState({ editorState });

        this.deferUpdateToolbars(editorState);
    }

    protected updateToolbars(editorState: EditorState) {
        const {
            blockRect: originalBlockRect,
            editorRect: originalEditorRect,
            selectionRect: originalSelectionRect,
        } = this.state;
        const selectionState = editorState.getSelection();

        const editorNode = findDOMNode(this);

        if (!editorNode) {
            return;
        }

        const editorRect: ClientRect = ElementHelper.getElementRect(editorNode);
        let blockRect: ClientRect = null;
        let selectionRect: ClientRect = null;

        if (selectionState.getHasFocus()) {
            blockRect = this.getEditBlockNodeRect(editorState, editorNode);
            selectionRect = this.getSelectionRect(editorState);
        }

        if (!isEqual(editorRect, originalEditorRect)) {
            this.setState({ editorRect });
        }

        if (!isEqual(blockRect, originalBlockRect)) {
            this.setState({ blockRect });
        }

        if (!isEqual(selectionRect, originalSelectionRect)) {
            this.setState({ selectionRect });
        }
    }

    protected deferUpdateToolbars(editorState: EditorState) {
        defer(this.updateToolbars.bind(this, editorState));
    }

    protected resetToolbars() {
        this.setState({
            blockRect: null,
            selectionRect: null,
        });
    }

    protected deferResetToolbars() {
        defer(this.resetToolbars.bind(this));
    }

    protected getEditBlockNodeRect(editorState: EditorState, editorNode: Element): ClientRect {
        const { anchorNode, focusNode } = window.getSelection();

        if (!anchorNode || !focusNode) {
            return null;
        }

        if (!ElementHelper.isWithinContainer(editorNode, anchorNode, focusNode)) {
            return null;
        }

        const selectionElement = editorState.getSelection().getIsBackward() ? focusNode : anchorNode;

        let iterator: Node | Element = selectionElement;

        while (iterator && (!(iterator instanceof Element) || !iterator.getAttribute("data-block"))) {
            iterator = iterator.parentNode;
        }

        const blockElement = iterator instanceof Element ? iterator : null;

        if (!blockElement) {
            return null;
        }

        return ElementHelper.getElementRect(blockElement);
    }

    protected getSelectionRect(editorState: EditorState): ClientRect {
        const selectionState = editorState.getSelection();

        if (selectionState.isCollapsed() || selectionState.getStartKey() !== selectionState.getEndKey()) {
            return null;
        }

        const visibleSelectionRect = getVisibleSelectionRect(window);

        return visibleSelectionRect ? ElementHelper.fromWindowToDocument(visibleSelectionRect) : null;
    }

    protected handleKeyCommand(command: any): boolean {
        const { editorState } = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);

        if (newState) {
            this.editorStateChanged(newState);

            return true;
        }

        return false;
    }

    protected handleReturn(event: React.KeyboardEvent): boolean {
        const { editorState } = this.state;

        switch (event.keyCode) {
            case KeyCodes.enter:
                if (event.shiftKey) {
                    this.editorStateChanged(RichUtils.insertSoftNewline(editorState));

                    return true;
                }

                return false;

            default:
                return false;
        }
    }

    protected handleTab(event: SyntheticKeyboardEvent) {
        const { editorState } = this.state;

        const newState = RichUtils.onTab(event, editorState, 4);

        this.editorStateChanged(newState);
    }
}
