// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, languages, commands, Disposable, workspace, window, ViewColumn, WebviewPanel } from 'vscode';
import { FuncCodelensProvider, ImpCodelensProvider } from './CodelensProvider';
// import OpenAI from "openai";

// let openai: OpenAI | undefined = undefined;


// import OpenAI from "openai";
import axios from 'axios';

// let openai: OpenAI | undefined = undefined;

// 全局存储一个 access token -> 过期时间对象
let accessToken = {
    expiredTime: 0,
    value: '',
};

let API_KEY = workspace.getConfiguration().get('catsprite.apiKey');
let SECRET_KEY = workspace.getConfiguration().get('catsprite.secretKey');

// let API_KEY = "nsNV04Zle16eOW975rX5mIdH";
// let SECRET_KEY = "zjQz64tRmyTkex6gHI0MGl7tQbly92df";

const ACCESS_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const CHAT_URL = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions';


// 获取 access token
async function fetchAccessToken() {
    const accessTokenRes = await axios.post(ACCESS_TOKEN_URL, null, {
        params: {
            'grant_type': 'client_credentials',
            'client_id': API_KEY,
            'client_secret': SECRET_KEY,
        },
    });
    return accessTokenRes.data.access_token;
}

async function getAccessToken() {
    if (accessToken.value && Date.now() < accessToken.expiredTime) {
        return accessToken.value;
    }
    const token = await fetchAccessToken();
    accessToken = {
        expiredTime: Date.now() + 29 * 86400 * 1000, // 29 days
        value: token,
    };
    return token;
}



async function aiProcess(question: string){
	const messages = [
		{ role: 'user', content: 'act as a cat assistant to give me advice on the code I written. Answer in string and never use markdown string' },
		{ role: 'assistant', content: 'Of course, I\'d love to be your cute cat assistant! 😺 Please share your code with me, and I\'ll do my best to give you some adorable advice!' },
	];
	messages.push({ role: 'user', content: question });
    const token = await getAccessToken();
    const res = await axios.post(
        CHAT_URL,
        { messages },
        { params: { 'access_token': token } }
    );
	let data:string = '';
	if(res){
		data = res['data']['result'];
	}
    console.log(data);
    return data;
}




// show an input box and get api key
export async function ShowInputBox_api() {
	const result = await window.showInputBox({
		ignoreFocusOut: true,
		placeHolder: 'Your Baidu API Key',
		prompt: 'You have not set your API key yet, please enter your API key to use the `Cat Sprite` extension.',
		validateInput: async text => {
			if (text == '') {
				return 'The API Key can not be empty';
			}
		}
	});
	window.showInformationMessage(`Got: ${result}`);
	// Write to user settings
	await workspace.getConfiguration().update("catsprite.apiKey", result, true);
	// Write to workspace settings
	return result;
}

