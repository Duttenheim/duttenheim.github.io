//----------------------------------------------------------------------------
/**
*/
var XMLTagBits = 
{
	Icon : 1 << 0,
	Preview : 1 << 1,
	Name : 1 << 2,
	Info : 1 << 3,
	Interface : 1 << 4,
	Config : 1 << 5,
	Requires : 1 << 6,
	Provides : 1 << 7,
	CodeExt : 1 << 8,
	APIs : 1 << 9
}

//----------------------------------------------------------------------------
/**
	Main function for XML validation
*/
function ValidateXML(contents, session, editor, requirements)
{
	// reset requirements
	requirements.config = [];

	// parse entire text as XML document
	parser = new DOMParser();
	xml = parser.parseFromString(contents, "text/xml");
	
	xmlparser = new XMLParser();
	xmlparser.Parse(contents);
	
	// first check for XML errors
	if (xmlparser.error != null)
	{
		var annots = session.getAnnotations();
		var annot = {row: xmlparser.errorRow, col: 0, text: "Syntax: " + xmlparser.error, type:"error"};
		if (annots != null)
		{
			annots.push(annot);
			session.setAnnotations(annots);
		}
		else
		{
			session.setAnnotations([annot]);
		}
		return false;
	}
		
	// first, check if the first element is <component>
	var root = xmlparser.rootNode;
	if (root.tagName != "component")
	{
		VELVET_Error(root, editor, "Component must start with <component>", null);
		return false;
	}
	
	// iterate through all elements and validate each section with an independent function
	var elements = root.children;
	var bits = 0;
	for (var i = 0; i < elements.length; i++)
	{
		var elem = elements[i];
		if (elem.tagName == "icon")
		{
			if (bits & XMLTagBits.Icon) { VELVET_Warning(elem, editor, "<icon> already defined, ignoring this for the previous definition", null); continue; }
			if (!ValidateIcon(elem, session, editor)) return false;
			bits |= XMLTagBits.Icon;
		}
		else if (elem.tagName == "previewImage")
		{
			if (bits & XMLTagBits.Preview) { VELVET_Warning(elem, editor, "<previewImage> already defined, ignoring this for the previous definition", null); continue; }
			if (!ValidatePreviewImage(elem, session, editor)) return false;
			bits |= XMLTagBits.Preview;
		}
		else if (elem.tagName == "name")
		{
			if (bits & XMLTagBits.Name) { VELVET_Warning(elem, editor, "<name> already defined, ignoring this for the previous definition", null); continue; }
			
			// set name in requirements
			requirements.makeName = elem.content;
			
			// do nothing, valid tag can contain any data
			bits |= XMLTagBits.Name;
		}
		else if (elem.tagName == "info")
		{
			if (bits & XMLTagBits.Info) { VELVET_Warning(elem, editor, "<info> already defined, ignoring this for the previous definition", null); continue; }
			// -||-
			bits |= XMLTagBits.Info;
		}
		else if (elem.tagName == "interface")
		{
			if (bits & XMLTagBits.Interface) { VELVET_Warning(elem, editor, "<interface> already defined, ignoring this for the previous definition", null); continue; }
			// accept everything
			bits |= XMLTagBits.Interface;
		}
		else if (elem.tagName == "config")
		{
			if (bits & XMLTagBits.Config) { VELVET_Warning(elem, editor, "<config> already defined, ignoring this for the previous definition", null); continue; }
			if (!ValidateConfig(elem, session, editor, requirements)) return false;
			bits |= XMLTagBits.Config;
		}
		else if (elem.tagName == "requires")
		{
			if (bits & XMLTagBits.Requires) { VELVET_Warning(elem, editor, "<requires> already defined, ignoring this for the previous definition", null); continue; }
			if (!ValidateRequires(elem, session, editor)) return false;
			bits |= XMLTagBits.Requires;
		}
		else if (elem.tagName == "provides")
		{
			if (bits & XMLTagBits.Provides) { VELVET_Warning(elem, editor, "<provides> already defined, ignoring this for the previous definition", null); continue; }
			if (!ValidateProvides(elem, session, editor)) return false;
			bits |= XMLTagBits.Provides;
		}
		else if (elem.tagName == "code_ext")
		{
			if (bits & XMLTagBits.CodeExt) { VELVET_Warning(elem, editor, "<code_ext> already defined, ignoring this for the previous definition", null); continue; }
			if (!ValidateCodeExt(elem, session, editor)) return false;
			bits |= XMLTagBits.CodeExt;
		}
		else if (elem.tagName == "apis")
		{
			if (bits & XMLTagBits.APIs) { VELVET_Warning(elem, editor, "<apis> already defined, ignoring this for the previous definition", null); continue; }
			// accept everything
			bits |= XMLTagBits.APIs;
		}
	}
	
	// check if all required tags are used
	if (!(bits & XMLTagBits.Name))
	{
		VELVET_Error(root, editor, "<name> tag is required", null);
		return false;
	}
	
	if (!(bits & XMLTagBits.Icon))
	{
		VELVET_Error(root, editor, "<icon> tag is required", null);
		return false;
	}
	
	if (!(bits & XMLTagBits.Preview))
	{
		VELVET_Error(root, editor, "<previewImage> tag is required", null);
		return false;
	}
	
	if (!(bits & XMLTagBits.Info))
	{
		VELVET_Error(root, editor, "<info> tag is required", null);
		return false;
	}
	
	if (!(bits & XMLTagBits.Config))
	{
		VELVET_Error(root, editor, "<config> tag is required", null);
		return false;
	}
	
	return true;
}

