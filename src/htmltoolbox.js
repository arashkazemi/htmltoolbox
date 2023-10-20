/*
	HTMLToolbox
	Copyright (C) 2023 Arash Kazemi <contact.arash.kazemi@gmail.com>
	All rights reserved.

	Distributed under BSD-2-Clause License:

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	  * Redistributions of source code must retain the above copyright
		notice, this list of conditions and the following disclaimer.
	  * Redistributions in binary form must reproduce the above copyright
		notice, this list of conditions and the following disclaimer in the
		documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


const Html5Parser = require('html5parser');
const Dentity = require('dentity');

class HTMLToolbox {

	static BEGIN  = Infinity;
	static END    = -Infinity;
	static AFTER  = Infinity;
	static BEFORE = -Infinity;

	separators = {

		'a'			: '',
		'abbr'		: '',
		'acronym'	: '',
		'b'			: '',
		'bdo'		: '',
		'big'		: '',
		'br'		: '',
		'cite'		: '',
		'dfn'		: '',
		'em'		: '',
		'hr'		: '',
		'i'			: '',
		'kbd'		: '',
		'span'		: '',
		'sub'		: '',
		'sup'		: '',
		'script'	: '',
		'style'		: '',

		'q'			: '"',

		'div'		: '\n',
		'h1'		: '\n',
		'h2'		: '\n',
		'h3'		: '\n',
		'h4'		: '\n',
		'quote'		: '\n',
		'p'			: '\n',

		'tr'		: '\n',
		'td'		: '\t',

		/* for other tags, default separator ' ' will be applied.
		'code'		: ' ',
		'img'		: ' ',
		'map'		: ' ',
		'button'	: ' ',
		'input'		: ' ',
		'label'		: ' ',
		*/
	}

	lineBreakTags = ['br', 'hr'];
	noCloseTags = [...this.lineBreakTags, 'img', 'input'];
	rawTags = ['script', 'style'];

	defaultSeparator = ' ';
	deleteEmpty = true; // only changed
	convertNbspToSpace = false;
	processInputValues = true;

	// todo:
	//indexTags = true;
	//indexClasses = false;
	//indexValues = false;

	static #space_regex = /(\s+)/gm;


	#change_list = [];
	#current_match = null;

	#input;

	// todo: flat_nodes should be the root of the tree, not the array of document nodes.
	#flat_nodes;
	#flat_str;

	#config_options =  [
			"separators",
			"lineBreakTags",
			"noCloseTags",
			"rawTags",
			"defaultSeparator",
			"deleteEmpty",
			"convertNbspToSpace",
			"processInputValues",
			"indexTags"
		];

	isWhitespace = (v)=>(v.length>0 && (v[0]===' ' || v[0]==='\t' || v[0] ==='\n' || v[0]==='\f'/* || v[0]===' '*/));

	/**
	* Creates an instance of HTMLToolbox.
	* There can be multiple instances and each can be configured separately.
	* 
	* @constructor
	* 
	* @param {string} input - The input string containing the HTML document.
	* 
	* @param {object} config - (optional) The configuration, which is optional. 
	* It can contain any of the list below: 
	* 
	* `separators`: a dictionary of defined tags and their rendered separators,
	* i.e. `"` for `q` and `\n` for `div`. see the source code for more examples.
	* 
	* `lineBreakTags`: a list of line break tags, it contains `br` and `hr`
	* by default.
	* 
	* `noCloseTags`: these are the tags that don't contain children, like `img`
	* or `br`.
	*  
	* `rawTags`: these are the tags that are not HTML encoded, like scripts.
	* 
	* `defaultSeparator`: this is the default tag separator, which is a blank
	* space by default.
	* 
	* `deleteEmpty`: if set, the empty elements in the remove or replace region 
	* will be deleted completely. it is `true` by default.
	* 
	* `convertNbspToSpace`: this is for the cases when you want to treat nbsp 
	* entities as normal spaces. it is `false` by default.
	* 
	* `processInputValues`: If set to false, input field values will not be rendered.
	* it is set to `true` by default which means input values will be rendered 
	* as text.
	* 
	*/

	constructor(input, config)
	{
		if(config!==undefined) {
			for(let c in config) {
				if(this.#config_options.indexOf(c)!==-1) {
					this[c] = config[c];
				}
			}
		}

		this.#input = input;

		let flat = this.#flatten(input);
		this.#flat_str = flat.str;
		this.#flat_nodes = flat.nodes;
	}

	*#traverse(nodes, include_seps=true)
	{
		let i = 0;

		while(i<nodes.length) {

			const node = nodes[i];

			if(node.body) {
				yield { node:node, i: i, container: nodes, exit: false };

				for (const val of this.#traverse(node.body)) {
					if(val.node) {
						if(include_seps || node.type!=='Sep') {
							yield val;
						}
					}
				}

				yield { node:node, i: i, container: nodes, exit: true };
			}
			else {
				yield { node:node, i: i, container: nodes, exit: true };
			}

			i++;
		}
		return { node:null, exit: true }
	}

	#preprocess(inp)
	{

		let nodes = Html5Parser.parse(inp);
		const parent_stack = [null];

		for(const val of this.#traverse(nodes)) {

			let node = val.node;

			if(val.exit===false) {
				parent_stack.push(node);
			}
			else {
				if(parent_stack[parent_stack.length-1]===node) {
					parent_stack.pop();
				}
				node.parent = parent_stack[parent_stack.length-1];
			}


			if(node.type==='Tag' && !node.body) {
				node.body = [];
			}

			if(node.type==='Tag' && node.name &&
				(node.name==="" || node.name==="script" || node.name==="style" || node.name.startsWith("!"))
				) {
				// node is not rendered
			}
			else {

					// break the text nodes by whitespace segments

				if(node.type=='Tag') {

					if(this.lineBreakTags.indexOf(node.name)!==-1) {
						const nd =  [
										{
											value: '',
											type: 'Sep',
											parent: node
										},
										{
											type: "Text",
											value: "&#10;",
											parent: node
										},
										{
											value: '',
											type: 'Sep',
											parent: node
										}
									];

						node.body.push(...nd);
					}
					else {
							// find the separators of the containers

						let sep='';

						if(node.name!==undefined) {
							sep = this.separators[node.name];

							if(sep===undefined) {
								sep = this.defaultSeparator;
							}
						}

						let seg = {
							value: sep,
							type: 'Sep',
							parent: node
						};

						if(val.exit===false) {
							node.body.splice(0,0,seg);
						}
						else {
							node.body.push(seg);

							if(node.body.length===1) {

								if(node.name==='input' && this.processInputValues===true) {
									let is_hidden = false;
									for(let a in node.attributes) {
										if(node.attributes[a].name.value==='type') {
											if(node.attributes[a].value.value==='hidden') {
												is_hidden = true;
												break;
											}
										}
									}
									
									if(is_hidden) continue;

									for(let a in node.attributes) {
										if(node.attributes[a].name.value==='value') {
											const nd =  {
												type: "Text",
												value: node.attributes[a].value.value,
												parent: node,
											};
											node.body.push(nd);
												//node.outer = inp.slice(node.start, node.end);
										}
									}
								}
								node.body.push({...seg});
							}
						}

					}
				}

				if(node.type=='Text') {

					const vs = node.value.split(HTMLToolbox.#space_regex);
					if(vs[0]==='') vs.splice(0,1);
					if(vs[vs.length-1]==='') vs.pop();

					let segs = [];

					for(let v of vs) {
						let nd = {
							value: v,
							type: node.type,
							parent: node.parent,
						};

						segs.push(nd);
					}

					val.container.splice(val.i,1,...segs);
				}

				if(val.exit===false) {
				}
				else {
					// make attribute positions relative

					for(let a in node.attributes) {
						const s = node.start;

						// note: by standard all html attributes should be lowercase.
						node.attributes[a].name.value = node.attributes[a].name.value.toLowerCase();
						if( node.attributes[a].value!==undefined ) {
							node.attributes[a].value.start -= s;
							node.attributes[a].value.end -= s;
							if(node.attributes[a].value.quote===undefined) {
								node.attributes[a].value.quote='';
							}
						}

							// simplify the tree, this is only to ease debugging
						delete node.attributes[a].name.start;
						delete node.attributes[a].name.end;
						delete node.attributes[a].start;
						delete node.attributes[a].end;
					}

				}
			}

			//node.close = this.noCloseTags.indexOf(node.name)===-1;

			// simplify the tree, this is only to ease debugging
			// if(node.start!==undefined) {
			delete node.start;
			delete node.end;
			delete node.open;
			delete node.attributeMap;

		}

		return nodes;
	}

	#flatten(nodes, prev_node, next_node, detect_wraps=false)
	{
		let wrap_site_c;
		let wrap_site_i;
		let wrap_site_p;
		let offset = 0;

		if(!prev_node && next_node) {
			prev_node = next_node.prev;
		}

		if(prev_node && prev_node.str_index) {
			offset = prev_node.str_index+prev_node.value.length;
		}

		let str = '\n';
		let str_last_chr = '\n';

		if(typeof(nodes)==='string') {
			nodes = this.#preprocess(nodes);
		}

		let prev = nodes;
		let node;

		for(const val of this.#traverse(nodes)) {

			node = val.node;

			if(node.type==='Sep') {
				node.mod_offset = 0;
				node.str_index = str.length + offset;
				node.prev = prev;
				prev.next = node;
				prev = node;

				if( this.isWhitespace(node.value) && this.isWhitespace(str_last_chr) ) {
					if(node.value==='\n' && str_last_chr!=='\n') {
						str = str.slice(0,str.length-1)+'\n';
						str_last_chr ='\n';
					}
				}
				else if(node.value!=='') {
					str += node.value;
					str_last_chr = node.value;
				}

			}

			else if(node.type==='Text') {

				let nx = val.container[val.i+1];
				while( nx && nx.type==='Text' && 
					   (this.isWhitespace(node.value)===this.isWhitespace(nx.value) || nx.value==='' || node.value==='') 
				) {
					node.value+=nx.value;
					val.container.splice(val.i+1, 1);
					nx = val.container[val.i+1];
				}

				node.mod_offset = 0;
				node.str_index = str.length + offset;

				if( this.isWhitespace(node.value) && this.isWhitespace(str_last_chr) ) {
					if(node.value==='\n' && str_last_chr!=='\n') {
						str = str.slice(0,str.length-1)+'\n';
						str_last_chr ='\n';
					}
				}
				else {

					if(this.isWhitespace(node.value)) {
						str += node.value[0];
					}
					else {

						if( this.isWhitespace(node.value) &&
							this.isWhitespace(str_last_chr) &&
							prev && prev.type==='Sep' && str.length>1 )
						{
							str = str.slice(0,str.length-1);
							str_last_chr = str[str.length-1];
							node.str_index = str.length + offset;
						}
						if(node.parent && this.rawTags.indexOf(node.parent.name)===-1) {
							str += Dentity.decode(node.value, false, this.convertNbspToSpace);
						}
						else if(!node.parent) {
							str += node.value;
						}

					}
					str_last_chr = str[str.length-1];
				}

				node.prev = prev;
				prev.next = node;
				prev = node;
			}
			else if(detect_wraps && node.type==='Tag' && node.name==='!') {
				wrap_site_i = val.i;
				wrap_site_c = val.container;
				wrap_site_p = node.parent;
			}
		}


		if(this.isWhitespace(str_last_chr) && str.length>1) {
			str = str.substr(0,str.length-1);
			str_last_chr = str[str.length-1];
		}

		return { str:str, nodes:nodes, wrap_site_i:wrap_site_i, wrap_site_c:wrap_site_c, wrap_site_p:wrap_site_p };
	}

	#findMatchRange(index, len)
	{
		let sn, so, en, eo;

		let node = this.#flat_nodes.next;

		while(node.next && (node.next.str_index)<index) {
			node = node.next;
		}
		while(node.type==='Sep') node=node.next;
		sn = node;
		so = index - node.str_index;

		while(node.next && (node.next.str_index)<index+len) {
			node = node.next;
		}
		while(node.type==='Sep') node=node.prev;

		en = node;
		eo = index + len - node.str_index;

		return { sn:sn, so:so, en:en, eo:eo };
	}

	#relativeInsert( nodes, anchor, loc )
	{
		let nds;

		let i,p;

		if( anchor.parent && this.lineBreakTags.indexOf(anchor.parent.name)!==-1 ) {
			i = anchor.parent.indexOf(anchor);
			anchor = anchor.parent;
		}

		if(anchor.parent) {
			p = anchor.parent.body;
		}
		else {
			p = this.#flat_nodes;
		}

		i = p.indexOf(anchor);

		if(i===-1) {
			throw('error in tree')
		}

		if(loc===HTMLToolbox.AFTER) {
			nds = this.#flatten(nodes, anchor, anchor.next);
			i++;
		}
		else if(loc===HTMLToolbox.BEFORE) {
			nds = this.#flatten(nodes, anchor.prev, anchor);
		}

		// todo: this should be assessed later
		// else {
		// 	i = loc;
		// 	nds = this.#flatten(nodes, anchor, anchor.next);
		// }

		if(anchor.parent && anchor.parent.name==='input') {

			const node = {
				type: "Text",
				value: nds.str,
				parent: anchor.parent,
				mod_offset: 0
			};

			if(loc===HTMLToolbox.AFTER) {
				node.prev = anchor;
				node.next = anchor.next;

				if(anchor.next) {
					anchor.next.prev = node;
				}
				anchor.next = node;
			}
			else if(loc===HTMLToolbox.BEFORE) {
				node.prev = anchor.prev;
				node.next = anchor;

				if(node.prev) {
					node.prev.next = node;
				}
				anchor.prev = node;
			}

			nds.nodes = [node];
		}
		else {
			for(let n of nds.nodes) {
				n.parent = anchor.parent;
			}
		}

		p.splice( i, 0, ...nds.nodes );

		return nds;
	}

	#doReplace(ch)
	{

		this.#doRemove(ch);

		let sn = ch.match.start_node;
		let en = ch.match.end_node;

		if(ch.at===HTMLToolbox.BEGIN) {
			this.#relativeInsert(ch.with, sn, HTMLToolbox.AFTER);
		}
		else if(ch.at===HTMLToolbox.END) {
			this.#relativeInsert(ch.with, en, HTMLToolbox.BEFORE);
		}
		else {
			throw "error in replace position";
		}
	}

	#doInsert(ch)
	{
		let node = ch.node;

		if(ch.at===HTMLToolbox.BEGIN) {
			this.#relativeInsert(ch.what, node, HTMLToolbox.AFTER);
		}
		else if(ch.at===HTMLToolbox.END) {
			this.#relativeInsert(ch.what, node, HTMLToolbox.BEFORE);
		}
		else {
			throw "error in insert position";
		}
	}

	#doRemove(ch)
	{
		const mch = ch.match;
		const mlen = mch.match[0].length;

		let sn = mch.start_node;
		let en = mch.end_node;

		let l = sn.value.length;


		if(sn===en) {

			sn =  {
				type: "Text",
				value: sn.value.slice(0, mch.start_offset-sn.mod_offset),
				parent: sn.parent,
				mod_offset: 0
			};

			// en is the old sn, this is because the next replacements will point
			// to the unchanged node, and the mod_offset is to fix the created 
			// difference when applying the changes one by one. the imp/ort/ant case
			// is when multiple matches are inside one node.

			en.value = en.value.slice(mch.end_offset-en.mod_offset); 
			en.mod_offset = mch.end_offset;

			if(sn.parent) {
				sn.parent.body.splice( sn.parent.body.indexOf(en), 0, sn );
			}
			else {
				this.#flat_nodes.splice( this.#flat_nodes.indexOf(en), 0, sn );
			}

			sn.prev = en.prev;
			if(sn.prev) {
				sn.prev.next = sn;
			}
			en.prev = sn;
			sn.next = en;			
			mch.end_offset = 0;

		}
		else {
			sn.value = sn.value.slice(0,mch.start_offset);
			en.value = en.value.slice(mch.end_offset-en.mod_offset);
			en.mod_offset = mch.end_offset;

			if(sn.next!==en) {
				this.#clearRange(sn.next, en.prev);
			}

			sn.next = en;
			en.prev = sn;
		}
	}

	#doWrap(ch)
	{
		// todo: should wrap as up as possible

		const mch = ch.match;

		let sn = mch.start_node;
		let en = mch.end_node;


		let sep = this.separators[ch.tag];
		if(sep===undefined) {
			sep = this.defaultSeparator;
		}


		while(sn) {

			let body = [];
			let p;

			if(sn.parent) {
				p = sn.parent.body;
			}
			else {
				p = this.#flat_nodes;
			}


			while( 	(body.length===0 || sn.parent===body[body.length-1].parent) && 
					(sn.type==='Text' || sn.type==='Tag') ) 
			{
				body.push(sn);

				if(sn===en) break;
				sn=sn.next;
			}


			if(body.length>0) {

				let env = this.#flatten(ch.envelope, body[0].prev, body[body.length-1].next, true);

				if(body.length===p.length-2) {
					body = [body[0].parent];
				}

				env.wrap_site_c.splice( env.wrap_site_i, 1, ...body );

				for(let n of body) {
					n.parent = env.wrap_site_p;
				}

				p.splice(p.indexOf(sn), 1, ...env.nodes);

				for(let n of env.nodes) {
					n.parent = p;
				}
			}

			if(sn===en) break;

			sn=sn.next;
		}

	}

	#doSetAttribute(ch)
	{
		let node = ch.node;

		let sep = this.separators[ch.tag];
		if(sep===undefined) {
			sep = this.defaultSeparator;
		}

		ch.attr = ch.attr.toLowerCase();
		ch.value = Dentity.encode(ch.value);

		if(node.type==='Sep' || node.type==='Text') {
			//throw 'cannot set attributes for separator and text nodes, they are virtual.'
			return;
		} 

		for(let a in node.attributes) {
			if(node.attributes[a].name.value===ch.attr) {
				delete node.attributes[a];
				break;
			}
		}


		ch.value = Dentity.encode(ch.value);

		node.attributes.push({
            "name": {
              "value": ch.attr,
              "type": "Text"
            },
            "value": {
              "value": ch.value,
              "quote": "\""
            }
          });

		if(node.name==='input' && ch.attr==='value' && this.processInputValues===true) {

			const vs = ch.value.split(HTMLToolbox.#space_regex);
			if(vs[0]==='') vs.splice(0,1);
			if(vs[vs.length-1]==='') vs.pop();

			let segs = [];

			for(let v of vs) {
				let nd = {
					value: v,
					type: "Text",
					parent: node,
				};

				segs.push(nd);
			}
			node.body = [node.body[0], ...segs, node.body[node.body.length-1]];
		}
	}

	#doSetTag(ch)
	{
		let node = ch.node;

		let sep = this.separators[ch.tag];
		if(sep===undefined) {
			sep = this.defaultSeparator;
		}

		if(this.lineBreakTags.indexOf(ch.tag)!==-1) {

			let p = this.#flat_nodes;
			if(node.parent) {
				p = node.parent.body;
			}
			
			const nd =  {
				"type": "Tag",
				"name": ch.tag,
				"rawName": ch.tag,
				"attributes": [],
				"body": [
				{
					"value": sep,
					"type": "Sep",
				},
				{
					"type": "Text",
					"value": "\n",
				},
				{
					"value": sep,
					"type": "Sep",
				},
				],
				"close": null,
				parent: p
			};


			p.splice( p.indexOf(node), 1, nd );
			for(let n of nd.body) {
				n.parent = nd;
			}

		}

		else {

			if(node.type==='Sep') {
				//throw 'cannot modify separator nodes, they are virtual.'
				return;
			} 

			if(node.type==='Text') {

				if(node.parent && (node.parent.name==='input' || this.lineBreakTags.indexOf(node.parent.name)!==-1)) {
					//throw "can't set tag inside an input element";
					return;
				}				

				let p = this.#flat_nodes;
				if(node.parent) {
					p = node.parent.body;
				}

				const nd =  {
					"type": "Tag",
					"name": ch.tag,
					"rawName": ch.tag,
					"attributes": [],
					"body": [
						{
							"value": sep,
							"type": "Sep",
							"next": node,
							"prev": node.prev
						},
						node,
						{
							"value": sep,
							"type": "Sep",
							"prev": node,
							"next": node.next
						}
					],
					"close": this.noCloseTags.indexOf(ch.tag)===-1,
					parent: p
				};

				p.splice( p.indexOf(node), 1, nd );
				for(let n of nd.body) {
					n.parent = nd;
				}

				node.prev = nd.body[0];
				node.next = nd.body[2];
			} 
			else {

				if(node.name==='input' && this.processInputValues===true) {
					for(let a in node.attributes) {
						if(node.attributes[a].name.value==='value') {
							delete node.attributes[a];
							break;
						}
					}
				}

				node.name = ch.tag;
				node.close = this.noCloseTags.indexOf(ch.tag)===-1;
				node.rawName = ch.tag;


				if(node.body[0].type==='Sep') {
					node.body[0].value = sep;
				}
				if(node.body[node.body.length-1].type==='Sep') {
					node.body[node.body.length-1].value = sep;
				}

			}
		}

		//this.#flatten(this.#flat_nodes);
	}


	#clearRange(start, end)
	{
		while(start) {

			if(start.type==='Text') {

				// todo: can be faster
				if(start.parent) {
					start.parent.body.splice( start.parent.body.indexOf(start), 1 );
				}
				else {
					this.#flat_nodes.splice( this.#flat_nodes.indexOf(start), 1 );
				}

				if(this.deleteEmpty) {

					let p = start.parent;

					while(p) {

						// note: should the routine check for whitespace or no separator parents?
						// no the begin and end nodes are excluded from this search.

						if( (p.type==='Tag' && p.body.length===2) || p.body.length===0 ) {

							if(p.type==='Tag' && p.body.length===2) {
								if(p.body[0].prev) {
									p.body[0].prev.next = p.body[1].next;
								}
								if(p.body[1].next) {
									p.body[1].next.prev = p.body[0].prev;
								}
							}

							if(p.parent) {
								p.parent.body.splice( p.parent.body.indexOf(p), 1 );
								p = p.parent;
							}
							else {
								this.#flat_nodes.splice( this.#flat_nodes.indexOf(p), 1 );
								p = null;
							}
						}
						else {
							break;
						}
					}
				}
				else if(start.parent && this.lineBreakTags.indexOf(start.parent.name)) {
					// todo: should be tested

					if(start.parent.parent) {
						start.parent.parent.body.splice( start.parent.parent.body.indexOf(start.parent), 1 );
					}
					else {
						this.#flat_nodes.splice( this.#flat_nodes.indexOf(start.parent), 1 );
					}
				}

				if(start.prev) {
					start.prev.next = start.next;
				}
				if(start.next) {
					start.next.prev = start.prev;
				}


			}

			else {
				if(this.deleteEmpty && start.type==='Sep' && 
					start.prev && start.prev.type==='Sep' && 
					start.prev.parent===start.parent) {

					if(start.parent.parent) {
						start.parent.parent.body.splice( start.parent.parent.body.indexOf(start.parent), 1 );
					}
					else {
						this.#flat_nodes.splice( this.#flat_nodes.indexOf(start.parent), 1 );
					}

					if(start.prev.prev) {
						start.prev.prev.next = start.next;
					}
					if(start.next) {
						start.next.prev = start.prev.prev;
					}
				}
			}

			if(start===end) return;
			start=start.next;

		}

	}

	#elementOpen(node)
	{
		let s = "<"+node.rawName;
		let n = node.attributes.length;

		for(let i in node.attributes) {

			let a = node.attributes[i];

			if(i<n) s+=' ';

			s+=a.name.value;

			if(a.value!==undefined) {
				s+=`=${a.value.quote}${a.value.value}${a.value.quote}`;
			}
		}

		if(this.lineBreakTags.indexOf(node.name)!==-1 && node.close!==null) {
			return `${s}/>`;
		}

		return `${s}>`;
	}

	#getHTML(indent='\t', col='', nodes=this.#flat_nodes)
	{
		// todo: there should be an option for keeping the initial html string
		// the same as far as possible.

		this.apply();

		let hs = "";
		let prev = nodes[0].prev;
		for(let n of nodes) {
			if(n.type==="Text") {
				if(indent!==null && this.isWhitespace(n.value)) {
					if(nodes===this.#flat_nodes) {
						if(n===nodes[0] || n===nodes[nodes.length-1])
							continue;
					}
					else {
						if(n===nodes[1] || n===nodes[nodes.length-2])
							continue;
					}
				}
				if(prev && prev.type==='Sep' && indent!==null) {
					hs+='\n'+col;
				}

				hs+=n.value;
			}
			else if(n.type==="Tag") {

				if(n.name==='input' && this.processInputValues===true) {
					let v ="";

					for(let i=1; i<n.body.length-1; i++) {
						v+=n.body[i].value;
					}

					let st = 0;

					for(let a in n.attributes) {
						if(n.attributes[a].name.value==='value') {
							if(n.attributes[a].value) st=n.attributes[a].value.start;
							n.attributes.splice(a,1);
						}
					}

					n.attributes.push(  {
						"name": {
							"value": "value",
							"type": "Text"
						},
						"value": {
							"start": st,
							"end": st+v.length,
							"value": v,
							"quote": "\""
						}
					} );

					// todo: fix outer?
				}

				hs+=((hs[hs.length-1]!=='\n' && indent!==null)?'\n':'')+col+this.#elementOpen(n);

				if(n.close!==null) {
					if(n.body.length>2) {
						hs+=this.#getHTML(indent, indent!==null?col+indent:'', n.body);
						hs+=`${((hs[hs.length-1]!=='\n' && indent!==null)?'\n':'')}${col}</${n.rawName}>`;
					}
					else {
						hs+=`</${n.rawName}>`;
					}
				}
				else if(hs[hs.length-1]!=='\n' && indent!==null) {
					hs+='\n';
				}
			}
			prev = n;
		}

		return hs;
	}


	// Public Methods

	/**
	* Searches for the given query and the results are yielded in a generator.
	* You may process them in a loop, or by consecutive calls to .next() function.
	* 
	* 	let htb = new HTMLToolbox(doc);
	* 
	* 	for(const val of htb.search(/te(s+)t/gm)) {
	* 		htb.remove();
	* 	}
	* 
	* Inside the loop block you may call one of the modifier functions, which
	* include `remove`, `insert`, `replace`, `wrap`, and `setTag` and `setAttribute`. The 
	* first 4 ones are all applied to the whole match, but `setTag` and
	* `setAttribute` are applied to specific nodes. See each function documentation
	* for more details.
	* 
	* The object that is returned by the generator has the following members:
	* 
	* `match`: {index, 0, 1, ...} which is similar to js regex match results, `index`
	* is the location of the match in the rendered text, and the rest is an array.
	* 
	* `start_node`: is the node of the tree that contains the beginning of the
	* match.
	* 
	* `end_node`: is the node that contains the end of the match.
	* 
	* `start_offset`: is the index of the character in the start node value which is the 
	* beginning of the match.
	* 
	*`end_offset`: is the index of the last character of the match in the end node.
	* 
	* ### Nodes
	* 
	* Each node has properties like attributes, name, rawName and type. They type may
	* be `Tag`, `Text` and `Sep`. Text nodes are the leaves of the HTML tree. The Sep
	* nodes are rendered separators. They are not modifiable. If you need a different
	* separator for a specific tag, change the `separators` dictionary of the HTMLToolbox
	* instance you are working with.
	* 
	* Each node also has a `body` that contains the separators and its children. It
	* also has a `next` and `prev` which point the next and previous **rendered** nodes.
	* You may also want to use its `parent` to go up in the hierarchy.
	* 
	* Note that on some occasions both nodes might be the same.
	* 
	* @param {} query - a string or regexp to search for in the rendered text of the 
	* document. If not provided, search will traverse over all the document. 
	* 
	*/

	*search(query,data)
	{

		this.apply();

		if(data===undefined) {
			if(query instanceof RegExp) {
				let match;

				while( null != (match=query.exec(this.#flat_str))  ) {

					const {sn, so, en, eo} = this.#findMatchRange(match.index, match[0].length);

					this.#current_match = { 
											match: match,
											start_node: sn, start_offset: so,
											end_node: en, end_offset: eo 
										  };


					yield this.#current_match;
				}

			}

			else if( typeof query === "string" ) {

				let ind = this.#flat_str.indexOf(query);
				while(ind!==-1) {
					const {sn, so, en, eo} = this.#findMatchRange(ind, query.length);

					this.#current_match = { 
											match: {index:ind, 0:query},
											start_node: sn, start_offset: so,
											end_node: en, end_offset: eo 
										  };

					yield this.#current_match;

					ind = this.#flat_str.indexOf(query, ind+query.length);
				}
			}

			else {
				for(const val of this.#traverse(this.#flat_nodes)) {
						this.#current_match = { 
											start_node: val.node, start_offset: 0,
											end_node: val.node, end_offset: 0
										  };

					// todo: is this ok?					  
					if(val.exit===false) {
						yield this.#current_match;										  
					}
				}
			}
		}

		this.apply();
	}

	/**
	* By default changes are applied only when it is necessary. `setTag` and
	* `setAttribute` are not applied until another loop is called or output is
	* needed. Normally there is no problem in this and everything is handled
	* automatically.
	* 
	* But in rare occasions, when you are setting tags and attributes outside a 
	* loop and you want to change a node you have already changed, then you may 
	* need to call this function manually. Keep in mind that it is the performance
	* bottleneck, so call it only when necessary.
	*/
	apply()
	{
		this.#current_match = null;

		for( const ch of this.#change_list ) {
			ch.func(ch);
		}

		if(this.#change_list.length>0) {
			let flat = this.#flatten(this.#flat_nodes);
			this.#flat_str = flat.str;
			this.#change_list = [];
		}
	}


	/**
	Inserts HTML in a location relative to the search query match region.
	*
	* @param {string} what - a string which will be parsed as HTML and inserted at
	* the requested location.
	* 
	* @param {} insert_at - the relative position on insertion. If its value is set
	* to `HTMLToolbox.BEGIN` then the HTML will be inserted right before the match point
	* `start_node` at `start_offset`. If set to `HTMLToolbox.END` it will be inserted
	* right after the `end_node` at `end_offset`. Other values not supported.
	*/
	insert(what, insert_at=HTMLToolbox.BEGIN)
	{
		if(this.#current_match===null) {
			throw "insert without match";
		}

		this.#change_list.push( { type: this.#doInsert.bind(this), node: node,  what: what, at: insert_at } );
	}

	/**
	* Removes the match.
	* 
	* 	let doc = "<!DOCTYPE html>this is tesss<b><b></b></b>sssst!</div>";
	*	let htb = new HTMLToolbox(doc);
	*
	*	for(const val of htb.search(/te(s+)t/gm)) {
	*		htb.remove();
	*	}
	*
	*	console.log(htb.getHTML(null));
	*
	* and the result would be:
	*
	* 	<!DOCTYPE html>this is !
	*/
	remove()
	{
		if(this.#current_match===null) {
			throw "remove without match";
		}

		this.#change_list.push( { func: this.#doRemove.bind(this), match: this.#current_match } );
	}

	/**
	* Replaces the match with an HTML string.
	* 
	* 	let doc = "<!DOCTYPE html>this is a tesss<b><b></b></b>sssst!</div>";
	*	let htb = new HTMLToolbox(doc);
	*
	*	for(const val of htb.search(/te(s+)t/gm)) {
	*		htb.replace("<div>experiment</div>");
	*	}
	*
	*	console.log(htb.getHTML(null));
	*
	* and the result would be:
	*
	* 	<!DOCTYPE html>this is a <div>experiment</div>!
	* 
	*
	* Note that you can access the match data using the given value:
	* 
	* 	let doc = "<div>1 and 2 and 3 and 4</div>";
	*	let htb = new HTMLToolbox(doc);
	*
	*	for(const val of htb.search(/(\d) and/gm)) {
	*		const m = val.match;
	*		htb.replace(`${m[1]} or`);
	*	}
	*
	*	console.log(htb.getHTML(null));
	*
	* and the result would be:
	*
	* 	<!DOCTYPE html><div>1 or 2 or 3 or 4</div>
	*
	* @param {string} replace_with - the new HTML string to be used as the replacement.
	* 
	* @param {} replace_at - the relative position of replacement. If its value is set to
	* `HTMLToolbox.BEGIN` then the HTML will be inserted right before the match point
	* `start_node` at `start_offset`. If set to `HTMLToolbox.END` it will be 
	* inserted right after the `end_node` at `end_offset`. Other values not supported.
	*/
	replace(replace_with, replace_at=HTMLToolbox.BEGIN)
	{
		if(this.#current_match===null) {
			throw "replace without match";
		}

		this.#change_list.push( { func: this.#doReplace.bind(this), match: this.#current_match,  with: replace_with, at: replace_at } );
	}

	/**
	* Wraps the match inside an HTML string. Any HTML can be used as the envelope
	* the placement of the match is given using a <!/> and it will be replaced by
	* the match. 
	* 
	* Note that at the moment the leaves of the tree will be wrapped. And 
	* neighbor nodes will be wrapped separately.
	* 
	* Also <!/> must be a valid HTML node, for example it can't be inside the tag
	* definition.
	* 
	* 	let doc = "<div>1 and 2 and 3 and 4</div>";
	*	let htb = new HTMLToolbox(doc);
	*
	*	for(const val of htb.search(/\d/gm)) {
	*		htb.wrap(`<span>Number <!/></span>`);
	*	}
	*
	*	console.log(htb.getHTML(null));
	*
	* and the result would be:
	*
	* 	<div><span>Number 1</span> and <span>Number  2</span> and <span>Number  3</span> and <span>Number  4</span></div>
	* 
	* @param {string} envelope - the HTML string to wrap the query match.
	*/
	wrap(envelope)
	{
		if(this.#current_match===null) {
			throw "wrap without match";
		}

		this.#change_list.push( { func: this.#doWrap.bind(this), match: this.#current_match, envelope:envelope } );		
	}

	/**
	* Changes the tag of the given node to the new one. 
	* 
	* For more details on the nodes structure see {@link HTMLToolbox#search}
	* 
	* @param {node} node - the target node, you can find it from the query match.
	* @param {string} tag - the new tag.
	*/
	setTag(node, tag)
	{
		this.#change_list.push( { func: this.#doSetTag.bind(this), node:node, tag:tag } );
	}

	/**
	* Changes the attribute value of the given node to the new one. 
	* 
	* For more details on the nodes structure see {@link HTMLToolbox#search}
	* 
	* @param {node} node - the target node, you can find it from the query match.
	* @param {string} attr - the target attribute.
	* @param {string} value - the new value.
	*/
	setAttribute(node, attr, value)
	{
		this.#change_list.push( { func: this.#doSetAttribute.bind(this), node:node, attr:attr, value:value } );
	}


	/**
	* A helper function to simplify replacing all occurrences without implementing a loop.
	* 
	* @param {} query - a string or regexp to search for in the rendered text of the 
	* document. If not provided, search will traverse over all the document. 
	* 
	* For more details on the search query see {@link HTMLToolbox#search}
	*
	* @param {string} replace_with - the new HTML string to be used as the replacement.
	* 
	* @param {} replace_at - the relative position of replacement. If its value is set to
	* `HTMLToolbox.BEGIN` then the HTML will be inserted right before the match point
	* `start_node` at `start_offset`. If set to `HTMLToolbox.END` it will be 
	* inserted right after the `end_node` at `end_offset`. Other values not supported.
	*/
	replaceAll(query, replace_with, replace_at=HTMLToolbox.END)
	{
		for(const val of this.search(query)) {
			this.replace(replace_with, replace_at);
		}
	}

	/**
	* A helper function to simplify removing all occurrences without implementing a loop.
	* 
	* For more details on the search query see {@link HTMLToolbox#search}
	* 
	* @param {} query - a string or regexp to search for in the rendered text of the 
	* document. If not provided, search will traverse over all the document. 
	*/
	removeAll(query)
	{
		for(const val of this.search(query)) {
			this.remove();
		}
	}

	/**
	* A helper function to simplify wrapping all occurrences without implementing a loop.
	* 
	* @param {} query - a string or regexp to search for in the rendered text of the 
	* document. If not provided, search will traverse over all the document. 
	* 
	* For more details on the search query see {@link HTMLToolbox#search}
	* 
	* @param {string} envelope - the HTML string to wrap the query match.
	*
	* For more details on the envelope see {@link HTMLToolbox#wrap}
	*/
	wrapAll(query, envelope)
	{
		for(const val of this.search(query)) {
			this.wrap(envelope);
		}
	}

	/**
	* Returns the rendered string.
	*/
	getString()
	{
		this.apply();
		return this.#flat_str.slice(1);
	}

	/**
	* Returns the resulting HTML document.
	* 
	* @param {string} indent - (optional) The indentation unit. Enter an empty
	* string for a compressed HTML, or `null` for the initial indentation. The
	* default value is `\t`.
	*/
	getHTML(indent='\t')
	{
		this.apply();
		return this.#getHTML(indent);
	}


	/**
	* **(For debugging only)**
	* 
	* Prints the current traversed structure of the document. This is different
	* from `printNodes`, as it doesn't reflect the tree structure, and reflects
	* the sequence the traverse is done. It only prints node `type`, `str_index` 
	* and `value`.
	*  
	* @param {Array} nodes - (optional) a list of the nodes to traverse. 
	*/
	printTraverse(nodes=this.#flat_nodes)
	{
		for (const val of this.#traverse(nodes)) {
			console.log(val.node.type, val.node.str_index, val.node.value);
		}
	}

	/**
	* **(For debugging only)**
	* 
	* Prints the current tree structure of the document.
	*  
	* @param {Array} nodes - (optional) a list of the nodes to printed. 
	*/

	printNodes(nodes=this.#flat_nodes)
	{
		function orphanize(n) {
			let nn = {...n};

			if(nn.body instanceof Array) {
				nn.body = [];
				for(let c of n.body) {
					nn.body.push( orphanize(c) );
				}
			}
			delete nn.parent;
			delete nn.next;
			delete nn.prev;

			return nn;
		}

		let t = [];

		for(let n of nodes) {
			t.push(orphanize(n));
		}

		console.log( JSON.stringify(t, null, 2) );
	}

}


module.exports = HTMLToolbox;

// todo: check consistency processInputValues 