// show an input box and get api key
export async function ShowInputBox_secret() {
	const result = await window.showInputBox({
		ignoreFocusOut: true,
		placeHolder: 'Your Baidu Secret Key',
		prompt: 'You have not set your Secret key yet, please enter your Secret key to use the `Cat Sprite` extension.',
		validateInput: async text => {
			if (text == '') {
				return 'The Secret Key can not be empty';
			}
		}
	});
	window.showInformationMessage(`Got: ${result}`);
	// Write to user settings
	await workspace.getConfiguration().update("catsprite.secretKey", result, true);
	// Write to workspace settings
	return result;
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: Disposable[] = [];
let currentPanel: WebviewPanel;

export async function activate(context: ExtensionContext) {

	// ============================== enable condelens ================================== //
	const funccodelensProvider = new FuncCodelensProvider();
	languages.registerCodeLensProvider("*", funccodelensProvider);

	const ImpcodelensProvider = new ImpCodelensProvider();
	languages.registerCodeLensProvider("*", ImpcodelensProvider);

	// ============================== initialization =================================== //

	// get API key from the user
	if (workspace.getConfiguration().get("catsprite.apiKey") === "") {
		API_KEY = await ShowInputBox_api();
		console.log(API_KEY);
	}

	if (workspace.getConfiguration().get("catsprite.secretKey") === "") {
		SECRET_KEY = await ShowInputBox_secret();
		console.log(SECRET_KEY);
	}

	// ========================= registeration of commands ============================ //

	console.log('Congratulations, your extension "catsprite" is now active!');


	context.subscriptions.push(
		commands.registerCommand('catsprite.helloWorld', () => {
			// executed every time your command is executed
			// Display a message box to the user
			window.showInformationMessage('Meow meow! 🐾🐾Hello, I\'m your adorable cat sprite🐈! ');
			window.showInformationMessage('Even though I\'m not a real cat, I can still keep you company, play with you, and explore the world together!😽 Meow~');
		})
	);

	commands.executeCommand('catsprite.helloWorld');

	context.subscriptions.push(
		commands.registerCommand("catsprite.start", () => {
				currentPanel = window.createWebviewPanel(
				'catCoding',
				'Cat Coding',
				ViewColumn.One,
				{
					enableScripts: true, // 启用JS，默认禁用
					retainContextWhenHidden: true // webview被隐藏时保持状态，避免被重置
				}
			);
			// let iteration = 0;
			// 向 html 传递参数
			const updateWebview = () => {
				// const cat = iteration++ % 2 ? 'Compiling Cat' : 'Coding Cat';
				const cat = 'Coding Cat';
				currentPanel.title = cat;
				currentPanel.webview.html = getWebviewContent();
				// 处理 webview 中的信息
				currentPanel.webview.onDidReceiveMessage(
					message => {
					if (message.method === 'showMessage') {
						window.showInformationMessage(message.params.content);
					}
					},
					undefined,
					context.subscriptions
				);
			};
			updateWebview();


  
			const interval = setInterval(updateWebview, 100000);
			currentPanel.onDidDispose(
				() => {
					// 当面板关闭时，取消webview内容之后的更新
					clearInterval(interval);
				},
				null,
				context.subscriptions
			);
		})
	);
	commands.registerCommand("catsprite.enableCodeLens", () => {
		workspace.getConfiguration("catsprite").update("enableCodeLens", true, true);
	});

	commands.registerCommand("catsprite.disableCodeLens", () => {
		workspace.getConfiguration("catsprite").update("enableCodeLens", false, true);
	});

	commands.registerCommand("catsprite.codelensAction", async (arg: any) => {
		// ask baidu api for advice
		window.showInformationMessage(`😸Cat Sprite is thinking, please waiting...........`);
		const result : string = await aiProcess(arg);
		window.showInformationMessage(`😺Cat Sprite: ${result}$`);
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
	if (disposables) {
		disposables.forEach(item => item.dispose());
	}
	disposables = [];
}

function getWebviewContent() {
	return`
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>PomodoroClock</title>
		<link rel="stylesheet" type="text/css" href="http://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
		<link href="https://fonts.googleapis.com/css?family=Bitter|Sedgwick+Ave+Display" rel="stylesheet">
		<link rel="stylesheet" type="text/css" href="css/style.css">
	    <style>
    /* 弹窗 (background) */
.modal {
    display: none; /* 默认隐藏 */
    position: fixed; 
    z-index: 1; 
    padding-top: 100px; 
    left: 0;
    top: 0;
    width: 100%; 
    height: 100%; 
    overflow: auto; 
    background-color: rgb(0,0,0); 
    background-color: rgba(0,0,0,0.4);
}

/* 弹窗内容 */
.modal-content {
    position: relative;
    background-color: #fefefe;
    margin: auto;
    padding: 0;
    border: 1px #888;
    width: 350px;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
    -webkit-animation-name: animatetop;
    -webkit-animation-duration: 0.4s;
    animation-name: animatetop;
    animation-duration: 0.4s
}

/* 添加动画 */
@-webkit-keyframes animatetop {
    from {top:-300px; opacity:0} 
    to {top:0; opacity:1}
}

@keyframes animatetop {
    from {top:-300px; opacity:0}
    to {top:0; opacity:1}
}

/* 关闭按钮 */
.close {
    color: white;
    float: right;
    font-size: 28px;
    font-weight: bold;
}

.close:hover,
.close:focus {
    color: #ff9743;
    text-decoration: none;
    cursor: pointer;
}

.modal-header {
    padding: 4px 20px;
    background-color: #14A699;
    color: rgb(199, 134, 134);
}

.modal-body {
    padding: 4px 20px;
    margin: auto;
    display: flex;
    justify-content: center;
    background-color: #EBEFE1;
    align-items: center;
    height: 80px;
    font-weight: bold;
}

.modal-footer {
    padding: 2px 20px;
    background-color: #14A699;
    color: white;
    margin: auto;
}
    </style>
		<style>
			*{
		margin: 0;
		padding: 0;
	}
	html,body{
		height: 100%;
		width: 100%;
		background-color: #013E41;
	}
	h1{
		text-align: center;
		margin-top: 5%;
		color: #C6DEE0;
		
	}
	h2{
		text-align: center;
		margin-top: 1%;
		bottom: 2%;
		color: #C6DEE0;
		font-family: 'Sedgwick Ave Display', cursive;
	}
	
	.main{
		margin-top: 5%;
		position: relative;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		height: 70%;
		text-align: center;
	}
	
	.control{
		width: 100%;
		display: flex;
		text-align: center;
		justify-content: center;
	}
	
	.break{
		display: inline;
		padding: 0 30px; 
	}
	.length{
		display: inline;
		padding: 0 30px;
	}
	span{
		font-size: 2em;
		color: #fff;
		font-family: 'Bitter', serif;
	}
	.fa{
		font-size: 1.4em;
		color: #fff;
		cursor: pointer;
		margin: 0 10px;
	}
	
	.control p{
		color: #C6DEE0;
	}
	
	.clock{
		width: 300px;
		height: 300px;
		border-radius: 50%;
		border:4px solid #A6BAAF;
		text-align: center;
		position: relative;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 30px;
		cursor: pointer;
		z-index: 20;
		overflow: hidden;
	}
	
	.clock:before{
		content: '';
		position: absolute;
		border:4px solid #013E41;
		border-radius: 50%;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
	
	.clock h2{
		font-size: 2.5em;
		margin-top: 80px;
		color: #fff;
		font-weight: 1000;
	}
	
	#per{
		margin: 0;
		position: absolute;
		bottom: 0;
		right: 0;
		left: 0;
		height: 0%;
		width: 100%;
		background-color: #C6DEE0; 
		/* background-color: #3f2b36; */
		z-index: -1;
	}
	#cat_right {
		position: absolute;
		bottom: 50px;
		right: -90px;
		opacity: 0;
		transition: .25s ease-in-out
	}
	#cat_right:hover {
		opacity: 1;
		right: 0;
	}
	#cat_left {
		position: absolute;
		bottom: 50px;
		left: -90px;
		opacity: 0;
		transition: .25s ease-in-out
	}
	#cat_left:hover {
		opacity: 1;
		left: -5px;
	}
		</style>
	</head>
	<body>
		<h1>Happy Coding With Cat🐱</h1>
		
		<div class="main">
			<div>
				<img src='https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif' width="200" />
				<h2></h2>
			</div>
			<div class="control">
				<div class="break">
				<p>🐾BREAK LENGTH🐾</p>
					<i class="fa fa-minus-square-o" aria-hidden="true" id="break-minus"></i>
					<span id="break-length">5</span>
					<i class="fa fa-plus-square-o" aria-hidden="true" id="break-plus"></i>
				</div>
				<div class="length">
				<p>🐾SESSION LENGTH🐾</p>
					<i class="fa fa-minus-square-o" aria-hidden="true" id="session-minus"></i>
					<span id="session-length">25</span>
					<i class="fa fa-plus-square-o" aria-hidden="true" id="session-plus"></i>
				</div>
			</div>
			<div>
            <p style="color: #013E41;">hidden cat</p>
				<img id="cat_right" src="https://c-ssl.duitang.com/uploads/item/201805/06/20180506151513_zsrvg.png" width="300" />
				<img id="cat_left" src="https://c-ssl.duitang.com/uploads/blog/202403/14/LyS2mx2jfqjqn4J.png" width="300" />
        	</div>
			<div class="clock">
				<h2 id="show-title">Session</h2>
				<h2 id="show-time">25:00</h2>
				<span id="per"></span>
			</div>
			
		</div>
		<!-- 弹窗 -->
		<div id="Break" class="modal">
			<!-- 弹窗内容 -->
			<div class="modal-content">
				<div class="modal-header">
					<span class="close">&times;</span>
					<h2>😸Time's up !</h2>
				</div>
				<div class="modal-body">
					<p>Your session has ended.🎉 Take a break!</p>
					<p>🐾</p>
				</div>
			</div>  
		</div>
	
		<!-- 弹窗 -->
		<div id="Begin" class="modal">
			<!-- 弹窗内容 -->
			<div class="modal-content">
				<div class="modal-header">
					<span class="close">&times;</span>
					<h2>😸Time's up !</h2>
				</div>
				<div class="modal-body">
					<p>Break time's up! It's time to get back to work!</p>
					<p>🐾</p>
				</div>
			</div>  
		</div>
	
			
	
	<script src='http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js'></script>

	<script>
		const images_compile = [
		'https://media.giphy.com/media/ue5ZwFCaxy64M/giphy.gif',
		'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif',
		'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif'
		];
	
		let currentImageIndex = 0;

		// 获取弹窗
		var Break = document.getElementById('Break');
		// 获取弹窗
		var Begin = document.getElementById('Begin');
	
		// 获取 <span> 元素，用于关闭弹窗 that closes the modal
		var span_break = document.getElementsByClassName("close")[0];
		var span_begin = document.getElementsByClassName("close")[1];
	
		// 点击 <span> (x), 关闭弹窗
		span_break.onclick = function() {
			Break.style.display = "none";
		}
	
		span_begin.onclick = function() {
			Begin.style.display = "none";
		}
	
		// 在用户点击其他地方时，关闭弹窗
		window.onclick = function(event) {
			if (event.target == Break) {
				Break.style.display = "none";
			}
		}
			// 在用户点击其他地方时，关闭弹窗
		window.onclick = function(event) {
			if (event.target == Begin) {
				Begin.style.display = "none";
			}
		}
	
	
		const images_rest = [
		'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
		'https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif',
		'https://media.giphy.com/media/hjLodVpYjLcwo/giphy.gif'
		]
	
		$(document).ready(function(){
		var session = 25;       //这个是默认工作时间，用在设置那儿显示的，这里以分钟为单位，且超过60也是分钟
		var breaklength = 5;    //设置break时长——休息时长,细节同session
		var flag = 1;           //设置工作状态，1是工作的暂停，2是正在休息的暂停，3是在工作中，4是休息中
		var sec = session*60;   //用来记录变化中的时间，单位为秒
		var percent = 0;        //记录背景颜色显示的高度，0-100，是百分比
	
		$("#break-minus").on("click",function(){
			if(flag !== 1 && flag !== 2){
				return;         //如果非暂停状态，点击无效
			}
			breaklength--;
			if(breaklength < 1){
				breaklength = 1;
			}
			$("#break-length").html(breaklength);
			if(flag === 2){
				//如果是休息的暂停，一旦改了，就又对sec产生了修改
				sec = breaklength*60;
			}
			showHMS(breaklength,2);
		});
		$("#break-plus").on("click",function(){
			if(flag !== 1 && flag !== 2){
				return;         //如果非暂停状态，点击无效
			}
			breaklength++;
			$("#break-length").html(breaklength);
			if(flag === 2){
				//如果是休息的暂停，一旦改了，就又对sec产生了修改
				sec = breaklength*60;
			}
			showHMS(breaklength,2);
		});
		$("#session-minus").on("click",function(){
			if(flag !== 1 && flag !== 2){
				return;         //如果非暂停状态，点击无效
			}
			session--;
			if(session < 1){
				session = 1;
			}
			$("#session-length").html(session);
			if(flag === 1){
				//如果是工作的暂停，一旦改了，就又对sec产生了修改
				sec = session*60;
			}
			showHMS(session,1);
		});
		$("#session-plus").on("click",function(){
			if(flag !== 1 && flag !== 2){
				return;         //如果非暂停状态，点击无效
			}
			session++;
			$("#session-length").html(session);
			if(flag === 1){
				//如果是工作的暂停，一旦改了，就又对sec产生了修改
				sec = session*60;
			}
			showHMS(session,1);
		});
	
		//在时钟上显示时分秒，传两个参数，一个是分钟，一个是状态。
		//如果在工作的暂停中，修改休息的时长，不改变时钟上的显示，state有两个取值，取1时表示修改工作时长，取2表示修改休息时长
		var showHMS = function(min,state){
			if(state  !== flag){
				return;         //如果不是在对应的暂停状态，就不改变时钟上显示的值
			}
			var show = "";
			if(min >= 60){
				show += parseInt(min/60)+":";
				min = min%60;
			}
			if(min<10){
				show+="0";
			}
			show+=min+":00";
			$("#show-time").html(show);
		};
	
	
	
	
		//开始后时间的变化,参数是剩下的秒数
		function timeChange(){
			var temp = sec;
			if(flag === 1 || flag === 2){
				//如果是暂停中，就不变时间
				const imageElement = document.querySelector('.main img');
				imageElement.src = images_rest[currentImageIndex];
				return;
			}
			if(sec === 0){
				if(flag === 3){
					Break.style.display = "block";
					flag = 4;
					sec = breaklength*60;
					$("#show-title").html("Break");
				}else{
					Begin.style.display = "block";
					flag = 3;
					sec = session*60;
					$("#show-title").html("Session");
				}
	
			}
	
			var showHMS = "";
			if(temp>=3600){
				showHMS+=parseInt(second/360)+":";
				temp = temp%360;
			}
			if(temp<70){
				showHMS+="0";
			}
			showHMS+=parseInt(temp/60)+":";
			temp = temp%60;
			if(temp<10){
				showHMS+="0";
			}
			showHMS+=temp;
	
	
			//console.log(showHMS);
			$("#show-time").html(showHMS);
			if(flag === 3){
				//工作中
				const imageElement = document.querySelector('.main img');
				imageElement.src = images_compile[currentImageIndex];
	
				$("#per").css('background-color','#b5caa0');
				if(sec === 0){
					percent = 100;
				}else{
					percent = (session*60-sec)/session/60*100;
				}
				$("#per").css('height',percent+'%');
			}
			if(flag === 4){
				//休息中
				const imageElement = document.querySelector('.main img');
				imageElement.src = images_rest[currentImageIndex];
	
				$("#per").css('background-color',"#D2D3D5");
				if(sec === 0){
					percent = 100;
				}else{
					percent = (breaklength*60-sec)/breaklength/60*100;
				}
				$("#per").css('height',percent+'%');
			}
			sec--;
			setTimeout(timeChange,1000);
		};
	
		//时钟点击事件——开始与暂停的转换，及开始后时间的变化
		$(".clock").on("click",function(){
			if(flag === 1){
				flag = 3;
			}else if(flag === 3){
				flag = 1;
			}else if(flag === 2){
				flag = 4;
			}else if(flag === 4){
				flag = 2;
			}
	
			//console.log(sec);
			timeChange();
		})
	
		// 定时切换图片
		setInterval(() => {
			// 更新图片索引
			currentImageIndex = (currentImageIndex + 1) % 3;
			// 获取图片元素
			const imageElement = document.querySelector('.main img');
			if(flag == 3){
				imageElement.src = images_compile[currentImageIndex];
			}
			else{
				imageElement.src = images_rest[currentImageIndex];
			} 
		}, 30000); // 30秒切换一次图片
	
	});
	</script>
	</body>
	</html>
		`;
  }