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
function ValidateXML(contents, editor, requirements)
{
	// reset requirements
	requirements.config = [];

	// parse using custom XML parser
	xmlparser = new XMLParser();
	xmlparser.Parse(contents);
	
	// first check for XML errors
	if (xmlparser.error != null)
	{
		VELVET_Error(xmlparser.errorRow, editor, "Syntax: " + xmlparser.error);
		return false;
	}
		
	// first, check if the first element is <component>
	var root = xmlparser.rootNode;
	if (root == null)
	{
		VELVET_Error(0, editor, "Component XML cannot be empty");
		return false;
	}
	
	if (root.tagName != "component")
	{
		VELVET_Error(root.row, editor, "Component must start with <component>");
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
			if (bits & XMLTagBits.Icon) { VELVET_Warning(elem.row, editor, "<icon> already defined, ignoring this for the previous definition"); continue; }
			if (!ValidateIcon(elem, editor)) return false;
			bits |= XMLTagBits.Icon;
		}
		else if (elem.tagName == "previewImage")
		{
			if (bits & XMLTagBits.Preview) { VELVET_Warning(elem.row, editor, "<previewImage> already defined, ignoring this for the previous definition"); continue; }
			if (!ValidatePreviewImage(elem, editor)) return false;
			bits |= XMLTagBits.Preview;
		}
		else if (elem.tagName == "name")
		{
			if (bits & XMLTagBits.Name) { VELVET_Warning(elem.row, editor, "<name> already defined, ignoring this for the previous definition"); continue; }
			
			// set name in requirements
			requirements.makeName = elem.content;
			
			// do nothing, valid tag can contain any data
			bits |= XMLTagBits.Name;
		}
		else if (elem.tagName == "info")
		{
			if (bits & XMLTagBits.Info) { VELVET_Warning(elem.row, editor, "<info> already defined, ignoring this for the previous definition"); continue; }
			// -||-
			bits |= XMLTagBits.Info;
		}
		else if (elem.tagName == "interface")
		{
			if (bits & XMLTagBits.Interface) { VELVET_Warning(elem.row, editor, "<interface> already defined, ignoring this for the previous definition"); continue; }
			
			// run interface stuff through XML parser, if we have any errors in the HTML, the parser will detect them
			var interfaceparser = new XMLParser();
			interfaceparser.acceptAttributeQualifiers = true;
			interfaceparser.Parse("<interface-root>" + elem.cdata + "</interface-root>");
			
			// check if we got errors
			if (interfaceparser.error != null)
			{
				VELVET_Error(elem.cdataStartRow + interfaceparser.errorRow, editor, interfaceparser.error);
				return false;
			}
			
			// validate interface
			var interface_root = interfaceparser.rootNode;
			
			// get children if there are any
			var elements = interface_root.children;
			if (elements.length > 1)
			{
				VELVET_Error(elem.cdataStartRow + elements[0].row, editor, "<interface> may only declare one tag as the root element");
				return false;
			}
			else if (elements.length == 1)
			{
				var interfaceRoot = elements[0];
				var id = interfaceRoot.GetAttribute("id");
				if (id == null)
				{
					VELVET_Error(elem.cdataStartRow + interfaceRoot.row, editor, "Root interface element must define attribute 'id'");
					return false;
				}
				else
				{
					// all cool and dandy, set id in requirements
					requirements.id = id;
				}
			}
			else
			{
				// add automatic placeholder div
				elem.cdata = "<div id='PlaceholderDiv'>" + elem.cdata + "</div>";
				requirements.id = "PlaceholderDiv"; 
			}
			
			requirements.interfaces = elem.cdata;
			bits |= XMLTagBits.Interface;
		}
		else if (elem.tagName == "config")
		{
			if (bits & XMLTagBits.Config) { VELVET_Warning(elem.row, editor, "<config> already defined, ignoring this for the previous definition"); continue; }
			if (!ValidateConfig(elem, editor, requirements)) return false;
			bits |= XMLTagBits.Config;
		}
		else if (elem.tagName == "requires")
		{
			if (bits & XMLTagBits.Requires) { VELVET_Warning(elem.row, editor, "<requires> already defined, ignoring this for the previous definition"); continue; }
			if (!ValidateRequires(elem, editor, requirements)) return false;
			bits |= XMLTagBits.Requires;
		}
		else if (elem.tagName == "provides")
		{
			if (bits & XMLTagBits.Provides) { VELVET_Warning(elem.row, editor, "<provides> already defined, ignoring this for the previous definition"); continue; }
			if (!ValidateProvides(elem, editor, requirements)) return false;
			bits |= XMLTagBits.Provides;
		}
		else if (elem.tagName == "code_ext")
		{
			if (bits & XMLTagBits.CodeExt) { VELVET_Warning(elem.row, editor, "<code_ext> already defined, ignoring this for the previous definition"); continue; }
			if (!ValidateCodeExt(elem, editor)) return false;
			bits |= XMLTagBits.CodeExt;
		}
		else if (elem.tagName == "apis")
		{
			if (bits & XMLTagBits.APIs) { VELVET_Warning(elem.row, editor, "<apis> already defined, ignoring this for the previous definition"); continue; }
			
			var apiparser = new XMLParser();
			apiparser.Parse("<include-root>" + elem.cdata + "</include-root>");
			
			// check if we got errors
			if (apiparser.error != null)
			{
				VELVET_Error(elem.cdataStartRow + apiparser.errorRow, editor, apiparser.error);
				return false;
			}
			
			// get include header
			var header = apiparser.rootNode;
			var apielems = header.children;
			for (var j = 0; j < apielems.length; j++)
			{
				var apielem = apielems[j];
				if (apielem.tagName == "script")
				{
					var src = apielem.GetAttribute("src");
					if (src == null)
					{
						VELVET_Error(elem.row + apielem.row, editor, "<script> tag must define attribute 'src'. If the script doesn't need an external source, just put the JavaScript code here.");
						return false;
					}
					else
					{
						requirements.apis.push(src);
					}
				}
			}
			
			// accept everything
			bits |= XMLTagBits.APIs;
		}
	}
	
	// check if all required tags are used
	if (!(bits & XMLTagBits.Name))
	{
		VELVET_Error(root.row, editor, "<name> tag is required");
		return false;
	}
	
	if (!(bits & XMLTagBits.Icon))
	{
		VELVET_Error(root.row, editor, "<icon> tag is required");
		return false;
	}
	
	if (!(bits & XMLTagBits.Preview) && (bits & XMLTagBits.Interface))
	{
		VELVET_Error(root.row, editor, "<previewImage> tag is required if the <interface> is defined");
		return false;
	}
	
	if (!(bits & XMLTagBits.Info))
	{
		VELVET_Error(root.row, editor, "<info> tag is required");
		return false;
	}
	
	if (!(bits & XMLTagBits.Config))
	{
		VELVET_Error(root.row, editor, "<config> tag is required");
		return false;
	}
	
	return true;
}

