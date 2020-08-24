import React from "react";
import SplitPane from "react-split-pane";
import "./editor.css";
import {Tabs} from "antd";
// import Pdf from "react-to-pdf";
import {subscribeToTimer} from "../api";
import Navbar from "../components/Navbar/navbar";
import CodeEditor from "../components/CodeEditor/codeEditor";
import DocPreview from "../components/DocPreview/docPreview";
import MyContext from "../context/MyContext";

import socketIOClient from "socket.io-client"

const client = socketIOClient("http://localhost:3000")

const {TabPane} = Tabs;
const ref = React.createRef();

// Backend Integration : Route to rename document on change (Might have to introduce commit function when focus changed from input to minimize backend calls)
// Backend Integration : Route to fetch Document Data directly from Backend based on url param instead of context Api to limit app re render events.

class Editor extends React.Component {
	static contextType = MyContext;
	constructor(props) {
		super(props);
		subscribeToTimer((err, timestamp) =>
			this.setState({
				timestamp,
			})
		);
	}
	state = {
		timestamp: "no timestamp yet",
		Document: "",
		Modified: false,
	};
	componentDidMount = () => {
		let CurrentDoc = this.context.documents.find((doc) => {
			return doc.id === this.props.match.params.doc;
		});
		this.update = setInterval(() => {
			if (this.state.Modified) {
				client.emit('cmd', (this.state.Output));
				this.setState({Modified: false})
			}
		}, 2000)
		client.on('cmd', (response) => {
			this.setState({op: response})
			console.log(response)
		})
		this.setState({Document: CurrentDoc});
	};

	componentWillUnmount() {
		clearInterval(this.update);
	}

	pdfConvert = () => {};

	handleback = () => {
		this.props.history.goBack();
	};

	handleLogout = () => {
		this.props.history.push("/");
		this.context.Logout();
	};

	handleRename = (e) => {
		this.setState({Document: {name: e.target.value}});
		// BackendIntegration : Rename Call here
		client.emit('cmd', (e.target.value))
	};

	handleCode = (value) => {
		this.setState({
			Modified: true,
			Output: value
		})
	}


	render() {
		let small = 480;
		return (
			<div className="EditorBackground">
				<Navbar back={this.handleback} logout={this.handleLogout} Rename={this.handleRename} >{this.state.Document.name}</Navbar>

				<div className="DocumentContainer" >
					{window.innerWidth > small ? (
						<SplitPane split="vertical" defaultSize={600} primary="second">
							<div >
								<CodeEditor codeStream={this.handleCode}></CodeEditor>
							</div>
							<div ref={ref}>
								<DocPreview>{this.state.op}</DocPreview>
							</div>
						</SplitPane>
					) : (
							<Tabs type="card">
								<TabPane tab="Groff" key="1">
									Content of Tab Pane 1
						</TabPane>
								<TabPane tab="Preview" key="2">
									Content of Tab Pane 2
						</TabPane>
							</Tabs>
						)}
				</div>
			</div>
		);
	}
}
export default Editor;
