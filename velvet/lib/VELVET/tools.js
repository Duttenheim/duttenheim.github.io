//----------------------------------------------------------------------------
/**
	Validates string in editor, puts an annotation in the editor if no correction string is provided.
	Otherwise corrects the string to the 'correctTo' value, this ensures syntax correctness.
*/
function VELVET_Error(row, editor, msg)
{
	var session = editor.getSession();
	var annots = session.getAnnotations();
	var annot = {row: row, col: 0, text: "Error: " + msg, type:"error"};
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
function VELVET_Warning(row, editor, msg)
{		
	var session = editor.getSession();
	var annots = session.getAnnotations();
	var annot = {row: row, col: 0, text: "Warning: " + msg, type:"warning"};
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
	Report runtime errors. Set the DIV prior to using this function
*/
var VELVET_RuntimeErrorDiv;
function VELVET_RuntimeError(msg)
{
	VELVET_RuntimeErrorDiv.innerHTML = msg;
}

//----------------------------------------------------------------------------
/**
	@param status 					The status state, must contain the status for the XML validation (.xml) and the status for the JS validation (.js).
	@param button 					The submit button, will be enabled/disabled based on the status. Pass 'null' if no button is present.
	@param xml_status 				The element which shows the XML validation status.
	@param js_status 				The element which shows the JS validation status.
	@param ok_class 				The style class used to display text which should be used for showing the validation has passed.
	@param error_class 				-||- has failed.
	@param button_enabled_class 	The style used for the button if interaction is enabled.
	@param button_disabled_class 	-||- if interaction is disabled.
*/
function ValidateComponent(status, button, xml_status, js_status, ok_class, error_class, button_enabled_class, button_disabled_class)
{
	if (!status.xml)
	{
		xml_status.innerHTML = "XML contains errors";
		xml_status.className = error_class;
		return false;
	}
	else
	{
		xml_status.innerHTML = "XML OK";
		xml_status.className = ok_class;
	}
	
	if (!status.js)
	{
		js_status.innerHTML = "JavaScript contains errors";
		js_status.className = error_class;
	}
	else
	{
		js_status.innerHTML = "JavaScript OK";
		js_status.className = ok_class;
	}
	
	if (button != null)
	{
		if (status.xml & status.js)
		{
			button.className = button_enabled_class;
			button.disabled = false;
		}
		else
		{
			button.className = button_disabled_class;
			button.disabled = true;
		}
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
		if (value != "true" && value != "false")
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
		// everything is fine as a string or custom type
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
	return (this.toLowerCase() == this);	
}