//----------------------------------------------------------------------------
/**
	Validates <icon> tag, basically check if the icon is available
*/
function ValidateIcon(element, session, editor)
{
	var img = document.body.appendChild(document.createElement("img"));
    img.onload = function()
    {
		document.body.removeChild(img);
    };
    img.onerror = function()
    {
		VELVET_Warning(element, editor, "Could not get icon image");
		document.body.removeChild(img);
    };
    img.src = element.content;
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidatePreviewImage(element, session, editor)
{
	var img = document.body.appendChild(document.createElement("img"));
    img.onload = function()
    {
		document.body.removeChild(img);
    };
    img.onerror = function()
    {
		VELVET_Warning(element, editor, "Could not get preview image");
		document.body.removeChild(img);
    };
    img.src = element.content;
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidateConfig(element, session, editor, requirements)
{
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		var elem = elements[i];
		if (elem.tagName != "param")
		{
			VELVET_Error(elem, editor, "<config> only allows subtags as <param>", null);
			return false;
		}
		else
		{
			if (!ValidateParam(elem, session, editor, requirements)) return false;
		}
	}
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidateParam(element, session, editor, requirements)
{
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		var elem = elements[i];
		if (elem.tagName != "description")
		{
			VELVET_Error(elem, editor, "<param> only allows a <description> tag", null);
			return false;
		}
		else if (i > 0)
		{
			VELVET_Error(elem, editor, "<param> only allows a single <description tag>", null);
			return false;		
		}
		else
		{
			var elems = elem.children;
			if (elems.length > 0)
			{
				VELVET_VELVET_Error(elem, editor, "<description> allows no children, forgot to lose it maybe?", null);
				return false;
			}
		}
	}
	
	var name = element.GetAttribute("name");
	var type = element.GetAttribute("type");
	var defval = element.GetAttribute("default");
	
	if (name == null)
	{
		VELVET_Error(element, editor, "<param> must contain attribute 'name'");
		return false;
	}
	else
	{
		var firstchar = name.substring(0, 1);
		if (firstchar == firstchar.toUpperCase())
		{
			VELVET_Error(element, editor, "<param> must have the 'name' value completely in lower case, consider using '" + name.toLowerCase() + "'", null);
			return false;
		}
	}
	
	if (type == null)
	{
		VELVET_Error(element, editor, "<param> must contain attribute 'type'", null);
		return false;		
	}
	else
	{
		if (type != "Bool" && type != "Int" && type != "String" && type != "Float")
		{
			VELVET_Error(element, editor, "<param> must use a defined type (Bool, Int, String, Float)", null);
			return false;		
		}
	}
	
	if (defval == null)
	{
		VELVET_Error(element, editor, "<param> must contain attribute 'default'", null);
		return false;		
	}
	else
	{
		var message = ValidateTypeValue(type, defval);
		if (message != null)
		{
			VELVET_Error(element, editor, "<param> " + message, null);
			return false;		
		}
	}
	
	// add to configure
	requirements.config.push(name);
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidateRequires(element, session, editor)
{
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		var elem = elements[i];
		if (elem.tagName != "port")
		{
			VELVET_Error(elem, editor, "<requires> only allows subtags as <port>", null);
			return false;
		}
		else
		{
			if (!ValidatePort(elem, session, editor)) return false;
		}
	}
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidateProvides(element, session, editor)
{
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		var elem = elements[i];
		if (elem.tagName != "port")
		{
			VELVET_Error(elem, editor, "<provides> only allows subtags as <port>", null);
			return false;
		}
		else
		{
			if (!ValidatePort(elem, session, editor)) return false;
		}
	}
	return true;
}


var invalidwords = " abort action after array before case class data default deriving do else elsif forall if import instance in let module new of private raise request result send struct then self typeclass uniarray use where ";
var types = ['Bool', 'Int', 'String', 'Char', 'Float'];
//----------------------------------------------------------------------------
/**
	TODO:
	 Somehow get all the custom types in the SATIN environment and make sure our ports conform to any of those types.
*/
function ValidatePort(element, session, editor)
{	
	var kind = element.GetAttribute("kind");
	var name = element.GetAttribute("name");
	var resulttype = element.GetAttribute("resulttype");
	var argtype = element.GetAttribute("argtype");
	
	// validate the kind of port
	if (kind == null)
	{
		VELVET_Error(element, editor, "<port> must have attribute 'kind' (push, pull)", null);
		return false;
	}
	else
	{
		if (kind.toUpperCase() == "PUSH")
		{
			if (resulttype != null)
			{
				VELVET_Warning(element, editor, "<port> of type 'push' have no use of 'resulttype', did you mean to use 'argtype'?", null);
			}
			else if (argtype != null)
			{
				if (!ValidateType(argtype, types))
				{
					VELVET_Error(element, editor, "<port> '" + argtype + "' does not name a defined type", null);
					return false;
				}
			}
			else
			{
				VELVET_Error(element, editor, "<port> 'argtype' is not defined", null);
				return false;
			}
		}
		else if (kind.toUpperCase() == "PULL")
		{
			if (argtype != null)
			{
				VELVET_Warning(element, editor, "<port> of type 'pull' have no use of 'argtype', did you mean to use 'resulttype'?", null);
			}
			else if (resulttype != null)
			{
				if (!ValidateType(resulttype, types))
				{
					VELVET_Error(element, editor, "<port> '" + resulttype + "' does not name a defined type", null);
					return false;
				}
			}
			else
			{
				VELVET_Error(element, editor, "<port> 'resulttype' is not defined", null);
				return false;
			}
		}
	}
	
	// validate name
	if (name == null)
	{
		VELVET_Error(element, editor, "<port> must have attribute 'name'", null);
		return false;
	}
	else
	{
		if (!name.isLowerCase())
		{
			VELVET_Error(element, editor, "<port> must have the 'name' value completely in lower case, consider using '" + name.toLowerCase() + "'", null);
			return false;
		}
		
		var index = invalidwords.indexOf(" " + name + " ");
		if (index > -1)
		{
			VELVET_Error(element, editor, "<port> name'" + name + "' is not allowed since it's a reserved keyword", null);
			return false;
		}
	}
	
	// parse optional subtags, namely expects and supplies
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		if (!ValidateSuppliesExpects(elements[i], kind, session, editor)) return false;
	}
	
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidateSuppliesExpects(element, kind, session, editor)
{
	if (kind.toUpperCase() == "PUSH")
	{
		if (element.tagName == "supplies")
		{
			var type = element.GetAttribute("type");
			var name = element.GetAttribute("name");
			if (type != null)
			{
				if (!ValidateType(type, types))
				{
					VELVET_Error(element, editor, "'" + type + "' is not a valid type", null);
					return false;
				}
			}
			else
			{
				VELVET_Error(element, editor, "<supplies> must provide a type", null);
				return false;
			}
			
			// validate name
			if (name == null)
			{
				VELVET_Error(element, editor, "<supplies> must provide a name", null);
				return false;
			}
			else
			{
				var index = invalidwords.indexOf(" " + name + " ");
				if (index > -1)
				{
					VELVET_Error(element, editor, "<supplies> name'" + name + "' is not allowed since it's a reserved keyword", null);
					return false;
				}
				
				if (!name.isLowerCase())
				{
					VELVET_Error(element, editor, "<supplies> must have the 'name' value completely in lower case, consider using '" + name.toLowerCase() + "'", null);
					return false;
				}
			}
		}
		else
		{
			VELVET_Error(element, editor, "Push port only allows subtags of type <supplies>", null);
			return false;
		}
	}
	else if (kind.toUpperCase() == "PULL")
	{
		if (element.tagName == "expects")
		{
			var type = element.GetAttribute("type");
			var name = element.GetAttribute("name");
			if (type != null)
			{
				if (!ValidateType(type, types))
				{
					VELVET_Error(element, editor, "'" + type + "' is not a valid type", null);
					return false;
				}
			}
			else
			{
				VELVET_Error(element, editor, "<expects> must provide a type", null);
				return false;
			}
			
			// validate name
			if (name == null)
			{
				VELVET_Error(element, editor, "<expects> must provide a name", null);
				return false;
			}
			else
			{
				var index = invalidwords.indexOf(" " + name + " ");
				if (index > -1)
				{
					VELVET_Error(element, editor, "<expects> name'" + name + "' is not allowed since it's a reserved keyword", null);
					return false;
				}
				
				if (!name.isLowerCase())
				{
					VELVET_Error(element, editor, "<expects> must have the 'name' value completely in lower case, consider using '" + name.toLowerCase() + "'", null);
					return false;
				}
			}
		}
		else
		{
			VELVET_Error(element, editor, "Pull port only allows subtags of type <expects>", null);
			return false;
		}
	}
	else
	{
		VELVET_Warning(element, editor, "<port> is neither Pull nor Push, this should never happen", null);
	}
	return true;
}

//----------------------------------------------------------------------------
/**
	FIXME: How is a reference defined in SATIN?
	When we know this, run Esprima on the references.
*/
function ValidateCodeExt(element, session, editor)
{
	var text = element.content;
	
	return true;
}