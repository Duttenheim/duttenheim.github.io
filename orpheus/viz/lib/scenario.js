//----------------------------------------
/**
	Opens a new scenario from a file object.
	@param file is a File object (which is not explicitly constructed) as described in the JavaScript.
*/
function Scenario(file)
{
	this.data = new Map();
}

//----------------------------------------
/**
*/
Scenario.prototype.LoadFromFile = function(file)
{
	if (file)
	{
		var reader = new FileReader();
		reader.readAsText(file);
		var scenario = this;
		reader.onloadend = function()
		{
			var parser = new DOMParser();
			var document = parser.parseFromString(reader.result, "text/xml");
			if (document.documentElement.nodeName == "parsererror")
			{
				errStr = xmlDoc.documentElement.childNodes[0].nodeValue;
				errStr = errStr.replace(/</g, "&lt;");
				document.write(errStr);
			}
			else
			{
				// treat the file and load scenarios
				scenario.Load(document);
				scenario.OnLoaded();
			}
		}
	}
	else
	{
	
	}
}

//----------------------------------------
/**
*/
Scenario.prototype.LoadFromString = function(string)
{
	var parser = new DOMParser();
	var document = parser.parseFromString(string, "text/xml");
	if (document.documentElement.nodeName == "parsererror")
	{
		errStr = xmlDoc.documentElement.childNodes[0].nodeValue;
		errStr = errStr.replace(/</g, "&lt;");
		document.write(errStr);
	}
	else
	{
		// treat the file and load scenarios
		this.Load(document);
		this.OnLoaded();
	}
}

//----------------------------------------
/**
*/
Scenario.prototype.OnLoaded = function()
{
	// override me!
}

//----------------------------------------
/**
	Load internal structure for a simulation scenario from an XML document.
	@param document XML document representing the scenario and its data series.
*/
Scenario.prototype.Load = function(document)
{
	var dataSourceNode = document.getElementsByTagName("DataSources")[0];
	var children = dataSourceNode.children;
	for (var i = 0; i < children.length; i++)
	{
		var node = children[i];
		var name = node.getAttribute("name");
		var type = node.getAttribute("type");
		var file = node.getAttribute("file");
		this.data.set(name, {'type': type, 'src': file});
	}
}