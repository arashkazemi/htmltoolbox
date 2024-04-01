## HTMLToolbox
### Search and Modification Engine for HTML Documents

HTMLToolbox is a set of tools for dealing with HTML documents. It doesn't rely on a browser
and can work in node environment too. It can

- **Convert a HTML document to its rendered text**, while being as close as possible to what is
rendered by browser. For example `<b>HTML</b>Toolbox` will be converted to `HTMLToolbox`, 
or `<input value='HTML'>Toolbox` will be rendered as `HTML Toolbox`. Even less used tags like `<q>` 
are supported, for example `<q>HTML</q>Toolbox` will be rendered as `"HTML"Toolbox`. Stylesheets 
and scripts are also automatically detected and neglected in rendered text.

- **Search in the text version**, using both **strings** and **regular expressions**, and modify the 
matches. The search can also simply traverse the document tree. The modifications can be applied 
in batch or in a loop. In the loop you can also check for the tag names, classes and other 
attribute values, using javascript and it is not limited to for example CSS queries. Available 
modification functions included are:

+ **Remove**: remove the matches.
+ **Insert**: insert html before or after the matches.
+ **Replace**: replace also supports regular expression $ notation.
+ **Wrap**: the matches can be wrapped in any kind of html, it doesn't need to be only a simple tag.
+ **Change Tags**: change the tags of the matches.
+ **Set Attributes**: change the html attributes of the matches

- **Minify or Pretify** and indent the HTML document and automatically fix simple errors.

- As HTMLToolbox doesn't use browser, it is **secure against injections** and there is no such
danger.

- It is **customizable**, every aspect of it can be modified, all the predefined tags can be 
changed and new ones can be added on the fly. There also exist a bunch configuration options that 
can save the day.

- HTMLToolbox is **tested** and **documented** well and it is **pretty fast**. 

### Installation

The latest source code of HTMLToolbox can be found at
[https://github.com/arashkazemi/htmltoolbox](https://github.com/arashkazemi/htmltoolbox)

To use in other node projects, install HTMLToolbox from npm public repository:

        npm install htmltoolbox  

and then import it using

        const HTMLToolbox = require("htmltoolbox");

To use in a webpage, download the source code and extract it. The minified 
script itself is available in the `/dist` directory. 

Alternatively, it is available via unpkg CDN and can be included in HTML files using

        <script src="https://unpkg.com/htmltoolbox/dist/htmltoolbox.min.js"></script>

### Usage

For more details see the [documentation](https://github.com/arashkazemi/htmltoolbox) and
specifically the [class documentation](https://arashkazemi.github.io/htmltoolbox/HTMLToolbox.html). 

Here are a few examples

#### Replace
        
        let doc = "<!DOCTYPE html>this is a tesss<b><b></b></b>sssst!</div>";
        let htb = new HTMLToolbox(doc);

        for(const val of htb.search(/te(s+)t/gm)) {
              htb.replace("<div>experiment</div>");
        }

        console.log(htb.getHTML(null));

and the result would be:

        <!DOCTYPE html>this is a <div>experiment</div>!

And to use the match groups:

        let doc = "<div>1 and 2 and 3 and 4</div>";
        let htb = new HTMLToolbox(doc);

        for(const val of htb.search(/(\d) and/gm)) {
              const m = val.match;
              htb.replace(`${m[1]} or`);
        }

        console.log(htb.getHTML(null));

and the result would be:

        <!DOCTYPE html><div>1 or 2 or 3 or 4</div>


in case you want to replace all occurances, you can call `replaceAll`:

        htb.replaceAll(/te(s+)t/gm, "<div>experiment</div>");


#### Wrap

        let doc = "<div>1 and 2 and 3 and 4</div>";
        let htb = new HTMLToolbox(doc);

        for(const val of htb.search(/\d/gm)) {
              htb.wrap(`<span>Number <!/></span>`);
        }

        console.log(htb.getHTML(null));

and the result would be:

        <div><span>Number 1</span> and <span>Number  2</span> and <span>Number  3</span> and <span>Number  4</span></div>

and in case you want to wrap all occurances, you can call `replaceAll`:

        htb.wrapAll(/\d/gm, "<span>Number <!/></span>");


---

Copyright (C) 2023-2024 Arash Kazemi <contact.arash.kazemi@gmail.com>. All rights reserved.

HTMLToolbox project is subject to the terms of BSD-2-Clause License. See the `LICENSE` file for more details.
