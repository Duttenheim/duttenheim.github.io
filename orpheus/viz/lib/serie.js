//----------------------------------------
/**
	Constructor for serie. This is basically a container for data.
*/
function Serie(name, type)
{
	this.name = name;
	this.type = type;
	this.data = [];
}

//----------------------------------------
/**
*/
Serie.prototype.AddDataPoint = function(data)
{
	this.data.push(data);
}

