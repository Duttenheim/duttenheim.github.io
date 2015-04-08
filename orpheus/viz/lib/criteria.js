//----------------------------------------
/**
	Constructor for criteria
*/
function Criterion(name)
{
	this.name = name;
	this.enabled = false;
	this.next = null;
	this.series = [];
}

//----------------------------------------
/**
	Make a chain of criterion with a data series in the end
	@param names is a list of names of the criteria
	@param data is a list of data series to be appended at the end of the chain
*/
function MakeCriterionChain(names, data)
{
	var criteria = [];
	var criterion;
	for (i = 0; i < names.length; i++)
	{
		criterion = new Criterion(names[i])
		if (criteria.length > 0) criteria[criteria.length-1].next = criterion;
		criteria.push(criterion);
	}
	
	for (i = 0; i < data.length; i++)
	{
		criterion.series.push(data[i]);
	}
	return criteria[0];
}

//----------------------------------------
/**
	Check if criteria matches, also recursively visits its next criteria if present, assumes the criterion argument is a list of criteria
*/
Criterion.prototype.Matches = function(criterion)
{
	return this.name == criterion.name;
}