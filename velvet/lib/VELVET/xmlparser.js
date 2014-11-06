//----------------------------------------------------------------------------
/**
	Main class for XML parsing. Create one of these and run parse.
*/
function XMLParser()
{
	this.currentRow = -1;
	this.text = [];
	this.currentNode;
	this.rootNode;
	this.error = null;
	this.errorRow = -1;
	this.parseState;
	
	this.xmlVersion = "1.0";
	this.xmlEncoding = "UTF-8";
}

//----------------------------------------------------------------------------
/**
*/
var ParseStates = 
{
	None : -1,
	Node : 0,
	Contents : 1,
	CDATA : 2,
	Comment : 3
}

//----------------------------------------------------------------------------
/**
*/
XMLParser.prototype.PushState = function(state)
{
	var newstate = new XMLParseState();
	newstate.state = state;
	newstate.prevState = this.parseState;
	this.parseState = newstate;
}

//----------------------------------------------------------------------------
/**
*/
XMLParser.prototype.PopState = function()
{
	this.parseState = this.parseState.prevState;
}

//----------------------------------------------------------------------------
/**
*/
XMLParser.prototype.Parse = function(text)
{
	if (text.length == 0)
	{
		this.error = "Empty document is not a valid XML file";
		return false;
	}
	this.text = text.split("\n");
	this.currentRow = 0;
	this.currentNode = null;
	this.parseState = new XMLParseState();
	
	// parse row by row
	for (var i = 0; i < this.text.length; i++)
	{
		this.ParseRow();
		if (this.error != null)
		{
			this.errorRow = this.currentRow;
			return false;
		}		
		this.currentRow++;
	}
	
	if (this.parseState.state != ParseStates.None)
	{
		this.error = "Node <" + this.currentNode.tagName + "> isn't properly closed";
		this.errorRow = this.currentRow - 1;
		return false;
	}
}

