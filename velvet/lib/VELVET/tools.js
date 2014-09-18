//----------------------------------------------------------------------------
/**
	Validates string in editor, puts an annotation in the editor if no correction string is provided.
	Otherwise corrects the string to the 'correctTo' value, this ensures syntax correctness.
*/
function VELVET_Error(received, editor, msg, correctTo)
{
	if (correctTo != null)
	{
		var pos = editor.getCursorPosition();
		var selection = editor.getSelection();
		
		editor.find(received, {start: {row: pos.row-1, column: 0}}, true);
		editor.replace(correctTo);
	}
	else
	{		
		var session = editor.getSession();
		var annots = session.getAnnotations();
		var annot = {row: received.row, col: 0, text: "Semantic: " + msg, type:"error"};
		if (annots != null)
		{
			annots.push(annot);
			session.setAnnotations(annots);
		}
		else
		{
			session.setAnnotations([annot]);
		}
	}
}

//----------------------------------------------------------------------------
/**
*/
function VELVET_Warning(received, editor, msg)
{		
		var session = editor.getSession();
		var annots = session.getAnnotations();
		var annot = {row: received.row, col: 0, text: "Semantic: " + msg, type:"warning"};
		if (annots != null)
		{
			annots.push(annot);
			session.setAnnotations(annots);
		}
		else
		{
			session.setAnnotations([annot]);
		}
}

//----------------------------------------------------------------------------
/**
*/
function ValidateComponent(status, button, xml_status, js_status)
{
	if (!status.xml)
	{
		xml_status.innerHTML = "XML contains errors";
		xml_status.className = "p-error";
	}
	else
	{
		xml_status.innerHTML = "XML OK";
		xml_status.className = "p-ok";
	}
	
	if (!status.js)
	{
		js_status.innerHTML = "JavaScript contains errors";
		js_status.className = "p-error";
	}
	else
	{
		js_status.innerHTML = "JavaScript OK";
		js_status.className = "p-ok";
	}
	
	if (status.xml & status.js)
	{
		button.className = "button-enabled";
		button.disabled = false;
	}
	else
	{
		button.className = "button-disabled";
		button.disabled = true;
	}
}

//----------------------------------------------------------------------------
/**
	Check if type matches the selected value, types are defined as Int, Bool, String or Float
*/
function ValidateTypeValue(type, value)
{
	if (type == "Bool")
	{
		if (defval != "True" && defval != "False")
		{
			return "default value must be either 'True' or 'False' for Bool";

		}
	}
	else if (type == "Int" || type == "Float")
	{
		if (isNaN(value))
		{
			return "default value must be digit(s) for Int or Float";
		}
	}
	else
	{
		// everything is fine as a string
		return null;
	}
}

//----------------------------------------------------------------------------
/**
*/
function ValidateType(type, allowedtypes)
{
	for (var i = 0; i < allowedtypes.length; i++)
	{
		var allowedtype = allowedtypes[i];
		if (type == allowedtype) return true;
	}
	return false;
}

//----------------------------------------------------------------------------
/**
	Simple thing which doesn't exist in JavaScript natively.
	Checks if a string begins with another string, so simple yet not standard...
*/
String.prototype.beginsWith = function(pattern)
{
	var segment = this.slice(0, pattern.length);
	if (segment == pattern) return true;
	return false;
}

//----------------------------------------------------------------------------
/**
	Check if string is completely lower case
*/
String.prototype.isLowerCase = function()
{
	for (var i = 0; i < this.length; i++)
	{
		if (this.charAt(i) == this.charAt(i).toUpperCase()) return false;
	}
	return true;
}