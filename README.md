## HTMLToolbox
### Search and Modification Engine for HTML Documents

HTMLToolbox is a set of tools for dealing with HTML documents. It doesn't rely on a browser
and can work in node environment too. It can

- **Convert a HTML document to its rendered text**, while being as close as possible to what is
rendered by browser. For example `<b>HTML</b>Toolbox` will be converted to `HTMLToolbox`, 
or `<input value='HTML'>Toolbox` will be rendered as `HTML Toolbox`. Even less used tags like `<q>` 
are supported, for example `<q>HTML</q>Toolbox` will be rendered as `"HTML"Toolbox`. Style-sheets 
and scripts are also automatically detected and neglected in rendered text.

- **Search in the text version**, using both **strings** and **regular expressions**, and modify the 
matches. The search can also simply traverse the document tree. The modifications can be applied 
in batch or in a loop. In the loop you can also check for the tag names, classes and other 
attribute values, using javascript and it is not limited to for example CSS queries. Available 
modification functions included are:

+ **Remove**: remove the matches.
+ **Insert**: insert HTML before or after the matches.
+ **Replace**: replace also supports regular expression $ notation.
+ **Wrap**: the matches can be wrapped in any kind of HTML, it doesn't need to be only a simple tag.
+ **Change Tags**: change the tags of the matches.
+ **Set Attributes**: change the HTML attributes of the matches

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

See the [documentation homepage](https://github.com/arashkazemi/htmltoolbox) and also
the [class documentation](https://arashkazemi.github.io/htmltoolbox/HTMLToolbox.html) for all
the available methods and many more examples. 

Here are a few explained examples:

#### Replace Example

For replacing all occurrences of an regex or string in an HTML document, first create
and instance of HTMLToolbox for the document string:

        let doc = "<!DOCTYPE html>this is a tesss<b><b></b></b>sssst!</div>";
        let htb = new HTMLToolbox(doc);

and then

        htb.replaceAll(/te(s+)t/gm, "<div>document</div>");

and to get the result:

        console.log(htb.getHTML(null));

which would be:

        <!DOCTYPE html>this is a <div>document</div>!

In case you want a fine control for each occurrence, you can iterate the results:

        for(const val of htb.search(/te(s+)t/gm)) {
              htb.replace("<div>document</div>");
        }

the `val` object contains both the `match`, and its start and end positions
in the input string. It also contains an start and end node in the parsed HTML tree, so that you 
can traverse on and replace accordingly.

To get the output use `getHTML`, which receives the indentation as argument which is `\t` by default,
and `null` means no indentation.

        htb.getHTML(null);

To get the flattened text use:

        htb.getText();

which in this case would be:

        this is a document.

To use regex match groups:

        let doc = "<div>1 and 2 and 3 and 4</div>";
        let htb = new HTMLToolbox(doc);

        for(const val of htb.search(/(\d) and/gm)) {
              const m = val.match;
              htb.replace(`${m[1]} or`);
        }

        console.log(htb.getHTML(null));

and the result would be:

        <!DOCTYPE html><div>1 or 2 or 3 or 4</div>

in case you want to replace all occurrences, you can call `replaceAll`:

Notice that the creation of the HTMLToolbox instance for a document is to make it possible to
apply consecutive changes and then get the results.

#### Wrap Example

The wrap function receives the wrap envelope as a string and recognizes `<!/>` as a placeholder 
for the nodes that are being wrapped. The wrap envelope string is parsed as an HTML fragment before 
applying and so errors in it won't break the overall document structure, but may lead to unexpected 
results. 

        let doc = "<div>1 and 2 and 3 and 4</div>";
        let htb = new HTMLToolbox(doc);

        htb.wrapAll(/\d/gm, "<span>Number <!/></span>");

or for fine control on each occurrences:

        for(const val of htb.search(/\d/gm)) {
              htb.wrap(`<span>Number <!/></span>`);
        }

        console.log(htb.getHTML(null));

and the result would be:

        <div><span>Number 1</span> and <span>Number  2</span> and <span>Number  3</span> and <span>Number  4</span></div>


See the [class documentation](https://arashkazemi.github.io/htmltoolbox/HTMLToolbox.html) for all 
other methods, features, and also the details of the data structures.

---

Copyright (C) 2023-2024 Arash Kazemi <contact.arash.kazemi@gmail.com>. All rights reserved.

HTMLToolbox project is subject to the terms of BSD-2-Clause License. See the `LICENSE` file for more details.
