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
}

//----------------------------------------------------------------------------
/**
*/
XMLParser.prototype.ParseRow = function()
{
	var row = this.text[this.currentRow];
	row = row.trim();
	
	while (row.length > 0 && this.error == null)
	{
		// if we are parsing CDATA, then EVERYTHING is text
		if (this.parseState.state == ParseStates.CDATA)
		{
			row = this.ParseText(row);
			continue;
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
			var name = row.match(/[A-z]*\s*/g)[0];
			if (name != this.currentNode.tagName)
			{
				this.error = "Node is not properly closed, should be '</" + this.currentNode.tagName + ">' but got '</" + name + ">'";
				return;
			}
			else
			{
				this.currentNode.closeRow = this.currentRow;
			}
			
			// remove tag name
			row = row.slice(name.length);
			
			// get closing tag
			if (row.charAt(0) != ">")
			{
				this.error = "Node is not properly closed, missing '>'";
				return;
			}
			
			// close node
			this.CloseNode();
		}
		else
		{
			if (!row.beginsWith("<!"))
			{
				if (row.beginsWith("<"))
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
					var name = row.match(/[A-z]*/g)[0];
					if (name != null)
					{					
						this.currentNode.tagName = name;
					
						// remove tag name
						row = row.slice(name.length);
					}
					else
					{
						this.error = "Undefined node name";
						return;
					}
				}
			}
			else
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
	// remove any unnecessary white space
	node = node.trim();
	if (node.length == 0) return node;
	
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
	
	if (this.parseState.state == ParseStates.Node)
	{
		var attrPattern = /[A-z]*\s*=\s*\"[^"]*\"/g;
		var attrs = node.match(attrPattern);	
		if (attrs != null) for (var i = 0; i < attrs.length; i++)
		{
			var parts = attrs[i].split("=");
			var attribute = new XMLAttribute();
			attribute.name = parts[0];
			attribute.value = parts[1].slice(1, parts[1].length-1);
			attribute.row = this.currentRow;
			this.currentNode.attributes.push(attribute);			
			node = node.slice(attrs[i].length);
			node = node.trim();
		}
	}
	
	// find tag close
	if (node.beginsWith(">"))
	{
		this.PopState();
		this.PushState(ParseStates.Contents);
		node = node.slice(1);
	}
	
	// find CDATA close
	if (node.beginsWith("]]>"))
	{
		this.PopState();
		node = node.slice(3);
	}
	
	if (node.length > 0)
	{
		if (this.parseState.state == ParseStates.CDATA)
		{
			var cdataend = node.indexOf("]]>");
			if (cdataend != -1)
			{
				var text = node.slice(0, cdataend);
				this.currentNode.cdata += text;
				node = node.slice(text.length);	
			}
			else
			{
				this.currentNode.cdata += node;
				node = "";
			}
		}
		else if (this.parseState.state == ParseStates.Contents)
		{
			var textend = node.indexOf("<");
			if (textend != -1)
			{
				var text = node.slice(0, textend);
				this.currentNode.content += text;
				node = node.slice(text.length);	
			}
			else
			{
				this.currentNode.content += node;
				node = "";
			}
		}
		else
		{
			// something went wrong, we should have no proper tokens left here
			this.error = "Incorrectly formatted XML";
		}
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
	this.cdata = "";
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