//----------------------------------------------------------------------------
/**
*/
XMLParser.prototype.ParseRow = function()
{
	var row = this.text[this.currentRow];	
	while (row.length > 0 && this.error == null)
	{						
		// if we have CDATA, read everything as pure text
		if (this.parseState.state == ParseStates.CDATA)
		{
			row = this.ParseText(row);
			continue;
		}
		else
		{
		
			// empty row and we are not in CDATA or text mode, continue
			if (this.parseState.state == ParseStates.Node) row = row.trim();
			if (row.trim().length == 0 && this.parseState.state != ParseStates.Contents)
			{
				return;
			}
			
			if (row.beginsWith("</"))
			{			
				// make sure we are not still in an unclosed node
				if (this.parseState.state == ParseStates.Node)
				{
					this.error = "Node is not properly closed with a finishing '>', current node is '<" + this.currentNode.tagName + "' but should be '<" + this.currentNode.tagName + ">'";
					return;
				}
				
				// cut close tag
				row = row.slice(2);
				
				// get closing tag name and closing bracket
				var name = row.match(/^([A-z]|\:|\.|\_|\-)([A-z]|[0-9]|\:|\.|\_|\-)*/);
				if (name != null)
				{
					name = name[0];
					if (name != this.currentNode.tagName)
					{
						this.error = "Node is not properly closed, should be '</" + this.currentNode.tagName + ">' but got '</" + name + ">'";
						return;
					}
					else
					{
						this.currentNode.closeRow = this.currentRow;
					}
				}
				else
				{
					this.error = "Node name is not properly formatted";
					return;
				}
				
				// remove tag name
				row = row.slice(name.length);
				
				// trim any whitespace
				row = row.trim();
				
				// get closing tag
				if (!row.beginsWith(">"))
				{
					this.error = "Node is not properly closed, missing '>'";
					return;
				}
				else
				{
					// remove '>'
					row = row.slice(1);
				}
				
				// close node
				this.CloseNode();
				
				// continue to next step
				continue;
			}
			else
			{
				// precedence, <!, <?, <
				if (row.beginsWith("<!"))
				{
					// make sure we are not still in an unclosed node
					if (this.parseState.state == ParseStates.Node)
					{
						this.error = "Node is not properly closed with a finishing '>', current node is '<" + this.currentNode.tagName + ">'";
						return;
					}
				
					var cdata = "<![CDATA[";
					var comment = "<!--";
					if (row.beginsWith(cdata))
					{
						this.PushState(ParseStates.CDATA);
						row = row.slice(cdata.length);
						this.currentNode.cdataStartRow = this.currentRow;
					}
					else if (row.beginsWith(comment))
					{
						// comment, ignore
						this.PushState(ParseStates.Comment);
						row = row.slice(comment.length);
					}
					else
					{
						// row is invalid stuff, produce error and return
						this.error = "Invalid contents";
						return;
					}
					
					// continue to next token
					continue;
				}
				else if (row.beginsWith("<"))
				{
					if (row.beginsWith("<?"))
					{
						if (this.parseState.state != ParseStates.None)
						{
							this.error = "XML declaration tag must appear outside of actual document!";
							return;
						}
						
						// cut away declaration tag
						row = row.slice(2);
						
						// find tag name
						var name = row.match(/^([A-z]|\:|\.|\_|\-)([A-z]|[0-9]|\:|\.|\_|\-)*/);
						if (name != null)
						{
							name = name[0];
							if (name != "xml")
							{
								this.error = "XML declaration tag must be <?xml ...?>";
								return;
							}
							row = row.slice(name.length);
						}
						
						// trim row
						row = row.trim();
						
						var attrPattern = /^([A-z])([A-z]|[0-9]|\-|\.|\_|\:)*\s*=\s*(\"|\')[^("|')]*(\"|\')/i;
						var attrs = row.match(attrPattern);
						while (attrs != null)
						{
							attrs = attrs[0];
							var parts = attrs.split("=");
							if (parts[0] == "version")			this.xmlVersion = parts[1].slice(1, parts[1].length-1);
							else if (parts[0] == "encoding")	this.xmlEnconding = parts[1].slice(1, parts[1].length-1);
							else if (parts[0] == "standalone")  this.xmlStandalone = parts[1].slice(1, parts[1].length-1);
							else								this.error = "XML declaration tag only allows for attributes 'version', 'encoding' and 'standalone' as per the standard";
							row = row.slice(attrs.length);
							row = row.trim();
							attrs = row.match(attrPattern);
							//if (row.beginsWith("?>")) break;
						}
						
						if (!row.beginsWith("?>"))
						{
							this.error = "XML declaration tag must end with '?>'";
							return;
						}
						
						// remove "?>"
						row = row.slice(2);
						
						// dont parse text, continue to next tag
						continue;
					}
					else
					{
						// make sure we are not still in an unclosed node
						if (this.parseState.state == ParseStates.Node)
						{
							this.error = "Node is not properly closed with a finishing '>', current node is '<" + this.currentNode.tagName + ">'";
							return;
						}

						// open new node
						this.OpenNode();
						
						// cut open tag
						row = row.slice(1);
						
						// find tag name
						var name = row.match(/^([A-z]|\:|\.|\_|\-)([A-z]|[0-9]|\:|\.|\_|\-)*/);
						if (name != null)
						{					
							name = name[0];
							this.currentNode.tagName = name;
						
							// remove tag name
							row = row.slice(name.length);
							
							// remove whitespace
							row = row.trim();
						}
						else
						{
							this.error = "Node name is not properly formatted";
							return;
						}
						
						// continue to next
						continue;
					}
				}
			}
			
			// parse text for the current node
			row = this.ParseText(row);
		}
		
	}
}

//----------------------------------------------------------------------------
/**
*/
XMLParser.prototype.OpenNode = function()
{
	var node = new XMLNode();
	node.row = this.currentRow;
	if (this.currentNode != null)
	{
		this.currentNode.children.push(node);
		node.parent = this.currentNode;
	}
	else
	{
		this.rootNode = node;
	}
	this.PushState(ParseStates.Node);
	this.currentNode = node;
}

//----------------------------------------------------------------------------
/**
*/
XMLParser.prototype.CloseNode = function()
{
	this.currentNode = this.currentNode.parent;
	this.PopState();
}

//----------------------------------------------------------------------------
/**
*/
XMLParser.prototype.ParseText = function(node)
{	
	if (this.parseState.state == ParseStates.Comment)
	{
		var commentEnd = node.indexOf("-->");
		if (commentEnd != -1)
		{
			node = node.slice(commentEnd+3);
			this.PopState();
		}
		else
		{
			node = "";
		}
	}
	
	// XML shorthand for tag closes
	if (node.beginsWith("/>"))
	{
		this.CloseNode();
		node = node.slice(2);
		return node;
	}
	
	// find tag close
	if (node.beginsWith(">"))
	{
		this.PopState();
		this.PushState(ParseStates.Contents);
		node = node.slice(1);
		return node;
	}
	
	// find CDATA close
	if (node.beginsWith("]]>"))
	{
		this.currentNode.cdataEndRow = this.currentRow;
		this.PopState();
		node = node.slice(3);
		return node;
	}
	
	if (this.parseState.state == ParseStates.Node)
	{
		// remove any unnecessary whitespace
		var attrPattern = /^([A-z])([A-z]|[0-9]|\-|\.|\_|\:)*\s*=\s*(\"|\')[^("|')]*(\"|\')/i;
		var attrs = node.match(attrPattern);	
		if  (attrs != null)
		{
			attrs = attrs[0];
			var parts = attrs.split("=");
			var attribute = new XMLAttribute();
			attribute.name = parts[0];
			attribute.value = parts[1].slice(1, parts[1].length-1);
			attribute.row = this.currentRow;
			this.currentNode.attributes.push(attribute);			
			node = node.slice(attrs.length);
		}
		else
		{
			this.error = "Node '<" + this.currentNode.tagName + ">' is incorrectly formatted";
			return node;
		}
	}
	
	if (node.length > 0)
	{
		if (this.parseState.state == ParseStates.CDATA)
		{
			if (this.currentNode != null && this.currentNode.cdataStartRow == -1) this.currentNode.cdataStartRow = this.currentRow;
			var cdataend = node.indexOf("]]>");
			if (cdataend != -1)
			{
				var text = node.slice(0, cdataend);
				this.currentNode.cdata += text;
				node = node.slice(text.length);	
			}
			else
			{
				if (this.currentNode != null) this.currentNode.cdataEndRow = this.currentRow;
				this.currentNode.cdata += node + "\n";
				node = "";
			}
		}
		else if (this.parseState.state == ParseStates.Contents)
		{
			if (this.currentNode != null && this.currentNode.contentStartRow == -1) this.currentNode.contentStartRow = this.currentRow;
			var textend = node.indexOf("<");
			if (textend != -1)
			{
				var text = node.slice(0, textend);
				this.currentNode.content += text;
				node = node.slice(text.length);	
			}
			else
			{
				if (this.currentNode != null) this.currentNode.contentEndRow = this.currentRow;
				this.currentNode.content += node + "\n";
				node = "";
			}
		}
		else if (this.parseState.state == ParseStates.None) node = "";
	}	
	
	return node;
}

//----------------------------------------------------------------------------
/**
	XMLNode is a node in an XML document. They are completely hierarchical, meaning they are not like the default JS DOM where the 
	hierarchy is completely dissolved
*/
function XMLNode()
{
	this.parent = null;
	this.tagName = null;
	this.attributes = [];
	this.children = [];
	
	this.content = "";
	this.contentStartRow = -1;
	this.contentEndRow = -1;
	
	this.cdata = "";
	this.cdataStartRow = -1;
	this.cdataEndRow = -1;
	
	this.row = -1;
	this.closeRow = -1;
}

//----------------------------------------------------------------------------
/**
*/
XMLNode.prototype.GetAttribute = function(name)
{
	for (var i = 0; i < this.attributes.length; i++)
	{
		if (this.attributes[i].name == name) return this.attributes[i].value;
	}
	return null;
}

//----------------------------------------------------------------------------
/**
*/
function XMLAttribute()
{
	this.name = "";
	this.value = "";
	this.row = -1;
}

//----------------------------------------------------------------------------
/**
*/
function XMLParseState()
{
	this.state = ParseStates.None;
	this.prevState = null;
}