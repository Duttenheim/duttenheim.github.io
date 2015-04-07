//----------------------------------------
/**
	Constructor for criteria
*/
function Criteria(name, type)
{
	this.name = name;
	this.type = type;
	this.enabled = false;
	this.data = [];
}

//----------------------------------------
/**
*/
Criteria.prototype.AddDataPoint = function(data)
{
	this.data.push(data);
}