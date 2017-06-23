import React from 'react';
import {chatStore} from '../../flux/chat/chat-store';
import {defaultStore} from '../../flux/default/default-store';
import {SecureAjaxRequest} from '../../utils/ajax-request';
import {ApiUrls} from '../../utils/api-urls';
import {ChatActions} from '../../flux/chat/chat-actions';
import {DefaultActions} from '../../flux/default/default-actions';
import classnames from 'classnames';
import './chat.scss';

import checkOnce from './icon-check-once-3x.png';
import checkTwice from './icon-check-twice-3x.png';

class Chat extends React.Component {
    constructor(props) {
        super();
        this.state = this._getState(props);
        this.state.newMessage = '';
        this._handleStoreChange = this._handleStoreChange.bind(this);
        this._handleNewMessage = this._handleNewMessage.bind(this);
        this._handleKeyPress = this._handleKeyPress.bind(this);
        this._goBack = this._goBack.bind(this);
    }

    _getState(props) {

        const messages = chatStore.getMessages(props.handle);

        return {
            messages,
            messagesCount: messages.length
        };
    }

    render() {

        console.log(checkOnce);
        console.log(checkTwice);

        return (
            <div className="chat">
                <div className="header">
                    <div className="back" onClick={this._goBack}>
                        <span>&lt;</span>
                    </div>
                    <div className="contact-initial">
                        <span>{this.props.handle.substring(0,1)}</span>
                    </div>
                    <div className="contact-name">
                        <span>{this.props.handle}</span>
                    </div>
                </div>
                <div className="messages" ref="messages">
                    {this.state.messages.map((message, index) => {
                        const mineOrYours = chatStore.iAmSender(message.sender) ? 'mine' : 'yours';
                        const messageClasses = classnames('message', mineOrYours);
                        let checkUrl = '';

                        if (chatStore.iAmSender(message.sender)) {
                            if (message.receivedByServer) {
                                checkUrl = checkOnce;
                            }

                            if (message.acknowledged) {
                                checkUrl = checkTwice;
                            }
                        }
                        
                        return (
                            <div key={index} className="message-container">
                                <div className={messageClasses}>
                                    <span>{message.content}</span>&nbsp;{ checkUrl ? <img height="10" src={checkUrl}/> : null }
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="message-input-container">
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={this.state.newMessage}
                        onChange={this._handleNewMessage}
                        onKeyPress={this._handleKeyPress}/>
                </div>
            </div>
        );
    }

    _handleNewMessage(event) {
        this.setState({
            newMessage: event.target.value
        });
    }

    _handleKeyPress(event) {
        if (event.key === 'Enter') {
            const request = new SecureAjaxRequest();

            const receiver = this.props.handle;


            const fact = {
                type: 'message-sent',
                data: {
                    sender: defaultStore.user.handle,
                    receiver,
                    content: this.state.newMessage,
                    messageId: Date.now()
                }
            };

            ChatActions.processFact(fact);

            this.setState({
                newMessage: ''
            });

            global.setTimeout(() => {
                request.post({
                    url: ApiUrls.message(),
                    data: fact,
                    success: (res) => {
                        console.log(res);
                        const receivedByServerFact = {
                            type: 'message-received-by-server',
                            data: {
                                receiver,
                                messageId: fact.data.messageId
                            }
                        };
                        ChatActions.processFact(receivedByServerFact);
                    },
                    error: (err) => {
                        console.log(err);
                    }
                })
            }, 3000);
        }
    }

    _goBack() {
        DefaultActions.showChats();
    }

    componentDidMount() {
        chatStore.addChangeListener(this._handleStoreChange);

        this.refs.messages.scrollTop = this.refs.messages.scrollHeight;
    }

    componentDidUpdate(prevProps, prevState) {

        if (prevState.messagesCount < this.state.messagesCount) {
            this.refs.messages.scrollTop = this.refs.messages.scrollHeight;
        }
    }

    componentWillUnmount() {
        chatStore.removeChangeListener(this._handleStoreChange);
    }

    _handleStoreChange() {
        this.setState(this._getState(this.props));
    }
}

export default Chat;