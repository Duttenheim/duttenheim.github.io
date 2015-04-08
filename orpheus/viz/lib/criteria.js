//----------------------------------------
/**
	Constructor for criteria
*/
function Criterion(name, type)
{
	this.name = name;
	this.type = type;
	this.enabled = false;
	this.data = [];
	
	this.children = [];
	this.next = null;
	this.series = [];
}

//----------------------------------------
/**
*/
Criterion.prototype.AddDataPoint = function(data)
{
	this.data.push(data);
}

//----------------------------------------
/**
	Adds a criteria to the criteria chain 
*/
Criterion.prototype.PushCriterion = function(criteria)
{
	if (this.serie != null)
	{
		throw "Can only chain criteria if we don't have any data attached to this criteria";
	}
	this.children.push(criteria);
}

//----------------------------------------
/**
	Adds a criteria to the criteria chain 
*/
Criterion.prototype.AttachSerie = function(serie)
{
	if (this.children.length != 0)
	{
		throw "Can not attach a serie to a criteria if we have another criteria in the chain";
	}
	this.series.push(serie);
}

//----------------------------------------
/**
	Check if criteria matches, also recursively visits its next criteria if present, assumes the criterion argument is a list of criteria
*/
Criterion.prototype.Matches = function(criterion)
{
	var list = criterion;
	var result = false;
	for (i = 0; i < list.length; i++)
	{
		var crit = list[i];
		if (crit.name == this.name)
		{
			// woop, criteria found, remove from the match list and break loop
			list = list.slice(i, 1);
			result = true;
			break;
		}
	}
	if (this.next != null) result = this.next.Matches(list);
	return result;
}