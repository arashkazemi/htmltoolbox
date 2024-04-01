const HTMLToolbox = require("../src/htmltoolbox");

let doc = "<!DOCTYPE html><div>T&nbsp;h<q>is</q> is tete<span>ssss</span>sst.</span><span><span><span></span></span></span>s&#116;.fsdfdsfsfds df dsfs<b class='xxx yyy'>sfdsgf</b><br>fsdgfgte</div><input value=\"tessst\">st ttt";
//let doc = "<div>1 and 2 and 3 and 4</div>";
// let doc = `
// <p><strong>Convert a HTML document to its rendered text</strong>, while being as close as possible to what is
// rendered by browser. For example <code>&lt;b&gt;HTML&lt;/b&gt;Toolbox</code> will be converted to <code>HTMLToolbox</code>,
// or <code>&lt;input value='HTML'&gt;Toolbox</code> <br><br>will be rendered as <code>HTML Toolbox</code>. Even less used tags like <code>&lt;q&gt;</code>
// are supported, for tessssssst tesssssssssssst example <code>&lt;q&gt;HTML&lt;/q&gt;Toolbox</code> will be rendered as <code>"HTML"Toolbox</code>. Stylesheets
// and scripts are also automatically detected and neglected in rendered text.</p>
// `;


let htb = new HTMLToolbox(doc);
//htb.printNodes();

console.log(">>>", htb.getText());

for(const val of htb.search(/HTMLToolbox/igm)) {
	const m = val.match;
	htb.wrap(`<span><!/></span>`);
}

console.log(">>>", htb.getHTML(null));
console.log(">>>", htb.getText());


for(const val of htb.search(/(\d)/gm)) {
	htb.wrap(`<span>Number <!/></span>`);
}
console.log(htb.getHTML(null));
//htb.printNodes();
console.log("***", htb.getText());

// htb.printNodes()
// // console.log("==================")
// // console.log(htb.getText());
// // console.log("----------------")
// console.log(htb.getHTML());

htb.replaceAll( /te(s+)t/gm, 'XXX' );
htb.replaceAll( 'tessssssst', 'XXX' );
console.log("==================")
console.log(htb.getText());
console.log("----------------")
console.log(htb.getHTML('  '));

//htb.replaceAll( 'XX', 'YYYY' );
//htb.replaceAll( 'Xz', 'YYYY' );

htb.replaceAll( 'z', 'Y' );
console.log("==================")
console.log(htb.getText());
console.log("----------------")
console.log(htb.getHTML());


// for(const val of htb.search(/te(s+)t/gm)) {
// 	//console.log("@@", val)
// 	//if(val.start_node.name==='div') {
// 		//console.log("****", val.start_node);
// 		//htb.setAttribute(val.start_node, "value", "21312  312");
// 		htb.wrap( "<div class='QQQ'><q></q>QQQ <!/></div>" );
// 	//}
// // 	console.log(val.start_node);
// // 	//htb.replace(replace_with, replace_at);
// }

// htb.apply();

// //htb.printNodes();

// // htb.replaceAll( 'YY', '' );
// //htb.replaceAll( /YY/gm, '' );
// // console.log("==================")
// // console.log(htb.getText());
// // console.log("----------------")


// console.log(htb.getHTML());
// console.log("***", htb.getText());