const HTMLToolbox = require("../src/htmltoolbox");

//let doc = "<!DOCTYPE html><div>T&nbsp;h<q>is</q> is tete<span>ssss</span>sst.</span><span><span><span></span></span></span>s&#116;.fsdfdsfsfds df dsfs<b class='xxx yyy'>sfdsgf</b><br>fsdgfgte</div><input value=\"tessst\">st ttt";
let doc = "<div>1 and 2 and 3 and 4</div>";

let htb = new HTMLToolbox(doc);
// htb.printNodes()
// for(const val of htb.search(/(\d) and/gm)) {
// 	const m = val.match;
// 	htb.replace(`${m[1]} or`);
// }


for(const val of htb.search(/(\d)/gm)) {
	htb.wrap(`<span>Number <!/></span>`);
}
console.log(htb.getHTML(null));
//htb.printNodes();
console.log("***", htb.getString());

// htb.printNodes()
// // console.log("==================")
// // console.log(htb.getString());
// // console.log("----------------")
// console.log(htb.getHTML());

// //htb.replaceAll( /te(s+)t/gm, 'XXX' );
// htb.replaceAll( 'tessssssst', 'XXX' );
// console.log("==================")
// console.log(htb.getString());
// console.log("----------------")
// console.log(htb.getHTML('  '));

// htb.replaceAll( 'XX', 'YYYY' );
// htb.replaceAll( 'Xz', 'YYYY' );

// htb.replaceAll( 'z', 'Y' );
// console.log("==================")
// console.log(htb.getString());
// console.log("----------------")
// console.log(htb.getHTML());


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
// // console.log(htb.getString());
// // console.log("----------------")


// console.log(htb.getHTML());
// console.log("***", htb.getString());