//----------------------------------------------------------------------------
/**
	Validates <icon> tag, basically check if the icon is available
*/
function ValidateIcon(element, editor)
{
	var img = document.body.appendChild(document.createElement("img"));
    img.onload = function()
    {
		document.body.removeChild(img);
    };
    img.onerror = function()
    {
		VELVET_Warning(element.row, editor, "Could not get icon image");
		document.body.removeChild(img);
    };
    img.src = element.content;
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidatePreviewImage(element, editor)
{
	var img = document.body.appendChild(document.createElement("img"));
    img.onload = function()
    {
		document.body.removeChild(img);
    };
    img.onerror = function()
    {
		VELVET_Warning(element.row, editor, "Could not get preview image");
		document.body.removeChild(img);
    };
    img.src = element.content;
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidateConfig(element, editor, requirements)
{
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		var elem = elements[i];
		if (elem.tagName != "param")
		{
			VELVET_Error(elem.row, editor, "<config> only allows subtags as <param>");
			return false;
		}
		else
		{
			if (!ValidateParam(elem, editor, requirements)) return false;
		}
	}
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidateParam(element, editor, requirements)
{
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		var elem = elements[i];
		if (elem.tagName != "description")
		{
			VELVET_Error(elem.row, editor, "<param> only allows a <description> tag");
			return false;
		}
		else if (i > 0)
		{
			VELVET_Error(elem.row, editor, "<param> only allows a single <description tag>");
			return false;		
		}
		else
		{
			var elems = elem.children;
			if (elems.length > 0)
			{
				VELVET_VELVET_Error(elem, editor, "<description> allows no children, forgot to close it maybe?");
				return false;
			}
		}
	}
	
	var name = element.GetAttribute("name");
	var type = element.GetAttribute("type");
	var defval = element.GetAttribute("default");
	
	if (name == null)
	{
		VELVET_Error(element.row, editor, "<param> must contain attribute 'name'");
		return false;
	}
	else
	{
		var firstchar = name.substring(0, 1);
		if (firstchar == firstchar.toUpperCase())
		{
			VELVET_Error(element.row, editor, "<param> must have the 'name' value completely in lower case, consider using '" + name.toLowerCase() + "'");
			return false;
		}
	}
	
	if (type == null)
	{
		VELVET_Error(element.row, editor, "<param> must contain attribute 'type'");
		return false;		
	}
	else
	{
		if (type != "Bool" && type != "Int" && type != "String" && type != "Float")
		{
			VELVET_Error(element.row, editor, "<param> must use a defined type (Bool, Int, String, Float)");
			return false;		
		}
	}
	
	if (defval == null)
	{
		VELVET_Error(element.row, editor, "<param> must contain attribute 'default'");
		return false;		
	}
	else
	{
		var message = ValidateTypeValue(type, defval);
		if (message != null)
		{
			VELVET_Error(element.row, editor, "<param> " + message);
			return false;		
		}
	}
	
	// add to configure
	if (type == "String") defval = "\"" + defval + "\"";
	requirements.config.push({name: name, def: defval});
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidateRequires(element, editor, requirements)
{
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		var elem = elements[i];
		if (elem.tagName != "port")
		{
			VELVET_Error(elem.row, editor, "<requires> only allows subtags as <port>");
			return false;
		}
		else
		{
			if (!ValidatePort(elem, editor, requirements)) return false;
		}
	}
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function ValidateProvides(element, editor, requirements)
{
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		var elem = elements[i];
		if (elem.tagName != "port")
		{
			VELVET_Error(elem.row, editor, "<provides> only allows subtags as <port>");
			return false;
		}
		else
		{
			if (!ValidatePort(elem, editor, requirements)) return false;
		}
	}
	return true;
}


var invalidwords = " abort action after array before case class data default deriving do else elsif forall if import instance in let module new of private raise request result send struct then self typeclass uniarray use where ";
var SATIN_Types = ['Bool', 'Int', 'String', 'Char', 'Float', '[Bool]', '[Int]', '[String]', '[Char]', '[Float]'];
//----------------------------------------------------------------------------
/**
	TODO:
	 Somehow get all the custom types in the SATIN environment and make sure our ports conform to any of those types.
*/
function ValidatePort(element, editor, requirements)
{	
	var kind = element.GetAttribute("kind");
	var name = element.GetAttribute("name");
	var resulttype = element.GetAttribute("resulttype");
	var argtype = element.GetAttribute("argtype");
	
	// validate the kind of port
	if (kind == null)
	{
		VELVET_Error(element.row, editor, "<port> must have attribute 'kind' (push, pull)");
		return false;
	}
	else
	{
		if (kind.toUpperCase() == "PUSH")
		{
			if (resulttype != null)
			{
				VELVET_Warning(element.row, editor, "<port> of type 'push' have no use of 'resulttype', did you mean to use 'argtype'?");
			}
			else if (argtype != null)
			{
				if (!ValidateType(argtype, SATIN_Types))
				{
					VELVET_Error(element.row, editor, "<port> '" + argtype + "' does not name a defined type");
					return false;
				}
			}
			else
			{
				// not a bug, it is okay to not define an argtype for PUSH-ports
				VELVET_Warning(element.row, editor, "<port> 'argtype' is not defined");
			}
		}
		else if (kind.toUpperCase() == "PULL")
		{
			if (argtype != null)
			{
				VELVET_Warning(element.row, editor, "<port> of type 'pull' have no use of 'argtype', did you mean to use 'resulttype'?");
			}
			else if (resulttype != null)
			{
				if (!ValidateType(resulttype, SATIN_Types))
				{
					VELVET_Error(element.row, editor, "<port> '" + resulttype + "' does not name a defined type");
					return false;
				}
			}
			else
			{
				VELVET_Error(element.row, editor, "<port> 'resulttype' is not defined");
				return false;
			}
		}
	}
	
	// validate name
	if (name == null)
	{
		VELVET_Error(element.row, editor, "<port> must have attribute 'name'");
		return false;
	}
	else
	{
		if (!name.isLowerCase())
		{
			VELVET_Error(element.row, editor, "<port> must have the 'name' value completely in lower case, consider using '" + name.toLowerCase() + "'");
			return false;
		}
		
		var index = invalidwords.indexOf(" " + name + " ");
		if (index > -1)
		{
			VELVET_Error(element, editor, "<port> name'" + name + "' is not allowed since it's a reserved keyword");
			return false;
		}
	}
	
	// parse optional subtags, namely expects and supplies
	var elements = element.children;
	for (var i = 0; i < elements.length; i++)
	{
		var element = elements[i];
		if (element.tagName == "supplies")
		{
			if (!Port_ValidateSupplies(element, kind, editor)) return false;
		}
		else if (element.tagName == "requires")
		{
			if (!Port_ValidateRequires(element, kind, editor)) return false;
		}
		else if (element.tagName == "description")
		{
			continue;	// just accept
		}
		else
		{
			VELVET_Error(element.row, editor, "<port> only accepts <requires> or <supplies> and <description> as subtags");
			return false;
		}
		
	}
	
	// add to requirements
	requirements.ports.push({name: name});
	
	return true;
}


//----------------------------------------------------------------------------
/**
*/
function Port_ValidateRequires(element, kind, editor)
{
	if (kind.toUpperCase() == "PULL")
	{
		var type = element.GetAttribute("type");
		var name = element.GetAttribute("name");
		if (type != null)
		{
			if (!ValidateType(type, SATIN_Types))
			{
				VELVET_Error(element.row, editor, "'" + type + "' is not a valid type");
				return false;
			}
		}
		else
		{
			VELVET_Error(element.row, editor, "<expects> must provide a type");
			return false;
		}
		
		// validate name
		if (name == null)
		{
			VELVET_Error(element.row, editor, "<expects> must provide a name");
			return false;
		}
		else
		{
			var index = invalidwords.indexOf(" " + name + " ");
			if (index > -1)
			{
				VELVET_Error(element.row, editor, "<expects> name'" + name + "' is not allowed since it's a reserved keyword");
				return false;
			}
			
			if (!name.isLowerCase())
			{
				VELVET_Error(element.row, editor, "<expects> must have the 'name' value completely in lower case, consider using '" + name.toLowerCase() + "'");
				return false;
			}
		}
	}
	else
	{
		VELVET_Error(element.row, editor, "Pull port only allows subtags of type <expects>");
		return false;
	}
	return true;
}

//----------------------------------------------------------------------------
/**
*/
function Port_ValidateSupplies(element, kind, editor)
{
	if (kind.toUpperCase() == "PUSH")
	{
		var type = element.GetAttribute("type");
		var name = element.GetAttribute("name");
		if (type != null)
		{
			if (!ValidateType(type, SATIN_Types))
			{
				VELVET_Error(element.row, editor, "'" + type + "' is not a valid type");
				return false;
			}
		}
		else
		{
			VELVET_Error(element.row, editor, "<supplies> must provide a type");
			return false;
		}
		
		// validate name
		if (name == null)
		{
			VELVET_Error(element.row, editor, "<supplies> must provide a name");
			return false;
		}
		else
		{
			var index = invalidwords.indexOf(" " + name + " ");
			if (index > -1)
			{
				VELVET_Error(element.row, editor, "<supplies> name'" + name + "' is not allowed since it's a reserved keyword");
				return false;
			}
			
			if (!name.isLowerCase())
			{
				VELVET_Error(element.row, editor, "<supplies> must have the 'name' value completely in lower case, consider using '" + name.toLowerCase() + "'");
				return false;
			}
		}
	}
	else
	{
		VELVET_Error(element.row, editor, "Push port only allows subtags of type <supplies>");
		return false;
	}
	return true;
}

//----------------------------------------------------------------------------
/**
	FIXME: How is a reference defined in SATIN?
	When we know this, run Esprima on the references.
*/
function ValidateCodeExt(element, editor)
{
	var text = element.content;
	
	return true;
}