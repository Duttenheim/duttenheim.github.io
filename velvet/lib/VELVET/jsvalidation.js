//----------------------------------------------------------------------------
/**
	This function evaluates the JS using the special semantics. 
	In actuality, it's rather simple, find the make function, count the number of arguments, if they match we are good!
*/
function ValidateJS(contents, editor, requirements)
{	

	// this is the only use of jQuery, simply download all the API libs.
	for (apiIndex in requirements.apis)
	{
		var api = requirements.apis[apiIndex];
		$.getScript(api).fail(
		function(request, options, err)
		{
			alert(request.status);
			alert(err);
		});
	}
	
	try
	{
		var syntax = esprima.parse(contents, {loc : true});
		var makeFound = false;
		for (var i = 0; i < syntax.body.length; i++)
		{
			var symbol = syntax.body[i];
			if (symbol.type == "FunctionDeclaration")
			{
				if (symbol.id.name == "make_" + requirements.makeName)
				{
					makeFound = true;
					if (symbol.params.length == requirements.config.length + 2)
					{
						// yay, we have the right amount of params, check for names
						for (var j = 0; j < symbol.params.length-2; j++)
						{
							if (symbol.params[j].name != requirements.config[j].name)
							{
								VELVET_Error(symbol.loc.start.line-1, editor, "Function '" + symbol.id.name + "' input parameter names must match XML config parameters, got '" + symbol.params[j].name + "' but expected '" + requirements.config[j].name + "'");
								return false;
							}
						}
						
						// if we get this far, it means we have everything matching and we are all good!
					}
					else
					{
						VELVET_Error(symbol.loc.start.line-1, editor, "Function '" + symbol.id.name + "' doesn't have enough parameters, should be " + (requirements.config.length + 2) + " (configure params " + requirements.config.length +" + id and env)");
						return false;
					}
				}
				else if (symbol.id.name.beginsWith("make_"))
				{
					// if this function begins with 'make_', softly assume the developer wanted to use the make_ComponentName function, so give them this nice hint
					VELVET_Warning(symbol.loc.start.line-1, editor, "Function '" + symbol.id.name + "' must match make_" + requirements.makeName);					
				}
			}
		}
		
		if (!makeFound)
		{
			VELVET_Error(0, editor, "Function 'make_" + requirements.makeName + "' could not be found!");					
			return false;
		}
		
		// generate calling code
		var call = "document.write = function(s) { console.log(\"document.write() produced: '\" + s + \"'\") }\n\n";
		call += "var env = {";
		var i = 0;
		for (; i < requirements.ports.length; i++)
		{
			call += " " + requirements.ports[i].name + ":function(){}, ";
		}
		call += "};";
		
		call += "\n\nvar context = make_" + requirements.makeName + "(";
		for (i = 0; i < requirements.config.length; i++)
		{
			if (i > 0) call += ", ";
			call += requirements.config[i].def;
		}
		if (i > 0) call += ", ";
		call += "\"" + requirements.id + "\", env);";
		eval(contents + "\n" + call + "\nfor (var func in context) { context[func](); }");
	}
	catch (err)
	{
		var line;
		var message;
		if (err.lineNumber === undefined) 	line = 1;				// WHY ISN'T THIS STANDARDIZED ALREADY?!?!?!
		else								line = err.lineNumber;
		if (err.message === undefined)		message = err;
		else								message = err.message;
		VELVET_Error(line-1, editor, message);
		return false;
	}	
	return true;
}