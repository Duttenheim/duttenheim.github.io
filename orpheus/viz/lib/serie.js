//----------------------------------------
/**
	Constructor for serie. This is basically a container for data.
*/
function Serie(name, type, dataSwitch)
{
	this.name = name;
	this.type = type;
	this.dataSwitch = dataSwitch;
	this.data = [];
}

//----------------------------------------
/**
*/
Serie.prototype.AddDataPoint = function(data)
{
	this.data.push(data);
}

